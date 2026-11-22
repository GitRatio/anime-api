# PimpAnime native comments (beta)

The native comments system is isolated from the existing PimpAnime catalogue/player and from other projects' authentication databases. It uses the Cloudflare D1 database `pimpanime-community-db`, Workers `pimpanime-native-comments` and `pimpanime-native-comments-ui`, and Turnstile widget `PimpAnime Community Signup`.

## Active endpoints

- UI: `https://pimpanime.tv/community/native/anime/21` (substitute the title type and identifier)
- UI: `/community/native/{anime|movie|tv|manga}/{id}`
- API: `/api/native-comments/health`
- API: `/api/native-comments/me`
- API: `/api/native-comments/comments?kind=anime&id=21`
- POST: `register`, `login`, `logout`, `post`, `react`, `report`, `hide`, `edit`, `delete`
- Google OAuth: `/api/native-comments/google/start` and `/api/native-comments/google/callback`

The Google OAuth implementation validates state, nonce, identity-token audience, expiry, and signature against Google's JWKS. Email/password registration uses PBKDF2-SHA256 and Cloudflare Turnstile. HTTP-only Secure SameSite cookies are used for sessions.

## Required configuration before public signup

In the Cloudflare dashboard, open Workers & Pages → `pimpanime-native-comments` → Settings → Variables and Secrets.

1. Add secret `TURNSTILE_SECRET` using the **secret** of the existing Turnstile widget `PimpAnime Community Signup`. Do not publish the secret in a repository or chat. Its public site key is `0x4AAAAAAGNVHOBeibCrdSE1`. Email signup is intentionally disabled without the server-side secret.
2. In Google Cloud Console, create a Web application OAuth client for PimpAnime. Set Authorized JavaScript origin `https://pimpanime.tv`; Authorized redirect URI `https://pimpanime.tv/api/native-comments/google/callback`. Configure the consent screen and publishing/test-user status.
3. Add Worker secrets `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from that dedicated Google OAuth client. Google sign-in is intentionally disabled without both.
4. If Google OAuth credentials change, redeploy or ensure Worker bindings are updated. Do not reuse another application's client secrets.
5. Test email registration with a fresh account, Google sign-in and callback, failed login, CSRF denial, comment posting, spoiler reveal, reactions, reports, and logout in Firefox and a mobile viewport.

Email verification, password-reset email delivery, and robust moderation dashboards are **not yet implemented**. Do not describe this beta as having verified emails or recovery. Consider using a dedicated transactional email service and double-opt-in before general public rollout.

## Moderation

The API supports comment reporting and moderator hiding. Native visitors can reply to comments and edit their own comments within 24 hours or delete them. Moderator/admin users can hide comments. Deleted comments are soft-hidden in D1, not erased. It currently has no UI for assigning moderators. After creating the owner's account, a trusted database administrator can set its role in D1:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-verified-admin-email@example.com';
```

Replace the example with the actual verified owner email; never promote an unverified account without validating ownership.

## Existing Giscus community

Giscus remains at `/community/{type}/{id}`. Its configuration is in `../giscus.json` and the PimpAnime CSS/JS assets are in `../`. Native comments and Giscus are separate stores. Do not silently mirror users' comments between them.

## Deployment safety and known limitations

The original `pimpanime` production Worker has not been overwritten. Native UI and API routes are separately deployed to avoid disturbing the original Cloudflare Static Assets binding. The native comments interface is not yet automatically mounted inside the existing catalogue/title detail pages. Browser acceptance from this session was blocked by Cloudflare Browser Rendering rate limits and external bot restrictions.

Worker source in this directory is a versioned source backup; changes should be reviewed and deployed with a reproducible pipeline, never by copying partial/truncated API output.
