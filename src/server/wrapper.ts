import { CallbackOptions, IConfig } from "../types";
import { serverSideFetch } from "./fetch";

type WrapperFunction = (data: CallbackOptions) => Promise<unknown>;

export const serverAPIWrapper = <T>(
  apiWrapper: (cb: WrapperFunction) => unknown,
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

const registerWrapper = (cb: (opts: CallbackOptions) => Promise<unknown>) => {
  return {
    commmands: {
      get: () => cb({ method: "GET", url: "/command" }),
      update: (id: string, body: JSON) =>
        cb({ method: "POST", url: `/command/${id}`, body }),
    },
  };
};

const test = serverAPIWrapper(registerWrapper, {
  host: "localhost",
  route: "/api",
  apiUrl: "http://localhost:3000/api",
  userEndpoint: "/user",
  debug: true,
});

test;
