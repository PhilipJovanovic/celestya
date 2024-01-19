import { Token } from "../server/session";

import { IronSessionData } from "iron-session";

export interface IRequestSuccess<T, U = any> {
    error?: string;
    data: T;
    message?: U;
}

export interface IRequestError<T, U = any> {
    error: string;
    data?: T;
    message?: U;
}

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

export interface IResponseError {
    error: string;
    message: string;
}

export interface IResponseSuccess<T, U> {
    data: T;
    details: U;
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
    get: <T, U = any>(url: string) => Promise<ResponseType<T, U>>;
    post: <T, U = any>(url: string, body: any) => Promise<ResponseType<T, U>>;
    del: <T, U = any>(url: string) => Promise<ResponseType<T, U>>;
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

export type Request<T, U> = IRequestError<T, U> | IRequestSuccess<T, U>;
export type ResponseType<T, U = any> = IResponseError | IResponseSuccess<T, U>;
export type ServerSideSession<U> = IronSessionData<U, Token>;
