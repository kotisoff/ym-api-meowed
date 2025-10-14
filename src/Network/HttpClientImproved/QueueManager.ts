export class QueueManager {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private maxConcurrent = 50) {}

  async enqueue<T>(executor: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await executor();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}
