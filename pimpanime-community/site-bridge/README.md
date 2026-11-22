# PimpAnime 2.7 — Community Bridge & Rollback

## Deployment

On 2026-11-22, the Cloudflare zone `pimpanime.tv` switched its catch-all route `pimpanime.tv/*` (ID `3a96536547d94c5591d441ff9986d3ad`) from `pimpanime` to `pimpanime-ui-bridge`.

The bridge's service binding `PIMPANIME_ORIGIN` calls the original Worker `pimpanime` (production environment). **Do not delete or replace that original Worker**: it still holds the production static assets and TMDB secret. The bridge transforms only successful GET HTML responses via HTMLRewriter and appends a same-origin `/__pa27/bridge.js` script. Other responses (CSS, media, JS, API) are forwarded unchanged.

The bridge adds an accessible Community link (using stable page/title IDs only when detected) and a footer community link when the original footer exists. For a reliably identified title, the Community control opens an accessible on-site dialog containing the native comment page, with a separate full-page link for Google OAuth and accessibility; for unknown titles the control directs to Community Hub without guessing an identifier. `/community/hub` is served by the bridge using the bundled Hub HTML. `/__pa27/preview` proxies the original homepage and injects the link for manual comparison. `/__pa27/health` exposes bridge configuration metadata, not secrets.

## Routes intentionally preserved

- `pimpanime.tv/api/tenrai/*` → `pimpanime-tenrai-preview`
- `pimpanime.tv/api/poster/*` → `pimpanime-poster-details`
- `pimpanime.tv/api/community/*` → `pimpanime-community-assets`
- `pimpanime.tv/api/native-comments/*` → `pimpanime-native-comments`
- `pimpanime.tv/community/native/*` → `pimpanime-native-comments-ui`
- `pimpanime.tv/community/*` → `pimpanime-community-pages`
- `pimpanime.tv/community/hub*` and `pimpanime.tv/__pa27/*` → `pimpanime-ui-bridge`

## Immediate rollback (no asset restore needed)

In Cloudflare Dashboard → Websites → `pimpanime.tv` → Workers Routes, edit the **`pimpanime.tv/*`** route to use the original `pimpanime` script. Alternatively use the authenticated Cloudflare API:

```http
PUT /zones/35451612aef0a3ae6176535797a8fd18/workers/routes/3a96536547d94c5591d441ff9986d3ad
Content-Type: application/json

{"id":"3a96536547d94c5591d441ff9986d3ad","pattern":"pimpanime.tv/*","script":"pimpanime"}
```

The original Worker version is `09bf0c7a-bbec-4ed1-b2b4-fdd5d9501653`. Rollback leaves dedicated community and API routes intact.

## QA requirements before calling the rollout fully verified

- Open `https://pimpanime.tv/` and `https://pimpanime.tv/__pa27/preview`; confirm the original homepage renders and its catalog is functional.
- Verify `/__pa27/bridge.js` loads without CSP or console errors, and the Community link opens `/community/hub` when no title is active.
- On a known title, test the on-site discussion panel, Escape/Close, reopening, focus, keyboard navigation, and **Open full page** for Google OAuth (Google login should not be attempted inside an iframe).
- Open at least one title with a verifiable AniList ID and confirm **Discuss title** links to its own native comments page; if no reliable ID is available, the link should lead to Community Hub rather than guessing.
- Test player playback, source switching, search, browser back/forward, page navigation, mobile keyboard/safe area, Giscus fallback and native comments Google/email sign-in.
- Confirm no unexpected errors or elevated 5xx responses after deployment; rollback via the route edit if the original site is affected.

The external browser testing environment blocked the domain, so the Cloudflare route and module syntax are confirmed but the browser/runtime acceptance steps remain outstanding. This release intentionally does not rewrite the existing catalogue's HTML source or app.js player.

## Remaining work

- Native comments directly inside the original title detail renderer (requires editable static frontend assets).
- Full email verification/recovery and admin moderation dashboard.
- Publish and integrate the 50 uploaded PNG Discord emoji assets (the currently deployed picker contains 55 SVG emotes). Optimized files and the sprite sheet are packaged separately, not yet hosted on the domain.
