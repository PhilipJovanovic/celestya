import { CallbackOptions, IConfig, WrapperFunction } from "../types";
import { serverSideFetch } from "./fetch";

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

const registerWrapper = (cb: WrapperFunction) => {
  return {
    commmands: {
      get: () => cb<string>({ method: "GET", url: "/command" }),
      update: (id: string, body: JSON) =>
        cb({ method: "POST", url: `/command/${id}`, body }),
    },
  };
};
