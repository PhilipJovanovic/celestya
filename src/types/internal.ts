import { Token } from "../server/session";

import { IronSessionData } from "iron-session";
import { BaseError, Result } from "./response";

export interface ILoginData {
  data: object;
  redirect?: string;
  onErrorUrl?: string;
}

export interface IRegisterData {
  data: object;
  redirect?: string;
  onErrorUrl?: string;
}

export interface IOAuthData {
  state: string;
  oAuthUrl: string;
  onErrorUrl?: string;
}

export interface IAuthContext<U> {
  isLoggedIn: boolean;
  ready: boolean;
  user: U;
  login: (data: ILoginData) => Promise<string>;
  register: (data: IRegisterData) => Promise<string>;
  oAuth: (data: IOAuthData) => Promise<string>;
  logout: () => Promise<string>;
  refreshUser: (force?: boolean) => Promise<void>;
  get: <T>(props: { url: string; headers?: Record<string, string> }) => Promise<Result<T, BaseError>>;
  post: <T>(props: {
    url: string;
    body: object;
    headers?: Record<string, string>;
  }) => Promise<Result<T, BaseError>>;
  del: <T>(props: { url: string; headers?: Record<string, string> }) => Promise<Result<T, BaseError>>;
  setHeader: (key: string, value: string) => void;
  removeHeader: (key: string) => void;
  /*
    upload: <T, U = any>(
        url: string,
        formName: string,
        files: File[],
        setProgress: (p: number) => void
        ) => Promise<TRequest<T, U>>;*/
}

export interface IAuthContextOptions {
  children: React.ReactNode;

  // Route prefix of (local) API
  routePrefix?: string;
}

export interface IChildProps {
  children?: React.ReactNode;
}

export type ServerSideSession<U> = IronSessionData<U, Token>;
