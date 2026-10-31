import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

function getRefreshTokenFromRequest(req: Request): string {
  const refreshToken = req.cookies?.refreshToken;
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    throw new UnauthorizedException('Cookie not found');
  }

  return refreshToken;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => getRefreshTokenFromRequest(req),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { email: string; name: string; id: string; deviceId: string }) {
    return { ...payload, refreshToken: getRefreshTokenFromRequest(req) };
  }
}
