import { SessionOptions } from "iron-session";
import { IronSessionData, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AuthConfig } from "../types";

declare module "iron-session" {
    interface IronSessionData<U, T> {
        user?: U;
        token?: {
            jwt: string;
            refresh: string;
            decoded: T;
        };
    }
}

export interface User {
    username: string;
}

export interface Token {
    token: string;
}

export const sessionOptions: SessionOptions = {
    password: "PLEASE_SET_PASSWORD", //AUTH_SECRET,
    cookieName: "PLEASE_SET_CONFIG", // COOKIE_NAME,
    cookieOptions: { secure: false }, //IS_PROD },
};

export const setConfig = ({ password, cookieName, secure }: AuthConfig) => {
    sessionOptions.password = password;
    sessionOptions.cookieName = cookieName;

    if (!sessionOptions.cookieOptions) sessionOptions.cookieOptions = {};

    sessionOptions.cookieOptions.secure = secure;
};

const getSessionServerside = async <U = User>() => {
    const session = await getIronSession<IronSessionData<U, Token>>(
        cookies(),
        sessionOptions
    );

    return session;
};

export default getSessionServerside;
