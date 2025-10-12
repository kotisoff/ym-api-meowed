export class RateLimiter {
  private timestamps: number[] = [];
  private max: number;
  private window: number;

  constructor(config?: { maxRequests?: number; windowMs?: number }) {
    this.max = config?.maxRequests ?? 100;
    this.window = config?.windowMs ?? 60_000;
  }

  async wait() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.window);
    if (this.timestamps.length >= this.max) {
      const delay = this.timestamps[0] + this.window - now;
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
    }
    this.timestamps.push(Date.now());
  }
}
