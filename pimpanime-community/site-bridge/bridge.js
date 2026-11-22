(()=>{"use strict";
const HUB="/community/hub";
const st=document.createElement("style");
st.textContent=" .pa27-panel{padding:0;border:1px solid #42596a;border-radius:17px;background:#141b25;color:#eef5fa;width:min(900px,94vw);height:min(790px,88dvh);max-height:92dvh;box-shadow:0 20px 80px #000b}.pa27-panel::backdrop{background:#05060dbb;backdrop-filter:blur(5px)}.pa27-panel-bar{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #344657}.pa27-panel-bar strong{font:800 15px system-ui,sans-serif}.pa27-panel-bar .pa27-link{margin-left:auto;padding:7px 10px;font-size:12px;min-height:38px}.pa27-close{background:#252f3c;color:#edf5fa;border:1px solid #4a5868;border-radius:9px;padding:9px 12px;font:700 12px system-ui;cursor:pointer}.pa27-close:hover{background:#364658}.pa27-panel iframe{border:0;width:100%;height:calc(100% - 64px);background:#0e121a}@media(max-width:580px){.pa27-panel{width:100vw;max-width:100vw;height:92dvh;max-height:92dvh;border-radius:15px 15px 0 0;margin:auto auto 0}.pa27-panel-bar strong{font-size:12px}.pa27-panel-bar .pa27-link{font-size:11px}}.pa27-link{display:inline-flex;align-items:center;gap:7px;color:#d6ecf0;text-decoration:none;font:700 13px/1.2 system-ui,sans-serif;background:#222b37;border:1px solid #415666;border-radius:10px;padding:10px 13px;transition:border-color .12s,background .12s}.pa27-link:hover{background:#293b49;border-color:#6bc7d4;color:#f1fbff}.pa27-link:focus-visible{outline:3px solid #75d0de;outline-offset:2px}.pa27-dock{position:fixed;right:17px;bottom:19px;z-index:2147483000;box-shadow:0 8px 30px #0009;border-radius:11px}.pa27-dock .pa27-link{background:#1a2430;box-shadow:inset 0 2px #70bcc7;min-height:45px}.pa27-footer{padding:15px 18px;color:#b6c4cd;font:12px/1.5 system-ui,sans-serif;text-align:center}.pa27-footer a{color:#9bd9df}.pa27-link svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}@media(max-width:640px){.pa27-dock{right:10px;bottom:calc(12px + env(safe-area-inset-bottom));}.pa27-dock .pa27-link{font-size:12px;padding:10px}.pa27-footer{padding:15px 12px}}.pa27-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;width:100%;margin:36px auto 0;padding:21px clamp(16px,4vw,48px);border-top:1px solid #354451;background:#111923;color:#aebfca;position:relative;z-index:1;text-align:left}.pa27-footer-brand{font-weight:850;letter-spacing:.02em;color:#e8f8fa;font-size:16px}.pa27-footer-nav{display:flex;gap:16px;flex-wrap:wrap}.pa27-footer-nav a{color:#a3dce4;font-size:13px;font-weight:650}.pa27-footer small{font-size:12px;color:#a9b8c5}.pa27-footer-inside{margin:18px 0 0;box-shadow:none}@media(max-width:640px){.pa27-footer{justify-content:center;text-align:center;padding:22px 14px 90px;margin-top:24px}.pa27-footer-nav{justify-content:center;gap:16px}.pa27-footer-brand{width:100%}}@media(prefers-reduced-motion:reduce){.pa27-link{transition:none}}";
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
function discussPanel(url){
 let dialog=document.getElementById("pa27Panel");
 if(!dialog){
 dialog=document.createElement("dialog");dialog.id="pa27Panel";dialog.className="pa27-panel";
 const bar=document.createElement("div");bar.className="pa27-panel-bar";
 const name=document.createElement("strong");name.textContent="PimpAnime discussion";
 const open=document.createElement("a");open.className="pa27-link";open.id="pa27Full";open.target="_top";open.textContent="Open full page";open.href=url;
 const close=document.createElement("button");close.type="button";close.className="pa27-close";close.textContent="Close";close.addEventListener("click",()=>dialog.close());
 const frame=document.createElement("iframe");frame.id="pa27Frame";frame.title="PimpAnime comments";frame.loading="lazy";frame.referrerPolicy="same-origin";
 bar.append(name,open,close);dialog.append(bar,frame);
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
 dialog.addEventListener("close",()=>{const i=document.getElementById("pa27Frame");if(i)i.removeAttribute("src")});
 document.body.append(dialog);
 }
 const frame=dialog.querySelector("iframe"),link=dialog.querySelector("#pa27Full");
 frame.src=url;link.href=url;
 if(typeof dialog.showModal==="function")dialog.showModal();else location.assign(url);
}
function addDock(){
 if(document.getElementById("pa27Dock"))return;
 const dock=document.createElement("div");dock.className="pa27-dock";dock.id="pa27Dock";
 const a=document.createElement("a");a.className="pa27-link";a.href=target();a.id="pa27Discuss";
 a.innerHTML=icon+'<span>Community</span>';
 a.setAttribute("aria-label","Open PimpAnime community");
 a.addEventListener("click",e=>{const url=target();if(url===HUB||!url.startsWith("/community/native/"))return;e.preventDefault();discussPanel(url)});dock.append(a);document.body.append(dock);
}
function update(){const a=document.getElementById("pa27Discuss");if(a){const url=target();if(a.getAttribute("href")!==url)a.setAttribute("href",url);const title=url===HUB?"Open PimpAnime community":"Discuss this title";if(a.getAttribute("aria-label")!==title)a.setAttribute("aria-label",title);const label=url===HUB?"Community":"Discuss title";const span=a.querySelector("span");if(span&&span.textContent!==label)span.textContent=label;}}
function ensureFooter(){
 if(document.getElementById("pa27Footer"))return;
 if(!document.body)return;
 const footer=document.createElement("footer");
 footer.id="pa27Footer";
 footer.className="pa27-footer";
 footer.setAttribute("aria-label","PimpAnime footer");
 const brand=document.createElement("div");brand.className="pa27-footer-brand";brand.textContent="PimpAnime";
 const nav=document.createElement("nav");nav.className="pa27-footer-nav";nav.setAttribute("aria-label","Footer navigation");
 for(const [label,url] of [["Home","/"],["Community","/community/hub"],["Discussions","/community/native/anime/21"]]){
   const a=document.createElement("a");a.href=url;a.textContent=label;nav.append(a);
 }
 const line=document.createElement("small");line.textContent="© "+new Date().getFullYear()+" PimpAnime · Made for anime fans";
 footer.append(brand,nav,line);
 const existing=document.querySelector("footer:not(#pa27Footer)");
 if(existing){existing.append(footer);footer.classList.add("pa27-footer-inside");}
 else document.body.append(footer);
}
function boot(){addDock();ensureFooter();update();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
const origPush=history.pushState.bind(history),origReplace=history.replaceState.bind(history);
history.pushState=function(...args){const result=origPush(...args);queueMicrotask(update);return result};
history.replaceState=function(...args){const result=origReplace(...args);queueMicrotask(update);return result};
window.addEventListener("popstate",update);window.addEventListener("hashchange",update);
let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;if(!document.getElementById("pa27Dock")&&document.body)addDock();if(!document.getElementById("pa27Footer")&&document.body)ensureFooter();update()})}).observe(document.documentElement,{childList:true,subtree:true});
})();