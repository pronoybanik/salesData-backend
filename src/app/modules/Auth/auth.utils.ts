import jwt, { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

export const createToken = (
  jwtPayload: { userId: string | Types.ObjectId  },
  secret: string,
  expiresIn: string,
) => {
  const payload = {
    userId: jwtPayload.userId.toString(),
  };
  
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
