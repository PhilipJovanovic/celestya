"use client";

import { createContext, useEffect, useState } from "react";
import {
    IAuthContext,
    IAuthContextOptions,
    ILoginData,
    IOAuthData,
    IRegisterData,
    ResponseType,
} from "../types/internal";

import { dFetch, gFetch, pFetch } from "./request";

import { useRouter } from "next/navigation";
/*                                                                    +
    Frontend context for providing login, logout, register and refresh
    'use client' needed for using -> client components only
    server components need to use useSession()
*/

export const AuthContext = createContext<IAuthContext<any>>(null as any);

const AuthContextProvider = <IU,>({
    children,
    routePrefix = "/api",
}: IAuthContextOptions) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [ready, setReady] = useState(false);
    const [user, setUser] = useState<IU | {}>({});

    const router = useRouter();

    // POST /session/login
    const loginRoute = routePrefix + "/login";

    // POST /session/refresh
    const registerRoute = routePrefix + "/register";

    // GET /session/logout
    const logoutRoute = routePrefix + "/logout";

    // GET /session
    const userRoute = routePrefix + "/user";

    // GET /session/oauth/API_OAUTH_URL
    const oAuthRoute = routePrefix + "/oauth";

    // GET/POST/DELETE /proxy/URL
    const proxyRoute = routePrefix + "/proxy";

    const login = async (loginData: ILoginData): Promise<string> => {
        try {
            const res = await pFetch({
                url: loginRoute,
                body: loginData.data,
            });

            setIsLoggedIn(true);

            if (res.error) throw new Error(res.message);

            return loginData.redirect || "/";
        } catch (e: any) {
            return `${loginData.onErrorUrl || "/"}?error=${e.message}`;
        }
    };

    const register = async (registerData: IRegisterData): Promise<string> => {
        try {
            const res = await pFetch({
                url: registerRoute,
                body: registerData.data,
            });

            if (res.error) throw new Error(res.message);

            return `${registerData.redirect || "/"}?success=true`;
        } catch (e: any) {
            return `${registerData.onErrorUrl || "/"}?error=${e.message}`;
        }
    };

    const oAuth = async ({
        state,
        oAuthUrl,
        onErrorUrl,
    }: IOAuthData): Promise<string> => {
        try {
            const url = new URL(oAuthRoute, "http://localhost/");

            url.searchParams.set("authUrl", oAuthUrl);

            if (state && state !== "/") url.searchParams.set("state", state);

            const response = await gFetch({ url: url.pathname + url.search });

            return response.data;
        } catch (e: any) {
            return `${onErrorUrl || "/"}?error=${e.message}`;
        }
    };

    const logout = async (): Promise<string> => {
        try {
            const data = await gFetch({
                url: logoutRoute,
                options: { cache: "no-store" },
            });

            setIsLoggedIn(false);
            setUser({});

            return data.data;
        } catch (e: any) {
            console.log(e);
            return "/";
        }
    };

    const refreshUser = async (force?: boolean): Promise<void> => {
        try {
            const data = await gFetch({
                url: `${userRoute}${force ? "?force=true" : ""}`,
                options: { cache: "no-store" },
            });

            if (!data.error) {
                setUser(data.data);
                setIsLoggedIn(true);
            } else {
                setUser({});
                setIsLoggedIn(false);
            }

            setReady(true);

            router.refresh();
        } catch (e) {
            console.log("refreshUser error: ", e);
        }
    };

    const get = async <T, U>(url: string): Promise<ResponseType<T, U>> => {
        try {
            const r = await gFetch({ url: `${proxyRoute}${url}` });

            return r;
        } catch (e: any) {
            return { error: "getRequestError", message: e.message };
        }
    };

    const post = async <T, U = any>(
        url: string,
        body: any
    ): Promise<ResponseType<T, U>> => {
        try {
            const r = await pFetch({
                url: `${proxyRoute}${url}`,
                body,
            });

            return r;
        } catch (e: any) {
            return { error: "getRequestError", message: e.message };
        }
    };

    const del = async <T, U>(url: string): Promise<ResponseType<T, U>> => {
        try {
            const r = await dFetch({ url: `${proxyRoute}${url}` });

            return r;
        } catch (e: any) {
            return { error: "getRequestError", message: e.message };
        }
    };

    /**
     * Can only be used if user is logged in! and already initialised
     * @param url url for upload
     * @param formData form data
     * @param setProgress progress dispatch
     * @returns object with data or error
     */
    /* const upload = async <T, U = any>(
        url: string,
        formName: string,
        files: File[],
        setProgress: (p: number) => void,
    ): Promise<TRequest<T, U>> => {
        try {
            if (!user.token) throw new Error('user not logged in')
     
            const res: Error | XMLHttpRequest = await new Promise(
                (resolve, reject) => {
                    try {
                        const xhr = new XMLHttpRequest()
                        const formData = new FormData()
     
                        for (let i = 0; i < files.length; i++)
                            formData.append(formName, files[i])
     
                        xhr.open('POST', `${API_URL}${url}`, true)
                        xhr.setRequestHeader('Authorization', `Bearer ${user.token}`)
                        xhr.upload.onprogress = (ev: ProgressEvent<EventTarget>) => {
                            if (ev.lengthComputable) {
                                const percentComplete = (ev.loaded / ev.total) * 100
                                setProgress(percentComplete)
                            }
                        }
     
                        xhr.onload = function () {
                            console.log('break3?', this)
                            return this.status === 200
                                ? resolve(this)
                                : reject(new Error('Error while uploading: ' + this.status))
                        }
     
                        xhr.onerror = (ev: ProgressEvent<EventTarget>) => {
                            console.log('break2', ev.target)
                            reject(ev)
                        }
     
                        xhr.send(formData)
                    } catch (e) {
                        console.log('break1', e)
                        reject(e)
                    }
                },
            )
     
            if (res instanceof Error) throw res
     
            const data: any = JSON.parse(res.responseText)
     
            if (data.error) throw new Error(data.data)
     
            return { data: data.data }
        } catch (e) {
            console.log('break4', e)
            return { error: e.message || 'upload error' }
        }
    }
     
    const getContext = () => {
        let context = user.id
     
        if (!user.id) {
            // if not logged in
            const cookie = document.cookie
                .split(';')
                .find((c) => c.includes('cycle_cid'))
     
            if (cookie) {
                // use cookie value
                context = cookie.split('=')[1]
            } else {
                // set new cookie
                context =
                    Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15)
     
                document.cookie = `cycle_cid=${context};path=/;max-age=31536000`
            }
        }
     
        return context
    }
     
    const event = async (name: string, value?: any): Promise<boolean> => {
        try {
            const contextId = getContext()
     
            const r = await fetch(NOFY_API_URL + '/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Basic ' + ANALYTICS_KEY,
                },
                body: JSON.stringify({
                    source: IS_PROD ? 'cycle-frontend' : 'cycle-frontend-dev',
                    contextId,
                    name,
                    value,
                }),
            })
     
            const res = await r.json()
            if (res.error) throw new Error(res.error)
     
            return true
        } catch (e) {
            console.log('#> event error: ', e)
            return false
        }
    }
     
    const pageView = async (url: string, referer?: string): Promise<boolean> => {
        try {
            const contextId = getContext()
     
            const r = await fetch(NOFY_API_URL + '/log/count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Basic ' + ANALYTICS_KEY,
                },
                body: JSON.stringify({
                    meta: {
                        contextId,
                        type: 'pageview',
                    },
                    referer,
                    identifier: url,
                }),
            })
     
            const res = await r.json()
            if (res.error) throw new Error(res.error)
     
            return true
        } catch (e) {
            console.log('#> event error: ', e)
            return false
        }
    } */

    useEffect(() => {
        if (!ready) refreshUser();
    }, []);

    const provider = {
        ready,
        login,
        register,
        logout,
        isLoggedIn,
        refreshUser,
        user,
        oAuth,
        get,
        post,
        del,
        /* upload, */
    };

    return (
        <AuthContext.Provider value={provider}>{children}</AuthContext.Provider>
    );
};

export default AuthContextProvider;
