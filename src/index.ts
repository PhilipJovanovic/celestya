import proxy from "./server/api";
import { serverSideFetch } from "./server/fetch";
import getSessionServerside from "./server/session";
import Debug from "./server/test";

export const Proxy = proxy;
export const getSession = getSessionServerside;
export const debug = Debug;
export const apiFetch = serverSideFetch;

import { IConfig, IRequestOptions, Session } from "./types";

export { IConfig, IRequestOptions, Session };
