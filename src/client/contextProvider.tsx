"use client";

import { createContext, useCallback, useEffect, useRef, useState } from "react";
import {
  IAuthContext,
  IAuthContextOptions,
  ILoginData,
  IOAuthData,
  IRegisterData,
} from "../types/internal";

import { type Result } from "../types/response";

import { clientSideFetch } from "./request";

import { useRouter } from "next/navigation";
import { BaseError } from "../types/response";
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
  const customHeaders = useRef<Record<string, string>>({});

  const setHeader = useCallback((key: string, value: string) => {
    customHeaders.current[key] = value;
  }, []);

  const removeHeader = useCallback((key: string) => {
    delete customHeaders.current[key];
  }, []);

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
    const res = await clientSideFetch({
      url: loginRoute,
      body: loginData.data,
    });
    if (res.isErr()) {
      return `${loginData.onErrorUrl || "/"}?error=${res.error.error}`;
    }

    setIsLoggedIn(true);

    return loginData.redirect || "/";
  };

  const register = async (registerData: IRegisterData): Promise<string> => {
    const res = await clientSideFetch<{ redirect: string }>({
      url: registerRoute,
      body: registerData.data,
    });

    if (res.isErr()) {
      return `${registerData.onErrorUrl || "/"}?error=${res.error.error}`;
    }
    return `${registerData.redirect || "/"}?success=true`;
  };

  const oAuth = async ({
    state,
    oAuthUrl,
    onErrorUrl,
  }: IOAuthData): Promise<string> => {
    const url = new URL(oAuthRoute, "http://localhost/");
    url.searchParams.set("authUrl", oAuthUrl);

    if (state && state !== "/") url.searchParams.set("state", state);

    const response = await clientSideFetch<string>({
      url: url.pathname + url.search,
    });
    if (response.isErr()) {
      return `${onErrorUrl || "/"}?error=${response.error.message}`;
    }

    return response.value.data;
  };

  const logout = async (): Promise<string> => {
    const data = await clientSideFetch<string>({
      url: logoutRoute,
      cache: "no-store",
    });

    if (data.isErr()) {
      return "/";
    }

    setIsLoggedIn(false);
    setUser({});

    return data.value.data;
  };

  const refreshUser = async (force?: boolean): Promise<void> => {
    const data = await clientSideFetch<IU>({
      url: `${userRoute}${force ? "?force=true" : ""}`,
      cache: "no-store",
    });

    if (data.isErr()) {
      setUser({});
      setIsLoggedIn(false);
    } else {
      setUser(data.value.data);
    }

    setReady(true);

    router.refresh();
  };

  const get = async <T,>({
    url,
    headers,
  }: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<Result<T, BaseError>> => {
    return clientSideFetch({
      url: `${proxyRoute}${url}`,
      headers: { ...customHeaders.current, ...headers },
    });
  };

  const post = async <T,>({
    url,
    body,
    headers,
  }: {
    url: string;
    body: object;
    headers?: Record<string, string>;
  }): Promise<Result<T, BaseError>> => {
    return clientSideFetch({
      method: "POST",
      url: `${proxyRoute}${url}`,
      body,
      headers: { ...customHeaders.current, ...headers },
    });
  };

  const del = async <T,>({
    url,
    headers,
  }: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<Result<T, BaseError>> => {
    return clientSideFetch({
      method: "DELETE",
      url: `${proxyRoute}${url}`,
      headers: { ...customHeaders.current, ...headers },
    });
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

  const augmentToken = async ({
    url,
    method = "POST",
    body,
  }: {
    url: string;
    method?: "GET" | "POST" | "DELETE";
    body?: object;
  }) => {
    const res = await clientSideFetch({
      method: "POST",
      url: `${routePrefix}/augment`,
      body: { url, method, body },
    });
    if (res.isOk()) await refreshUser(true);
    return res;
  };

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
    setHeader,
    removeHeader,
    augmentToken,
    /* upload, */
  };

  return (
    <AuthContext.Provider value={provider}>{children}</AuthContext.Provider>
  );
};

export default AuthContextProvider;
