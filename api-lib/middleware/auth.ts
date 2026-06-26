import crypto from 'crypto';

// Secret key for JWT signature
const JWT_SECRET = process.env.JWT_SECRET || 'insightai-enterprise-secret-key-3.0';

export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'dealer' | 'sales' | 'customer' | 'guest';
  tenantId: string;
}

/**
 * Base64url encode helper
 */
function base64url(source: Buffer | string): string {
  const buf = Buffer.isBuffer(source) ? source : Buffer.from(source);
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate a JWT token for a user payload (used for login/sessions)
 */
export function generateToken(payload: UserPayload, expiresInSeconds: number = 86400): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const expPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(expPayload));
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  
  const encodedSignature = base64url(signature);
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Verify signature
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    
    const expectedSignature = base64url(signature);
    if (encodedSignature !== expectedSignature) return null;

    // Decode and verify expiration
    const payloadStr = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const payload = JSON.parse(payloadStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null; // Token expired
    }

    return payload as UserPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Authenticate incoming request, extracting token from Auth header.
 * Attaches user context to req.user.
 */
export function authenticate(req: any, res: any): boolean {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // Treat as anonymous guest user
    req.user = {
      id: 'guest',
      email: 'guest@insightai.com',
      role: 'guest',
      tenantId: 'default'
    };
    return true;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    res.status(401).json({ error: 'Invalid Authorization header format. Expected Bearer <token>' });
    return false;
  }

  const decoded = verifyToken(parts[1]);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return false;
  }

  req.user = decoded;
  return true;
}

/**
 * Authorization guard checking if user has a required role
 */
export function hasRole(req: any, roles: string[]): boolean {
  if (!req.user) return false;
  return roles.includes(req.user.role);
}
