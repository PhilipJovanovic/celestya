# celestya

Highly opinionated session & auth layer for **Next.js (App Router)** frontends. It pairs with a
[`phi`](https://github.com/PhilipJovanovic/phi)-style backend: the frontend never holds tokens in
JS — celestya keeps the JWT + refresh token in an encrypted `iron-session` cookie and ships a
built-in proxy that attaches `Authorization: Bearer <jwt>` to every backend call and transparently
refreshes on `401`.

```
browser ──/api/proxy/*──▶ celestya proxy (Next server) ──Bearer JWT──▶ your phi backend
                              │ reads JWT from iron-session cookie
                              │ on 401: POST /refresh, retry
```

- **Client** (`celestya/client`): `AuthProvider`, `useAuth`, `APIWrapper`, `Logout`.
- **Server** (`celestya`): `CelestyaProxy`, `getSession`, `serverSideFetch`, `serverAPIWrapper`.

## Install

```sh
npm i celestya
```

```bash
# .env  — never expose these publicly
CELESTYA_SECRET=<at-least-32-characters>   # iron-session encryption key
CELESTYA_COOKIE_NAME=<your-app-cookie>     # session cookie name
SECURE=true                                # secure cookie flag (set false for local http)
```

> Note: the secure-cookie flag is read from `SECURE`, not `CELESTYA_SECURE`. See [TODO.md](./TODO.md).

## Setup

### 1. The proxy route

Create a catch-all route. `CelestyaProxy(config)` returns the `GET`/`POST`/`DELETE` handlers and
owns all `/api/*` auth + proxy traffic. Export `config` too — server components reuse it.

```ts
// src/app/api/[[...endpoint]]/route.ts
import { CelestyaProxy, IConfig } from "celestya";

export const config: IConfig = {
  host: process.env.NEXT_PUBLIC_HOST!, // e.g. http://localhost:3000
  route: "/api",                       // must match this route's folder
  apiUrl: process.env.NEXT_PUBLIC_API!, // your backend base URL
  userEndpoint: "/user",               // backend endpoint returning the current user
  // debug: true,
  // cookieHeaders: { "w1nter-editor": "X-Editor-Channel" }, // forward cookies as headers during SSR
};

export const { GET, POST, DELETE } = CelestyaProxy(config);
```

### 2. The provider

```tsx
// src/app/layout.tsx
import { AuthProvider } from "celestya/client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Protecting routes (middleware)

celestya stores the decoded JWT in the session, so middleware can check expiry without a network
call and bounce to the refresh endpoint:

```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "celestya";

export async function middleware(req: NextRequest) {
  const session = await getSession();
  const { pathname } = req.nextUrl;

  if (!session.token) {
    return NextResponse.redirect(new URL(`/login?r=${pathname}`, req.url));
  }

  const exp = (session.token.decoded as any).exp;
  const now = (Date.now() / 1000) | 0;
  if (exp - now < 0) {
    // expired -> refresh, then come back to `r`
    return NextResponse.redirect(new URL(`/api/refresh?r=${pathname}`, req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
```

## Client usage

`useAuth()` is the main hook (client components only):

```tsx
"use client";
import { useAuth } from "celestya/client";

function Profile() {
  const { ready, isLoggedIn, user, get, post, oAuth, logout } = useAuth();

  // proxied, authenticated calls — return a Result (see below)
  const load = async () => {
    const res = await get<Billing>({ url: "/user/billing" }); // -> GET /api/proxy/user/billing
    if (res.isErr()) return console.error(res.error);
    console.log(res.value.data);
  };

  // OAuth login: state = where to land after login
  const login = async () => {
    const dest = await oAuth({ oAuthUrl: "/oauth/twitch", state: "/dashboard" });
    window.location.href = dest;
  };

  if (!ready) return null;
  return isLoggedIn ? <button onClick={logout}>Logout</button> : <button onClick={login}>Login</button>;
}
```

Full `useAuth()` surface:

| Member | Description |
| ------ | ----------- |
| `ready`, `isLoggedIn`, `user` | Auth state (user is fetched once on mount via `userEndpoint`) |
| `login(data)` / `register(data)` | Credential login/register (POST `/api/login` / `/register`) |
| `oAuth({ oAuthUrl, state, onErrorUrl? })` | Start an OAuth flow; returns the redirect URL |
| `logout()` | Destroy the session |
| `refreshUser(force?)` | Re-fetch the current user |
| `get/post/del({ url, body?, headers? })` | Authenticated proxied calls; return `Result<T>` |
| `setHeader(k,v)` / `removeHeader(k)` | Per-client custom headers added to every proxied call |
| `augmentToken({ url, method?, body? })` | Swap the JWT for a new one (e.g. "act as" another account) |

### Typed API wrapper

Define your API once, get a typed hook:

```tsx
import { APIWrapper, type WrapperFunction } from "celestya/client";

export const useAPI = APIWrapper((cb: WrapperFunction) => ({
  commands: {
    list: () => cb<Command[]>({ method: "GET", url: "/commands" }),
    update: (id: string, body: object) => cb({ method: "POST", url: `/commands/${id}`, body }),
  },
}));

// component:
const api = useAPI();
const res = await api.commands.list();
```

## Server usage

In server components, read the session or call the backend directly (reusing `config`):

```tsx
import { getSession, serverSideFetch } from "celestya";
import { config } from "@/app/api/[[...endpoint]]/route";

export default async function Page() {
  const session = await getSession<User>();          // { user?, token? }
  const res = await serverSideFetch<User>({ url: "/user", config });
  if (res.isErr()) return <div>error</div>;
  return <div>Welcome {res.value.data.name}</div>;
}
```

`serverAPIWrapper(wrapper, config)` is the server-side counterpart to `APIWrapper`.

## The backend contract

This is the opinionated part. celestya talks to your backend over a small, fixed contract. A
`phi` backend satisfies it almost for free, because the envelopes line up 1:1:

- **Success** responses are `{ "data": <payload> }` — exactly `phi.Response.JSON(...)`.
- **Error** responses are `{ "error": "...", "message": "..." }` — exactly `phi.Error`. celestya
  treats any body with an `error` field as a failure (`Result.isErr()`).
- A **`401`** on a proxied call triggers celestya's refresh-then-retry.

### Endpoints your backend must expose

| Endpoint | Method | celestya sends | backend returns |
| -------- | ------ | -------------- | --------------- |
| `userEndpoint` (e.g. `/user`) | GET | `Authorization: Bearer <jwt>` | `{ "data": <user> }` |
| `/refresh` | POST | `{ "refreshToken": "<token>" }` | `{ "data": { "token": "<new jwt>" } }` |
| `<oAuthUrl>` (e.g. `/oauth/twitch`) | GET | `?returnUrl=<host>/api/oauth_callback` | `{ "data": "<provider auth url>" }` |
| `<oAuthUrl>` provider redirect | — | (provider calls `returnUrl`) | redirect to `returnUrl?token=<jwt>&refresh=<token>&state=<state>` |
| `/login` (optional) | POST | the credentials body | `{ "data": { "token": "<jwt>", "refresh": "<token>" } }` |
| any protected route | ANY | `Authorization: Bearer <jwt>` | any `{ "data": ... }` |

### JWT requirements

- Algorithm **HS256**, signed with a secret shared with the backend (`JWT_SECRET`). celestya only
  *decodes* the JWT (never verifies) — the backend verifies it via `phi/jwtauth.Verifier` +
  `middleware.JWTAuth`.
- Must include an **`exp`** claim (middleware checks it client-side) and an identity claim the
  backend reads (w1nterbot uses **`jti`** = user id; `middleware.GetUserID` reads it).

### Refresh tokens

- Opaque random string, issued alongside the JWT (OAuth callback / login), stored in the backend DB
  with an expiry and the user id.
- On `POST /refresh`, the backend validates the refresh token and returns a **new JWT only** — the
  refresh token itself is reused until it expires.

### Minimal phi backend side

```go
// POST /refresh
func refresh(w *phi.Response, r *phi.Request) *phi.Error {
    body, err := phi.Validate[RefreshBody](r) // { RefreshToken string `json:"refreshToken,required"` }
    if err != nil { return err }

    rt, e := db.FindOne[RefreshToken]("refreshtokens", bson.M{"token": body.RefreshToken})
    if e != nil || time.Now().After(rt.ExpiresAt) { return phi.Unauthorized() }

    token, _ := issueJWT(rt.UserID.Hex()) // HS256, claims: jti, exp, iss, sub
    return w.JSON(map[string]string{"token": token}) // -> { "data": { "token": ... } }
}
```

> `augmentToken` (client) → `POST /api/augment` → backend returns `{ "data": { "token": <jwt> } }`;
> celestya swaps the session JWT and clears the cached user. Used for "act as another account"
> (w1nterbot's editor switch via the `as` claim).

## Reference

### `IConfig`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `host` | string | Public origin of the Next app (for building redirect URLs) |
| `route` | string | The proxy mount path; must match the route folder (e.g. `/api`) |
| `apiUrl` | string | Backend base URL |
| `userEndpoint` | string | Backend endpoint returning the current user |
| `debug?` | boolean | Verbose proxy logging |
| `cookieHeaders?` | `Record<string,string>` | Map cookie → header; forwarded to the backend during SSR |

### Result type

`get/post/del`, `serverSideFetch` and the wrappers return a `Result<T>`:

```ts
const res = await get<User>({ url: "/user" });
if (res.isErr()) { /* res.error: { error, message } */ }
else { /* res.value.data: User */ }
```

### Proxy endpoints (handled by `CelestyaProxy`)

`GET /api/{user,refresh,logout,oauth,oauth_callback,debug}`, `POST /api/{login,augment}`,
`{GET,POST,DELETE} /api/proxy/*` (everything under `/proxy` is forwarded to the backend with the
bearer token attached).

## License

ISC.
