interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class TokenBucketLimiter {
  private buckets = new Map<string, Bucket>();
  private capacity: number;
  private refillRate: number; // tokens per millisecond

  constructor(capacity = 20, refillRatePerSec = 2) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec / 1000;
  }

  public checkRateLimit(key: string): boolean {
    const now = Date.now();
    
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.capacity - 1,
        lastRefill: now
      });
      return true;
    }

    const bucket = this.buckets.get(key)!;
    const elapsed = now - bucket.lastRefill;
    
    const refilledTokens = bucket.tokens + (elapsed * this.refillRate);
    bucket.tokens = Math.min(this.capacity, refilledTokens);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}

export const rateLimiter = new TokenBucketLimiter(20, 2);
