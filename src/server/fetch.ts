import { IConfig } from "../types";
import { BaseError, err, ok, Result, Success } from "../types/response";
import { getSession } from "./session";

// Global refresh lock to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<Result<string, BaseError>> | null = null;

export const serverSideFetch = async <T>({
  url,
  method = "GET",
  config,
  body,
  sessionIsOptional = false,
  skipRefresh = false,
  ...options
}: {
  url: string;
  method?: "GET" | "POST" | "DELETE";
  body?: object;
  config: IConfig;
  sessionIsOptional?: boolean;
  skipRefresh?: boolean;
} & Omit<RequestInit, "body" | "method">): Promise<Result<T, BaseError>> => {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
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
    ...options,
    headers,
  };

  try {
    if (body) opts.body = JSON.stringify(body);
  } catch (e) {
    console.log("Error stringifying body: ", e);
  }

  try {
    const response: Response = await fetch(`${config.apiUrl}${url}`, opts);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !skipRefresh && !sessionIsOptional) {
      if (config.debug)
        console.log("#> 401 detected, attempting token refresh");

      // Local reference to the refresh promise to prevent race conditions
      let currentRefresh: Promise<Result<string, BaseError>>;

      // Check if refresh is already in progress
      if (refreshPromise === null) {
        // Start new refresh process
        refreshPromise = attemptTokenRefresh(config).finally(() => {
          // Clear the lock when done (success or failure)
          refreshPromise = null;
        });
        currentRefresh = refreshPromise;
      } else {
        if (config.debug)
          console.log("#> Refresh already in progress, waiting...");
        currentRefresh = refreshPromise;
      }

      // Wait for the refresh to complete (whether we started it or not)
      const refreshResult = await currentRefresh;

      if (refreshResult.isOk()) {
        // Retry the original request with refreshed token
        return serverSideFetch<T>({
          url,
          method,
          config,
          body,
          sessionIsOptional,
          skipRefresh: true, // Prevent infinite loop
          ...options,
        });
      }

      // Refresh failed, return the error
      return err(refreshResult.error);
    }

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

export async function attemptTokenRefresh(
  config: IConfig
): Promise<Result<string, BaseError>> {
  if (config.debug) console.log("#> attemptTokenRefresh called");

  const { jwtDecode } = await import("jwt-decode");
  const session = await getSession();

  if (!session.token?.refresh) {
    return err({
      error: "NO_REFRESH_TOKEN",
      message: "No refresh token available in session",
    });
  }

  const res = await serverSideFetch<{ token: string }>({
    method: "POST",
    url: "/refresh",
    body: {
      refreshToken: session.token.refresh,
    },
    sessionIsOptional: true,
    skipRefresh: true, // Prevent infinite loop
    config,
  });

  if (config.debug) console.log("#> attemptTokenRefresh", res);
  if (res.isErr()) {
    // Refresh token is invalid or expired, destroy session
    session.destroy();
    return err(res.error);
  }

  // Update session with new JWT
  const decoded = jwtDecode<any>(res.value.data.token);
  const newToken = {
    jwt: res.value.data.token,
    refresh: session.token.refresh, // Keep the same refresh token
    decoded,
  };

  session.token = newToken;

  await session.save();

  return ok({ data: "success" });
}
