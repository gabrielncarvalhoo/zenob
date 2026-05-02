let _clerkClient: any = null;
let _initialized = false;

export function getClerkClient() {
  if (_initialized) return _clerkClient;
  if (!process.env.CLERK_SECRET_KEY) {
    _initialized = true;
    return null;
  }
  try {
    const { Clerk } = require('@clerk/clerk-sdk-node');
    _clerkClient = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
    _initialized = true;
    return _clerkClient;
  } catch {
    _initialized = true;
    return null;
  }
}