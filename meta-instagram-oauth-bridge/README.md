# Meta Instagram OAuth callback bridge

This isolated service only receives Meta's short-lived OAuth `code` and `state`, then redirects the browser to the fixed local AgendoEngaje callback at `http://127.0.0.1:47820/auth/meta/callback`.

- It does not exchange or persist access tokens.
- The local app validates the OAuth state, exchanges the code, and stores the token in its encrypted local vault.
- It has no configurable redirect target, so it cannot be used as an open redirect.
- Application logs intentionally omit request URLs and query strings.
- Render's own platform-level request logging/retention still needs to be considered; code and state pass through the HTTPS service briefly.

Render settings for a separate service:

- Runtime: Node
- Build command: `npm --prefix meta-instagram-oauth-bridge install`
- Start command: `npm --prefix meta-instagram-oauth-bridge start`
- Health check path: `/healthz`
- Environment: no secrets or tokens required

Do not point the existing licensing service at this project or merge it into that service.
