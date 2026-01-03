export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Request timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  onError?: (error: unknown, attempt: number) => void
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (onError) onError(error, i + 1);
      if (i === retries - 1) throw error;
    }
  }
  throw new Error("Retry failed");
}
