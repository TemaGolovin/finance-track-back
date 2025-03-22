// src/auth/refresh.strategy.ts
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        const cookies = req.headers.cookie.split('=');

        const refreshToken = cookies.find((_name, i, self) => {
          return self[i - 1] === 'refreshToken';
        });

        if (!refreshToken) throw new UnauthorizedException('Cookie not found');
        return refreshToken;
      },
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload) {
    const cookies = req.headers.cookie.split('=');

    const refreshToken = cookies.find((_name, i, self) => {
      return self[i - 1] === 'refreshToken';
    });
    return { ...payload, refreshToken };
  }
}
