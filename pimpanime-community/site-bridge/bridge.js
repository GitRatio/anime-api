(()=>{"use strict";
const HUB="/community/hub";
const st=document.createElement("style");
st.textContent=".pa27-link{display:inline-flex;align-items:center;gap:7px;color:#d6ecf0;text-decoration:none;font:700 13px/1.2 system-ui,sans-serif;background:#222b37;border:1px solid #415666;border-radius:10px;padding:10px 13px;transition:border-color .12s,background .12s}.pa27-link:hover{background:#293b49;border-color:#6bc7d4;color:#f1fbff}.pa27-link:focus-visible{outline:3px solid #75d0de;outline-offset:2px}.pa27-dock{position:fixed;right:17px;bottom:19px;z-index:2147483000;box-shadow:0 8px 30px #0009;border-radius:11px}.pa27-dock .pa27-link{background:#1a2430;box-shadow:inset 0 2px #70bcc7;min-height:45px}.pa27-footer{padding:15px 18px;color:#b6c4cd;font:12px/1.5 system-ui,sans-serif;text-align:center}.pa27-footer a{color:#9bd9df}.pa27-link svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}@media(max-width:640px){.pa27-dock{right:10px;bottom:calc(12px + env(safe-area-inset-bottom));}.pa27-dock .pa27-link{font-size:12px;padding:10px}.pa27-footer{padding:15px 12px}}@media(prefers-reduced-motion:reduce){.pa27-link{transition:none}}";
document.head.append(st);
const icon='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 11.5a7 7 0 0 1-7 7H7l-4 3v-10a7 7 0 0 1 7-7h3a7 7 0 0 1 7 7z"/><path d="M8 11.5h8M8 14.5h5"/></svg>';
function target(){
 const u=new URL(location.href);
 const path=u.pathname.match(/\/(anime|manga|movie|tv)(?:\/|[-_])(\d{1,9})(?:\/|$|[-_])/i);
 if(path)return "/community/native/"+path[1].toLowerCase()+"/"+path[2];
 let type=(u.searchParams.get("type")||u.searchParams.get("kind")||"anime").toLowerCase();
 if(!["anime","movie","tv","manga"].includes(type))type="anime";
 const id=u.searchParams.get("anilistId")||u.searchParams.get("anilist_id")||u.searchParams.get("malId")||u.searchParams.get("animeId")||u.searchParams.get("id");
 if(/^[1-9]\d{0,8}$/.test(id||"")&&(!u.searchParams.has("malId")))return "/community/native/"+type+"/"+id;
 const hash=decodeURIComponent(u.hash.slice(1));const h=hash.match(/(?:^|\/)(anime|manga|movie|tv)\/([1-9]\d{0,8})(?:$|[/?])/i);
 if(h)return "/community/native/"+h[1].toLowerCase()+"/"+h[2];
 const active=document.querySelector('[data-active-title][data-anilist-id],.detail-modal[data-anilist-id],.title-detail[data-anilist-id]');
 const node=active?.getAttribute("data-anilist-id");
 if(/^[1-9]\d{0,8}$/.test(node||""))return "/community/native/anime/"+node;
 return HUB;
}
function addDock(){
 if(document.getElementById("pa27Dock"))return;
 const dock=document.createElement("div");dock.className="pa27-dock";dock.id="pa27Dock";
 const a=document.createElement("a");a.className="pa27-link";a.href=target();a.id="pa27Discuss";
 a.innerHTML=icon+'<span>Community</span>';
 a.setAttribute("aria-label","Open PimpAnime community");
 dock.append(a);document.body.append(dock);
}
function update(){const a=document.getElementById("pa27Discuss");if(a){const url=target();a.href=url;const title=url===HUB?"Open PimpAnime community":"Discuss this title";a.setAttribute("aria-label",title);a.querySelector("span").textContent=url===HUB?"Community":"Discuss title";}}
function boot(){addDock();update();if(!document.getElementById("pa27Footer")){const footer=document.createElement("div");footer.id="pa27Footer";footer.className="pa27-footer";footer.innerHTML='Join the conversation in <a href="/community/hub">PimpAnime Community</a> · Made for anime fans';const anchor=document.querySelector("footer");if(anchor)anchor.append(footer);}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
const origPush=history.pushState.bind(history),origReplace=history.replaceState.bind(history);
history.pushState=function(...args){const result=origPush(...args);queueMicrotask(update);return result};
history.replaceState=function(...args){const result=origReplace(...args);queueMicrotask(update);return result};
window.addEventListener("popstate",update);window.addEventListener("hashchange",update);
new MutationObserver(()=>{if(!document.getElementById("pa27Dock")&&document.body)addDock();update();}).observe(document.documentElement,{childList:true,subtree:true});
})();