'use client'

import { createContext, useEffect, useState } from "react";
import { IAuthContext, IAuthContextOptions, ILoginData, IOAuthData, IRegisterData } from "../types/internal";
import { gFetch, pFetch } from "./request";

/*                                                                    +
    Frontend context for providing login, logout, register and refresh
    'use client' needed for using -> client components only
    server components need to use useSession()
*/

export const AuthContext = createContext<IAuthContext<any>>(null as any)

const AuthContextProvider = <IU,>({
    children,
    routePrefix = '/api',
}: IAuthContextOptions) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [ready, setReady] = useState(false)
    const [user, setUser] = useState<IU | {}>({})

    // POST /session/login
    const loginRoute = routePrefix + '/login'

    // POST /session/refresh
    const registerRoute = routePrefix + '/register'

    // GET /session/logout
    const logoutRoute = routePrefix + '/logout'

    // GET /session
    const userRoute = routePrefix + '/user'

    // GET /session/oauth/API_OAUTH_URL
    const oAuthRoute = routePrefix + '/oauth'

    const login = async (loginData: ILoginData) => {
        try {
            const data = await pFetch({
                url: loginRoute,
                body: loginData.data,
            })

            setIsLoggedIn(true)

            return loginData.redirect || '/'
        } catch (e: any) {
            return '/login?error=' + encodeURIComponent(e.message)
        }
    }

    const register = async (registerData: IRegisterData) => {
        try {
            const data = await pFetch({
                url: registerRoute,
                body: registerData.data,
            })

            return '/login?_=register&success=Bitte%20best%C3%A4tige%20deine%20E-Mail-Adresse'
        } catch (e: any) {
            return '/login?_=register&error=' + encodeURIComponent(e.message)
        }
    }

    const oAuth = async ({ state, oAuthUrl }: IOAuthData) => {
        try {
            const url = new URL(oAuthRoute, "http://localhost/")

            url.searchParams.set('authUrl', oAuthUrl)

            if (state && state !== '/') url.searchParams.set('state', state)

            const response = await gFetch({ url: url.pathname + url.search })

            return response.data
        } catch (e: any) {
            console.log(e)
            return '/login?error=' + encodeURIComponent(e.message)
        }
    }

    const logout = async () => {
        try {
            const data = await gFetch({
                url: logoutRoute,
                options: { cache: 'no-store' }
            })

            console.log("Fetch Logout from f-backend:", data)

            setIsLoggedIn(false)
            setUser({})

            return data.data
        } catch (e: any) {
            console.log(e)
            return '/'
        }
    }

    const refreshUser = async (force?: boolean) => {
        try {
            const data = await gFetch({
                url: `${userRoute}${force ? '?force=true' : ''}`,
                options: { cache: 'no-store' }
            })

            console.log("Fetch User from f-backend:", data)

            if (!data.error) {
                setUser(data.data)
                setIsLoggedIn(true)
            } else {
                setUser({})
                setIsLoggedIn(false)
            }

            setReady(true)
        } catch (e) {
            console.log('refreshUser error: ', e)
        }
    }

    /* const get = async <T, U = any>(url: string): Promise<TRequest<T, U>> => {
        try {
            const r = await fetch(`/api/proxy${url}`)
     
            const data = await r.json()
     
            if (data.error) throw new Error(data.data)
            return { data: data.data, details: data.details }
        } catch (e) {
            return { error: e.message }
        }
    }
     
    const del = async <T, U = any>(url: string): Promise<TRequest<T, U>> => {
        try {
            const r = await fetch(`/api/proxy${url}`, {
                method: 'DELETE',
            })
     
            const data = await r.json()
     
            if (data.error) throw new Error(data.data)
            return { data: data.data, details: data.details }
        } catch (e) {
            return { error: e.message }
        }
    } */

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
     
    const post = async <T, U = any>(
        url: string,
        body: any,
    ): Promise<TRequest<T, U>> => {
        try {
            const r = await fetch(`/api/proxy${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
     
            const data = await r.json()
     
            if (data.error) throw new Error(data.data)
            return { data: data.data, details: data.details }
        } catch (e) {
            return { error: e.message }
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
        if (!ready) refreshUser()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const provider = {
        ready,
        login,
        register,
        logout,
        isLoggedIn,
        refreshUser,
        user,
        oAuth,
        /* get,
        post,
        del,
        upload,
        event,
        pageView,*/
    }

    return (
        <AuthContext.Provider value={provider}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContextProvider;