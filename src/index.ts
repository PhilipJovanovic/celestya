import proxy from "./server/api";
import getSessionServerside, { setConfig } from "./server/session";
import Debug from "./server/test";

export const init = setConfig;
export const Proxy = proxy;
export const getSession = getSessionServerside;
export const debug = Debug;

import { IConfig, AuthConfig, IRequestOptions } from "./types";

export { AuthConfig, IConfig, IRequestOptions };
