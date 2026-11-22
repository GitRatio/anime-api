# PimpAnime community integration (Giscus)

Configured GitHub repository: `GitRatio/anime-api`, General discussion category. The project uses title-specific discussion terms instead of the literal placeholder `anime-{anilistId}`.

## Deployed Cloudflare routes

- `https://pimpanime.tv/api/community/pimpanime-giscus.js` — title-aware controller
- `https://pimpanime.tv/api/community/pimpanime-giscus.css` — restrained samurai-style card
- `https://pimpanime.tv/api/community/giscus-theme.css` — stylesheet for Giscus iframe
- `https://pimpanime.tv/api/community/health` — asset-worker health

## Add to title detail template

```html
<div id="pimpanime-comments"></div>
<script defer src="/api/community/pimpanime-giscus.js"></script>
```

After the site renders a title (and the module has loaded), call:

```js
PimpAnimeComments.mount(document.getElementById('pimpanime-comments'), {
  type: 'anime', // 'anime', 'movie', 'tv', or 'manga'
  id: String(title.id), // REAL title ID, not display name or placeholder
  title: title.displayTitle
});
```

To integrate declaratively, add `data-pimpanime-comments data-type="anime" data-id="21" data-title="Cowboy Bebop"` to an element **before** loading the script. The SPA needs to call `mount` again after navigation for a new title.

The term is `pimpanime:anime-21` for anime 21, `pimpanime:movie-123` for a movie, etc. Ensure IDs are canonical within each type. The script only loads Giscus after a visitor clicks **Show discussion**, with GitHub authentication handled by Giscus. It does not touch the player or other catalog logic.

## Status / restrictions

The Cloudflare route was registered and the GitHub files were committed, but direct HTTP validation of the public endpoints was blocked by the external testing environment. The original `pimpanime` Worker and frontend static assets have **not** been modified. The comment widget will not appear until the original frontend title renderer includes the mount point and script. Check the site's CSP allows `https://giscus.app` in `script-src` and `frame-src`; custom iframe theme also requires the assets endpoint to respond successfully.

Do not inject this globally on every route, embed multiple concurrent comment instances on the same page, or alter GitHub discussions unrelated to PimpAnime. Moderation happens in the linked GitHub Discussions repository.
