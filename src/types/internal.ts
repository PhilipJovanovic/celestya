export interface IRequestSuccess<T, U = any> {
    error?: string;
    data: T;
    message?: U;
}

export interface IRequestError<T, U = any> {
    error: string;
    data?: T;
    message?: U;
}

export type TRequest<T, U> = IRequestError<T, U> | IRequestSuccess<T, U>;

export interface ILoginData {
    data: object;
    redirect?: string;
}

export interface IRegisterData {
    data: object;
    redirect?: string;
}

export interface IOAuthData {
    state: string;
    oAuthUrl: string;
}

export interface IAuthContext<U> {
    isLoggedIn: boolean;
    ready: boolean;
    user: U;
    login: (data: ILoginData) => Promise<string>;
    register: (data: IRegisterData) => Promise<string>;
    oAuth: (data: IOAuthData) => Promise<string>;
    logout: () => Promise<string>;
    refreshUser: (force?: boolean) => Promise<void>;
    /* get: <T, U = any>(url: string) => Promise<TRequest<T, U>>;
  del: <T, U = any>(url: string) => Promise<TRequest<T, U>>;
  post: <T, U = any>(url: string, body: any) => Promise<TRequest<T, U>>;
  upload: <T, U = any>(
    url: string,
    formName: string,
    files: File[],
    setProgress: (p: number) => void
  ) => Promise<TRequest<T, U>>;
  event: (name: string, value?: any) => Promise<boolean>;
  pageView: (url: string, referer?: string) => Promise<boolean>; */
}

export interface IAuthContextOptions {
    children: React.ReactNode;

    // Route prefix of (local) API
    routePrefix?: string;
}
