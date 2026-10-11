import jwt from 'jsonwebtoken';

// Must be set in .env.local. Falls back to a development-only default.
const CUSTOMER_JWT_SECRET =
  process.env.CUSTOMER_JWT_SECRET || 'CustomerStorefrontJWTsecretKey2024';
const CUSTOMER_JWT_EXPIRES_IN = process.env.CUSTOMER_JWT_EXPIRES_IN || '30d';

/**
 * Sign a JWT token for a storefront customer.
 * Payload typically includes: { id, email, name, role }
 */
export function signCustomerToken(payload, expiresIn = CUSTOMER_JWT_EXPIRES_IN) {
  return jwt.sign(payload, CUSTOMER_JWT_SECRET, { expiresIn });
}

/**
 * Sign a short-lived password-reset token (1-hour expiry).
 * Encoded payload: { id, purpose: 'pw-reset' }
 */
export function signResetToken(customerId) {
  return jwt.sign(
    { id: String(customerId), purpose: 'pw-reset' },
    CUSTOMER_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Verify a password-reset token.
 * Returns decoded payload or null (on any error / wrong purpose).
 */
export function verifyResetToken(token) {
  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET);
    if (decoded?.purpose !== 'pw-reset') return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify a customer Bearer token from the Authorization header.
 * Returns decoded payload or null on failure.
 */
export function verifyCustomerToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    if (!token || token === 'null' || token === 'undefined') return null;
    return jwt.verify(token, CUSTOMER_JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Middleware helper — require an authenticated customer.
 * Returns { customer } or { error: Response }.
 */
export function requireCustomer(request) {
  const customer = verifyCustomerToken(request);
  if (!customer) {
    return {
      error: Response.json(
        { success: false, message: 'Please log in to continue.' },
        { status: 401 }
      ),
    };
  }
  return { customer };
}
