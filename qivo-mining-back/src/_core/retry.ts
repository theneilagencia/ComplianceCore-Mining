/**
 * Retry utility with exponential backoff
 * Used for async operations that may fail temporarily
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for next retry attempt using exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with the result of the function
 * @throws Error if all retry attempts fail
 * 
 * @example
 * ```typescript
 * const result = await retryAsync(
 *   () => fetchDataFromAPI(),
 *   {
 *     maxAttempts: 3,
 *     initialDelayMs: 1000,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry attempt ${attempt}: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) {
        console.error(
          `[Retry] All ${opts.maxAttempts} attempts failed. Last error:`,
          lastError.message
        );
        throw lastError;
      }

      const delay = calculateDelay(attempt, opts);
      console.warn(
        `[Retry] Attempt ${attempt}/${opts.maxAttempts} failed: ${lastError.message}. Retrying in ${delay}ms...`
      );

      opts.onRetry(lastError, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Create a retry wrapper function with pre-configured options
 * 
 * @example
 * ```typescript
 * const retryWithDefaults = createRetryWrapper({
 *   maxAttempts: 5,
 *   initialDelayMs: 2000,
 * });
 * 
 * const result = await retryWithDefaults(() => riskyOperation());
 * ```
 */
export function createRetryWrapper(options: RetryOptions) {
  return <T>(fn: () => Promise<T>) => retryAsync(fn, options);
}
