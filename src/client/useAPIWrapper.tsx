import { useContext } from "react";
import { AuthContext } from "./contextProvider";
import { CallbackOptions } from "../types";

const useAPIWrapperContext = (
  apiWrapper: (cb: (data: CallbackOptions) => Promise<unknown>) => void
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

export default useAPIWrapperContext;
