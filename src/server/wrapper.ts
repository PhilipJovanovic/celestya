import { CallbackOptions, IConfig, WrapperFunction } from "../types";
import { serverSideFetch } from "./fetch";

/**
 * Register new Wrapper for the API.
 *
 * Example Wrapper:
 * ```ts
 *  const apiWrapper = (cb: WrapperFunction) => {
 *    return {
 *      commmands: {
 *        get: () => cb<string>({ method: "GET", url: "/command" }),
 *        update: (id: string, body: JSON) =>
 *          cb({ method: "POST", url: `/command/${id}`, body }),
 *      },
 *    };
 *  };
 * ````
 * @param apiWrapper
 * @param config
 * @returns
 */
export const serverAPIWrapper = <T>(
  apiWrapper: (cb: WrapperFunction) => T,
  config: IConfig
) => {
  return apiWrapper(async (data: CallbackOptions) => {
    const { method, url, body } = data;

    return serverSideFetch({
      url,
      method,
      body,
      config,
    });
  });
};
