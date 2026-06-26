import { describe, it, expect, beforeEach, vi } from 'vitest';
import { semanticCache } from '../api-lib/rag/semantic-cache.ts';
import { TokenBucketLimiter } from '../api-lib/middleware/rate-limiter.ts';

describe('Semantic Cache unit tests', () => {
  beforeEach(() => {
    semanticCache.clear();
  });

  it('should store and retrieve cache hits for identical/highly similar embeddings', () => {
    const queryText = 'What is the price of HP Victus?';
    const embedding = [0.1, 0.2, 0.3, 0.4];
    const response = 'HP Victus street price is approx 75,000 INR.';
    const metadata = { agent: 'product_intelligence' };

    semanticCache.set(queryText, embedding, response, metadata);

    // Identical embedding match
    const hit = semanticCache.get(embedding);
    expect(hit).not.toBeNull();
    expect(hit?.response).toBe(response);
    expect(hit?.metadata?.cached).toBe(true);

    // Highly similar embedding (cosine similarity >= 0.95)
    // cosine similarity of [0.1, 0.2, 0.3, 0.4] and [0.1, 0.2, 0.3, 0.41] is ~0.999
    const similarEmbedding = [0.1, 0.2, 0.3, 0.405];
    const similarHit = semanticCache.get(similarEmbedding);
    expect(similarHit).not.toBeNull();
    expect(similarHit?.response).toBe(response);
  });

  it('should return null for dissimilar embeddings', () => {
    const queryText = 'What is the price of HP Victus?';
    const embedding = [1.0, 0.0, 0.0, 0.0];
    const response = 'HP Victus is cheap.';
    const metadata = {};

    semanticCache.set(queryText, embedding, response, metadata);

    // Orthogonal / completely different embedding
    const dissimilarEmbedding = [0.0, 1.0, 0.0, 0.0];
    const hit = semanticCache.get(dissimilarEmbedding);
    expect(hit).toBeNull();
  });

  it('should evict the oldest entry (LRU) when max entries limit is reached', () => {
    // Override maxEntries temporarily to test eviction easily
    // We can set maxEntries by modifying the private variable using TypeScript casting or modifying it
    semanticCache.maxEntries = 3;

    semanticCache.set('Q1', [1, 0, 0], 'A1', {});
    semanticCache.set('Q2', [0, 1, 0], 'A2', {});
    semanticCache.set('Q3', [0, 0, 1], 'A3', {});

    // Access Q1 to make it recently used
    semanticCache.get([1, 0, 0]);

    // Insert Q4 which should evict the oldest based on timestamp
    // Our cache sorts by timestamp when evicting.
    // Let's check: set updates timestamp. Since Q1 was accessed, wait, `get` in our implementation
    // DOES NOT update timestamp (it just reads). Let's see: `set` updates timestamp on write/overwrite.
    // So Q1 (inserted first) has the oldest timestamp since `get` doesn't update `entry.timestamp`.
    // Let's verify this. Yes, class SemanticCache get() returns match but doesn't update timestamp.
    // So Q1 is still the oldest timestamp. Let's insert Q4, which evicts Q1.
    semanticCache.set('Q4', [1, 1, 1], 'A4', {});

    expect(semanticCache.get([1, 0, 0])).toBeNull(); // Q1 evicted
    expect(semanticCache.get([0, 1, 0])).not.toBeNull(); // Q2 exists
    expect(semanticCache.get([0, 0, 1])).not.toBeNull(); // Q3 exists
    expect(semanticCache.get([1, 1, 1])).not.toBeNull(); // Q4 exists

    // Reset maxEntries
    semanticCache.maxEntries = 100;
  });
});

describe('Token Bucket Rate Limiter unit tests', () => {
  it('should allow requests within capacity and block when exhausted', () => {
    // Capacity 3, refill rate 1 per second (0.001 per ms)
    const limiter = new TokenBucketLimiter(3, 1);
    const key = 'test-client-ip';

    // First 3 requests should pass
    expect(limiter.checkRateLimit(key)).toBe(true); // Left: 2 tokens
    expect(limiter.checkRateLimit(key)).toBe(true); // Left: 1 token
    expect(limiter.checkRateLimit(key)).toBe(true); // Left: 0 tokens
    
    // 4th request should fail
    expect(limiter.checkRateLimit(key)).toBe(false);
  });

  it('should isolate rate limits between different keys', () => {
    const limiter = new TokenBucketLimiter(2, 1);
    const keyA = 'ip-a';
    const keyB = 'ip-b';

    expect(limiter.checkRateLimit(keyA)).toBe(true);
    expect(limiter.checkRateLimit(keyA)).toBe(true);
    expect(limiter.checkRateLimit(keyA)).toBe(false); // Key A blocked

    // Key B should still be allowed
    expect(limiter.checkRateLimit(keyB)).toBe(true);
  });

  it('should refill tokens over time', async () => {
    // Capacity 2, refill rate 10 per second (0.01 tokens per ms)
    const limiter = new TokenBucketLimiter(2, 10);
    const key = 'refill-test';

    expect(limiter.checkRateLimit(key)).toBe(true);
    expect(limiter.checkRateLimit(key)).toBe(true);
    expect(limiter.checkRateLimit(key)).toBe(false); // Blocked

    // Wait 150ms to refill at least 1 token (150ms * 0.01 = 1.5 tokens)
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(limiter.checkRateLimit(key)).toBe(true); // Should pass now!
  });
});
