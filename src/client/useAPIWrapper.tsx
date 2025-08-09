import { useContext } from "react";
import { AuthContext } from "./contextProvider";
import { CallbackOptions, WrapperFunction } from "../types";

export const useAPIWrapperContext = <T,>(
  apiWrapper: (cb: WrapperFunction) => T
) => {
  const { get, post, del } = useContext(AuthContext);

  return () =>
    apiWrapper(async (data: CallbackOptions) => {
      const { method, url, body } = data;

      switch (method) {
        case "GET":
          return get({ url });
        case "POST":
          return post({ url, body: body ?? {} });
        case "DELETE":
          return del({ url });
        default:
          throw new Error("Unsupported method type");
      }
    });
};
