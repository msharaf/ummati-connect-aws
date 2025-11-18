/**
 * Clerk configuration utilities
 * Workaround for Next.js 14 cache invalidation issues
 */

// Suppress the error if invalidateCacheAction fails
// This happens because Clerk tries to use server actions from client components
if (typeof window !== 'undefined') {
  // Override console.error to catch and suppress the specific error
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    
    // Suppress the specific requestAsyncStorage error from Clerk
    if (
      errorMessage.includes('requestAsyncStorage') ||
      errorMessage.includes('invalidateCacheAction') ||
      (errorMessage.includes('cookies()') && errorMessage.includes('Clerk'))
    ) {
      // Log a warning instead of error to avoid breaking the app
      console.warn('Clerk cache invalidation skipped (expected in client component)');
      return;
    }
    
    // Call original console.error for all other errors
    originalConsoleError.apply(console, args);
  };
}

