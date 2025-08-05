import { NextRequest } from "next/server";
import { IConfig, IRequestOptions } from "../types";
import { Proxy } from "./api";

export const CelestyaProxy = (config: IConfig) => {
  return {
    POST: (req: NextRequest, opt: IRequestOptions) =>
      Proxy("POST", req, opt, config),
    GET: (req: NextRequest, opt: IRequestOptions) =>
      Proxy("GET", req, opt, config),
    DELETE: (req: NextRequest, opt: IRequestOptions) =>
      Proxy("DELETE", req, opt, config),
  };
};
