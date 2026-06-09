# celestya — open items / TODO

Notes for later. Captured 2026-06-08 while rewriting the README and tracing the celestya↔backend
contract across `celestya`, `w1nterbot-frontend` and `w1nterbot`.

## Security

- [x] **`GET /api/debug` session leak — fixed.** `debug()` now returns 404 unless `config.debug`
      is set, so it no longer dumps the session (jwt + refresh) on normal deployments.

- [ ] **Refresh token never rotates.** `attemptTokenRefresh` keeps the same refresh token until it
      expires; the backend `/refresh` only returns a new JWT. Consider rotating the refresh token
      on use (and invalidating the old one) to limit replay if one leaks.

## Bugs / inconsistencies

- [ ] **Secure-cookie env var mismatch.** `session.ts` reads `process.env.SECURE`, but the (old)
      README and intent suggest `CELESTYA_SECURE`. Pick one — preferably namespace it
      (`CELESTYA_SECURE`) to match `CELESTYA_SECRET` / `CELESTYA_COOKIE_NAME`.

- [ ] **`Proxy` is not exported.** `src/index.ts` exports `CelestyaProxy` only; the old README's
      `import { Proxy } from "celestya"` never worked. Either export `Proxy` too or keep
      `CelestyaProxy` as the single public entry (README now uses `CelestyaProxy`).

- [ ] **Version/tag drift.** `package.json` is `0.4.0` but the latest git tag is `v0.2.0`. Tag the
      released versions (and decide whether it's published to npm — there's no publish step).

## Code quality

- [ ] **Loose claim typing.** `jwtDecode<any>` everywhere; the session's `decoded` is `any`. Allow a
      generic claims type so `session.token.decoded.exp` etc. is typed.

- [ ] **Dead code in `contextProvider.tsx`.** Large commented-out `upload`, `getContext`, `event`,
      `pageView` blocks (nofy analytics + XHR upload). Either finish `upload` (the package TODO
      mentions a worker-based uploader) or delete the dead blocks.

- [ ] **No tests.** `package.json` test script is the default error stub. Add coverage for the proxy
      dispatch, `serverSideFetch` refresh-on-401 (incl. the global refresh lock), and session shape.

## Backend companion package (evaluated — "celestya as phi middleware")

The backend-side celestya logic splits in two:

- **Verification (incoming requests)** — extract `Bearer` JWT, verify HS256 with `JWT_SECRET`, put
  the user id on the context. This *is* middleware and **already exists** as
  `phi/middleware.JWTAuth` / `JWTOrAPIAuth` + `phi/jwtauth.Verifier`. A thin
  `celestya.Verifier()` alias/recipe is all that's needed here.

- **Issuance / refresh / oauth-callback (endpoints + storage)** — sign the JWT in the exact shape
  celestya expects, manage refresh tokens (generate, store, validate, expire), serve `POST /refresh`,
  and build the `oauth_callback` redirect (`?token=&refresh=&state=`). This is **not** middleware —
  it's handlers + a storage concern. Forcing it into a middleware is the wrong shape.

- [x] **Built:** `go.philip.id/celestya-go` (v0.1.0) — standalone, framework-agnostic (net/http,
      zero deps), https://github.com/PhilipJovanovic/celestya-go . Provides:
  - `IssueJWT(userID string, opts...) (string, error)` — produces the celestya claim shape.
  - a `RefreshStore` **interface** (Save / Find / Delete / Rotate) so it's DB-agnostic (mongopiet or
    anything else plugs in).
  - a ready-made `RefreshHandler` (`phi.Handler`) implementing `POST /refresh` over that store.
  - a helper to build the oauth_callback redirect URL.
  - App-specific bits (user model, OAuth provider, user lookup) stay as callbacks/plug-ins.

  Net: each backend currently hand-rolls `encodeJWT` + refresh-token CRUD + `/refresh`. The
  extraction removes exactly that boilerplate while leaving verification where it already lives.

## Docs (addressed in the README rewrite)

- [x] Document the celestya↔backend contract (endpoints, JWT, refresh, oauth, `{data}`/`{error}`).
- [x] Fix the broken examples (`Proxy`→`CelestyaProxy`, `apiFetch`→`serverSideFetch`,
      `get('/x')`→`get({url})`, the async client component / mismatched JSX).
- [x] Document the full `useAuth()` surface, `APIWrapper`/`serverAPIWrapper`, `cookieHeaders`,
      `augmentToken`, the middleware exp-check, and the `Result` type.
- [x] Drop the empty "upload to npm" section and the internal TODO checklist.
