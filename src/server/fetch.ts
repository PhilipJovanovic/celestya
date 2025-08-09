import { IConfig, IServerSideRequestOptions } from "../types";
import { BaseError, err, ok, Result, Success } from "../types/response";
import { getSession } from "./session";

export const serverSideFetch = async <T>({
  url,
  method = "GET",
  config,
  body,
  sessionIsOptional = false,
  ...options
}: {
  url: string;
  method?: "GET" | "POST" | "DELETE";
  body?: object;
  config: IConfig;
  sessionIsOptional?: boolean;
} & Omit<RequestInit, "body" | "method">): Promise<Result<T, BaseError>> => {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...options.headers,
  });

  const session = await getSession();

  if (session.token !== undefined) {
    headers.set("Authorization", `Bearer ${session.token.jwt}`);
  } else if (!sessionIsOptional) {
    return err({
      error: "SESSION_ERROR",
      message: "Session is required but not found.",
    });
  }

  const opts: RequestInit = {
    method,
    headers,
    ...options,
  };

  try {
    if (body) opts.body = JSON.stringify(body);
  } catch (e) {
    console.log("Error stringifying body: ", e);
  }

  try {
    const response: Response = await fetch(`${config.apiUrl}${url}`, opts);
    if (!response.ok) {
      return err({
        error: "RESPONSE_ERROR",
        message: `HTTP error! status: ${response.status}`,
      });
    }

    try {
      const res = await response.json();
      if (res.error !== undefined) {
        return err(res);
      }

      return ok(res as Success<T>);
    } catch (e) {
      return err({
        error: "PARSE_ERROR",
        message: "Failed to parse response as JSON",
      });
    }
  } catch (e) {
    return err({
      error: "FETCH_ERROR",
      message: "Failed to fetch the resource: " + String(e),
    });
  }
};
