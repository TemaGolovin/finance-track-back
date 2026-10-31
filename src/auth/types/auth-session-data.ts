import { LoginEntity } from '../entity/login.entity';
import { RegistrationEntity } from '../entity/registration.entity';

export type LoginSessionData = LoginEntity & {
  token: string;
  refreshToken: string;
};

export type RegistrationSessionData = RegistrationEntity & {
  token: string;
  refreshToken: string;
};

export type ProfileSessionData = LoginSessionData;
