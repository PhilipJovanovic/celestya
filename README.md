# celestya

Highly opinionated session management tool for NextJS Frontends

## How to use

Add environment vars (dont expose them publically!!)

```bash
//.env

CELESTYA_SECRET=XXXXXX      // AT_LEAST_32_CHARACTERS
CELESTYA_COOKIE_NAME=XXXX   // COOKIE_NAME
CELESTYA_SECURE=true        // true / false
```

Configure the api endpoints

```tsx
// /src/app/api/[[...endpoint]]

import { API_URL, HOST } from "@/config/env";
import { IConfig, IRequestOptions, Proxy } from "celestya";

const config: IConfig = {
    host: HOST || "missing-host",
    route: "/api",
    apiUrl: API_URL || "missing-api-url",
    userEndpoint: "/user",
};

export const POST = (req: any, opt: IRequestOptions) => Proxy("POST", req, opt, config);
export const GET = (req: any, opt: IRequestOptions) => Proxy("GET", req, opt, config);
```

Configure the provider

```tsx
// /src/app/layout.tsx

import { AuthProvider, Logout } from "celestya/client";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode,
}) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
```

Use the getSession function in server components (keep in mind they dont revalidate often!)

```tsx
// /src/app/navbar.tsx

import { getSession, /* Session */ } from "celestya";

// Optionally provide a user object
interface User {
    email: string
    name: string
}

const Navbar = async () => {
    // const session: Session<User> = await getSession(); <- optional
    const session = await getSession<User>();

    return <div>Welcome: {session.user?.name}</div>;
};

export default Navbar;
```

Use the apiFetch function in server components

```tsx
// /src/app/navbar.tsx

import { apiFetch } from "celestya";
import { config } from "@/app/api/[[...endpoint]]/route"

// Optionally provide a user object
interface User {
    email: string
    name: string
}

const Navbar = async () => {
    const user = await apiFetch("user", {}, config)

    return <div>Welcome: {session.user?.name}</div>;
};

export default Navbar;
```


Use the other functions in client components

```tsx
// /src/app/page.tsx

import { useAuth } from 'celestya/client'

// Optionally provide a user object
interface User {
    email: string
    name: string
}

const Home = async () => {
    const { ready, get } = useAuth()

    const handleClick = () => {
        try {
            if (!ready) throw new Error('Not ready')
            const res = await get('/user/billing')

            console.log(res)
        } catch (e) {
            console.log(e)
        }
    }

    return <Button onClick={handleClick}>Welcome: {session.user?.name}</div>;
};

export default Navbar;
```

## Todo

- [ ]: Upload request with worker as helper (?)
- [ ]: Refresh logic
- [x]: Change returns at error
- [x]: GET request with auth
- [x]: POST request with auth
- [x]: Fix issue with getSession serverside and config set at layout (If used at api/\_/route.tsx)
- [x]: Fix issue with api endpoints if no layout has been loaded (if accessing api directly)
