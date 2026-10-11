/**
 * Next.js Instrumentation Hook
 * Runs once at server startup, before any routes are handled.
 *
 * Purpose: Force Node.js to use Google DNS servers so that
 * mongodb+srv:// SRV record lookups succeed. The local router
 * DNS (192.168.x.x) does not support SRV record resolution
 * which causes "querySrv ECONNREFUSED" errors with MongoDB Atlas.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setServers } = await import('dns');
    setServers(['8.8.8.8', '8.8.4.4']);
    console.log('[instrumentation] DNS servers set to Google (8.8.8.8, 8.8.4.4)');
  }
}
