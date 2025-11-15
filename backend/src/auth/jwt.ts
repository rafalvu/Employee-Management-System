import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

// Generate a JWT token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h', // Token expires in 24 hours
    algorithm: 'HS256'
  });
}

// Verify and decode a JWT token
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
