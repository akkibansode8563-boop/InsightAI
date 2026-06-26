import { cosineSimilarity } from './advanced-rag.js';

interface CacheEntry {
  queryText: string;
  embedding: number[];
  response: string;
  metadata: any;
  timestamp: number;
}

class SemanticCache {
  private cache: CacheEntry[] = [];
  private maxEntries = 100;

  constructor() {}

  get(embedding: number[]): { response: string; metadata: any } | null {
    if (this.cache.length === 0) return null;
    
    let bestMatch: CacheEntry | null = null;
    let highestSimilarity = 0;

    for (const entry of this.cache) {
      const similarity = cosineSimilarity(embedding, entry.embedding);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    // Similarity threshold 0.95 (very high semantic equivalence)
    if (highestSimilarity >= 0.95 && bestMatch) {
      console.log(`[Semantic Cache] HIT! Similarity: ${Math.round(highestSimilarity * 100)}% for query: "${bestMatch.queryText}"`);
      return {
        response: bestMatch.response,
        metadata: {
          ...bestMatch.metadata,
          cached: true,
          cacheSimilarity: highestSimilarity
        }
      };
    }

    return null;
  }

  set(queryText: string, embedding: number[], response: string, metadata: any): void {
    // Prevent duplicate entries
    const existing = this.cache.find(e => e.queryText.toLowerCase() === queryText.toLowerCase());
    if (existing) {
      existing.response = response;
      existing.metadata = metadata;
      existing.timestamp = Date.now();
      return;
    }

    if (this.cache.length >= this.maxEntries) {
      // LRU eviction: remove oldest
      this.cache.sort((a, b) => a.timestamp - b.timestamp);
      this.cache.shift();
    }

    this.cache.push({
      queryText,
      embedding,
      response,
      metadata,
      timestamp: Date.now()
    });
    console.log(`[Semantic Cache] Stored response for: "${queryText}"`);
  }

  clear(): void {
    this.cache = [];
  }
}

export const semanticCache = new SemanticCache();
