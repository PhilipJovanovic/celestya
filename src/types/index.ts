import { IronSession } from "iron-session";
import { NextRequest } from "next/server";
import { ServerSideSession } from "./internal";
import { DefaultUser } from "../server/session";

export type Params = string[];

export interface IRequestOptions {
    params: { endpoint: Params };
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
}
export type Session<U = DefaultUser> = IronSession<ServerSideSession<U>>;
