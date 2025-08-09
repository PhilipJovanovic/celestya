import { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { ServerSideSession } from "../types/internal";
import { Session } from "../types";

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

export interface DefaultUser {
  [key: string]: unknown;
}

export interface Token {
  token: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.CELESTYA_SECRET || "PLEASE_SET_PASSWORD",
  cookieName: process.env.CELESTYA_COOKIE_NAME || "PLEASE_SET_COOKIE_NAME",
  cookieOptions: { secure: process.env.SECURE === "true" },
};

export const getSession = async <U = DefaultUser>(
  sessionOpts?: SessionOptions
) => {
  if (
    sessionOpts === undefined &&
    (!process.env.CELESTYA_SECRET || !process.env.CELESTYA_COOKIE_NAME)
  ) {
    throw new Error(
      "CELESTYA_SECRET and CELESTYA_COOKIE_NAME must be set in environment variables."
    );
  }

  const session: Session<U> = await getIronSession<ServerSideSession<U>>(
    await cookies(),
    sessionOpts || sessionOptions
  );

  return session;
};
