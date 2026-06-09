import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { jwtDecode } from "jwt-decode";
import { IConfig, IRequestOptions, RouteHandler } from "../types";
import { DefaultUser, getSession } from "./session";
import { serverSideFetch, attemptTokenRefresh } from "./fetch";

const rHandler: RouteHandler = {
  GET: {
    user: ({ request, config }) => getUser(request, config),
    refresh: ({ request, config }) => refresh(request, config),
    logout: ({ config }) => logout(config),
    debug: ({ config }) => debug(config),
    oauth: ({ request, config }) => oauth(request, config),
    oauth_callback: ({ request, config }) => oauth_callback(request, config),
    proxy: ({ request, config, options }) =>
      proxyFunction("GET", request, config, options),
  },
  POST: {
    login: ({ request, config }) => login(request, config),
    augment: ({ request, config }) => augment(request, config),
    proxy: ({ request, config, options }) =>
      proxyFunction("POST", request, config, options),
  },
  DELETE: {
    augment: ({ request, config }) => augment(request, config),
    proxy: ({ request, config, options }) =>
      proxyFunction("DELETE", request, config, options),
  },
};

export async function Proxy(
  method: string,
  request: NextRequest,
  options: IRequestOptions,
  config: IConfig
) {
  try {
    const params = await options.params;
    const parameters = {
      request,
      path:
        params.endpoint[0] ||
        request.nextUrl.pathname.replace(config.route, ""),
      options: params.endpoint,
      config,
    };

    if (config.debug) console.log("#> proxy:", parameters);

    if (rHandler[method][parameters.path])
      return await rHandler[method][parameters.path](parameters);

    return Response.json({
      error: "INVALID_ENDPOINT",
      message: "the provided endpoint is not valid",
    });
  } catch (e) {
    console.log("#> proxyError:", e);
    Response.json({
      error: "REQUEST_ERROR",
      message: "error while sending request through frontend-backend proxy",
    });
  }
}

async function login(request: NextRequest, config: IConfig) {
  const formData = await request.json();
  const res = await serverSideFetch<{ token: string; refresh: string }>({
    method: "POST",
    url: "/login",
    body: formData,
    sessionIsOptional: true,
    config,
  });

  if (config.debug) console.log("#> login", res);
  if (res.isErr()) {
    return Response.json(res.error);
  }

  const dec = jwtDecode<any>(res.value.data.token);

  const session = await getSession();
  session.token = {
    jwt: res.value.data.token,
    refresh: res.value.data.refresh || "refresh_token",
    decoded: dec,
  };

  await session.save();

  return Response.json({
    redirect: "/",
  });
}

async function getUser(request: NextRequest, config: IConfig) {
  const session = await getSession();

  if (session.token === undefined)
    return Response.json({
      error: "SESSION_ERROR",
      message: "Session is required but not found.",
    });

  const force = request.nextUrl.searchParams.get("force") === "true";

  // * User already exists in session
  if (session.user !== undefined && !force)
    return Response.json({
      data: session.user,
    });

  // * User does not exist in session
  const res = await serverSideFetch<DefaultUser>({
    url: `${config.userEndpoint}`,
    config,
  });

  if (config.debug) console.log("#> getUser", res);
  if (res.isErr()) {
    return Response.json(res.error);
  }

  session.user = res.value.data;
  await session.save();

  return Response.json({
    data: session.user,
  });
}

async function oauth(request: NextRequest, config: IConfig) {
  const authUrl = request.nextUrl.searchParams.get("authUrl");
  const state = request.nextUrl.searchParams.get("state");

  if (!authUrl) throw new Error("No authUrl provided");

  const url = new URL(config.route + "/oauth_callback", config.host);
  if (state) url.searchParams.set("state", state);

  const oAuthUrl = new URL(authUrl, config.apiUrl);
  oAuthUrl.searchParams.set("returnUrl", url.toString());

  const res = await serverSideFetch({
    url: oAuthUrl.pathname + oAuthUrl.search,
    config,
    sessionIsOptional: true,
  });

  if (res.isErr()) {
    if (config.debug) console.log("#> oauthError", res.error);
    return Response.json(res.error);
  }

  return Response.json(res.value);
}

async function oauth_callback(request: NextRequest, config: IConfig) {
  const refresh = request.nextUrl.searchParams.get("refresh");

  const token = request.nextUrl.searchParams.get("token");
  if (token === null) throw new Error("No token provided");

  const dec = jwtDecode<any>(token);

  const session = await getSession();
  session.token = {
    jwt: token,
    refresh: refresh || "refresh_token",
    decoded: dec,
  };

  await session.save();

  // redirect to return url if provided
  const state = request.nextUrl.searchParams.get("state");
  if (state !== null)
    return Response.redirect(
      state.includes("http") ? state : config.host + state
    );

  return Response.redirect(config.host);
}

async function logout(config: IConfig) {
  const session = await getSession();
  session.destroy();

  revalidatePath(config.host, "layout");

  return Response.json({
    redirect: "/",
  });
}

async function debug(config: IConfig) {
  // The debug endpoint dumps the full session (incl. jwt + refresh token).
  // Only expose it when debugging is explicitly enabled.
  if (!config.debug) {
    return Response.json(
      { error: "NOT_FOUND", message: "not found" },
      { status: 404 }
    );
  }

  return Response.json(await getSession());
}

async function refresh(request: NextRequest, config: IConfig) {
  const result = await attemptTokenRefresh(config);

  if (config.debug) console.log("#> refresh result", result);

  if (result.isErr()) {
    return Response.json(result.error, { status: 401 });
  }

  const url = request.nextUrl;
  url.pathname = decodeURIComponent(url.searchParams.get("r") || "");
  url.searchParams.delete("r");

  return Response.redirect(url);
}

async function proxyFunction(
  method: "GET" | "POST" | "DELETE",
  request: NextRequest,
  config: IConfig,
  options: string[]
) {
  options.shift(); // remove the first element which is the endpoint

  // Forward custom headers (X-*) from the incoming request
  const forwardHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.startsWith("x-") && key !== "x-forwarded-for" && key !== "x-forwarded-host" && key !== "x-forwarded-proto") {
      forwardHeaders[key] = value;
    }
  });

  const res = await serverSideFetch({
    method,
    url: `/${options.join("/")}${request.nextUrl.search}`,
    body: method === "POST" ? await request.json() : undefined,
    config,
    headers: forwardHeaders,
  });

  if (config.debug) console.log("#> proxyFunction", res);
  if (res.isErr()) {
    return Response.json(res.error);
  }

  return Response.json(res.value);
}

async function augment(request: NextRequest, config: IConfig) {
  const { url, method, body } = await request.json();

  const res = await serverSideFetch<{ token: string }>({
    method: method || "POST",
    url,
    body,
    config,
  });

  if (config.debug) console.log("#> augment", res);
  if (res.isErr()) {
    return Response.json(res.error);
  }

  // Update iron session with the new JWT
  const session = await getSession();
  const dec = jwtDecode<any>(res.value.data.token);
  session.token = {
    jwt: res.value.data.token,
    refresh: session.token?.refresh || "",
    decoded: dec,
  };

  // Clear cached user so it gets refetched
  session.user = undefined;
  await session.save();

  return Response.json({ data: "ok" });
}
