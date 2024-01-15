import { NextRequest } from "next/server";

export interface IChildProps {
    children?: React.ReactNode;
}

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
