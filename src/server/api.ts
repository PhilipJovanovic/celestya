import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requestError } from "./errors";
import { invalidEndpoint, sessionError } from "./errors";
import { jwtDecode } from "jwt-decode";
import { IConfig, IRequestOptions, RouteHandler } from "../types";
import getSessionServerside from "./session";

const rHandler: RouteHandler = {
    GET: {
        user: ({ request, config }) => getUser(request, config),
        logout: ({ config }) => logout(config),
        debug: () => debug(),
        oauth: ({ request, config }) => oauth(request, config),
        oauth_callback: ({ request, config }) =>
            oauth_callback(request, config),
    },
    POST: {
        login: ({ request, config }) => login(request, config),
    },
};

export default async function proxy(
    method: string,
    request: NextRequest,
    options: IRequestOptions,
    config: IConfig
) {
    try {
        const parameters = {
            request,
            path:
                options.params.endpoint?.join("/") ||
                request.nextUrl.pathname.replace(config.route, ""),
            options: options.params.endpoint,
            config,
        };

        console.log(`[${method}]: ${parameters.path}`);
        if (rHandler[method][parameters.path])
            return rHandler[method][parameters.path](parameters);

        return invalidEndpoint;
    } catch (e) {
        console.log(e);
        return requestError;
    }
}

async function login(request: NextRequest, config: IConfig) {
    const session = await getSessionServerside();
    const formData = await request.json();

    const response: Response = await fetch(`${config.apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });

    const res = await response.json();

    if (res.error) throw new Error(res.error);

    const dec: any = jwtDecode(res.data.token);

    session.token = {
        jwt: res.data.token,
        refresh: res.data.refresh || "refresh_token",
        decoded: dec,
    };

    await session.save();

    return Response.json({
        redirect: "/",
    });
}

async function getUser(request: NextRequest, config: IConfig) {
    const session = await getSessionServerside<any>();

    if (!session || !session.token) return sessionError;

    // * User already exists in session
    if (session.user)
        return Response.json({
            data: session.user,
        });

    // * User does not exist in session
    const response: Response = await fetch(
        `${config.apiUrl}${config.userEndpoint}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + session.token.jwt,
            },
        }
    );

    const res = await response.json();

    session.user = res.data;

    await session.save();

    console.log("user? token: ", session);

    return Response.json({
        data: session.user,
    });
}

async function oauth(request: NextRequest, config: IConfig) {
    const authUrl = request.nextUrl.searchParams.get("authUrl");

    if (!authUrl) throw new Error("No authUrl provided");

    const url = new URL(config.route + "/oauth_callback", config.host);

    const state = request.nextUrl.searchParams.get("state");
    if (state) url.searchParams.set("state", state);

    const response: Response = await fetch(
        `${config.apiUrl}${authUrl}?returnUrl=${encodeURIComponent(
            url.toString()
        )}`
    );

    const res = await response.json();

    if (res.error) throw new Error(res.error);

    return Response.json({
        data: res.data,
    });
}

async function oauth_callback(request: NextRequest, config: IConfig) {
    const session = await getSessionServerside();
    const token = request.nextUrl.searchParams.get("token");
    const refresh = request.nextUrl.searchParams.get("refresh");
    const state = request.nextUrl.searchParams.get("state");

    if (!token) throw new Error("No token provided");

    const dec: any = jwtDecode(token);

    session.token = {
        jwt: token,
        refresh: refresh || "refresh_token",
        decoded: dec,
    };

    await session.save();

    if (state)
        return Response.redirect(
            state.includes("http") ? state : config.host + state
        );

    return Response.redirect(config.host);
}

async function logout(config: IConfig) {
    const session = await getSessionServerside();

    session.destroy();

    revalidatePath(config.host, "layout");

    return Response.json({
        redirect: "/",
    });
}

async function debug() {
    const session = await getSessionServerside();

    return Response.json(session);
}

// TODO: add refresh logic
