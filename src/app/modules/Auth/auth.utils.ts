import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';

export const createToken = (
  jwtPayload: { userId: string | Types.ObjectId },
  secret: Secret,
  expiresIn: SignOptions['expiresIn'],
): string => {
  const payload = {
    userId: jwtPayload.userId.toString(),
  };

  return jwt.sign(payload, secret, {
    expiresIn,
  });
};





