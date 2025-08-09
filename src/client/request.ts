import { BaseError, err, ok, Result, Success } from "../types/response";

export const clientSideFetch = async <T>({
  url,
  method = "GET",
  body,
  ...options
}: {
  url: string;
  method?: "GET" | "POST" | "DELETE";
  body?: object;
} & Omit<RequestInit, "body" | "method">): Promise<Result<T, BaseError>> => {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    if (body) opts.body = JSON.stringify(body);
  } catch (e) {
    return err({
      error: "PARSE_ERROR",
      message: "Failed to parse request body as JSON",
    });
  }

  try {
    const response: Response = await fetch(url, opts);
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
