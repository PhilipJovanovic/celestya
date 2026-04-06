import { IronSession } from "iron-session";
import { NextRequest } from "next/server";
import { ServerSideSession } from "./internal";
import { DefaultUser } from "../server/session";
import { BaseError, Result } from "./response";

export type Params = string[];

export interface IRequestOptions {
  params: Promise<{ endpoint: Params }>;
}

export interface RouteHandler {
  [key: string]: {
    [key: string]: {
      (params: {
        request: NextRequest;
        path: string;
        config: IConfig;
        options: string[];
      }): Promise<any>;
    };
  };
}

export interface IConfig {
  host: string;
  route: string;
  apiUrl: string;
  userEndpoint: string;
  debug?: boolean;
  /**
   * Map of cookie names to HTTP header names.
   * When set, serverSideFetch will read these cookies server-side and
   * forward their values as the corresponding headers to the backend.
   * Useful for forwarding client-side state (e.g. selected channel) during SSR.
   *
   * @example
   * cookieHeaders: { 'w1nter-editor': 'X-Editor-Channel' }
   */
  cookieHeaders?: Record<string, string>;
}
export type Session<U = DefaultUser> = IronSession<ServerSideSession<U>>;

/* serverSideFetch */
export interface IServerSideRequestOptions {
  method?: string;
  body?: JSON;
}

export type CallbackOptions = {
  method: "GET" | "POST" | "DELETE";
  url: string;
  body?: object;
};

export type WrapperFunction = <T>(
  data: CallbackOptions
) => Promise<Result<T, BaseError>>;
