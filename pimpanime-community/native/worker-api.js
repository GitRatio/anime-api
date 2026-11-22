const kindOk=k=>['anime','movie','tv','manga'].includes(k);
const idOk=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,70}$/.test(x);
const json=(o,status=200,cookie)=>new Response(JSON.stringify(o),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','access-control-allow-origin':'https://pimpanime.tv','vary':'Origin',...(cookie?{'set-cookie':cookie}:{})}});
const bytes=n=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return b};
const hex=b=>Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('');
async function sha(s){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))}
async function passhash(pass,salt){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:210000,hash:'SHA-256'},km,256)))}
const safe=(s,max)=>String(s||'').trim().slice(0,max);
const cookie=t=>'pa_session='+t+'; Path=/api/native-comments; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000';
const removeCookie='pa_session=; Path=/api/native-comments; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
const guard=req=>{const origin=req.headers.get('origin');if(origin!=='https://pimpanime.tv')return false;const site=req.headers.get('sec-fetch-site');return !site||site==='same-origin'};
async function limited(db,key,max,windowSeconds){const now=Math.floor(Date.now()/1000),start=Math.floor(now/windowSeconds)*windowSeconds;await db.prepare("INSERT INTO limits(key,window_at,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window_at=excluded.window_at THEN count+1 ELSE 1 END,window_at=excluded.window_at").bind(key,start).run();const item=await db.prepare('SELECT count FROM limits WHERE key=?').bind(key).first();return item?.count>max}
async function user(req,db){const t=(req.headers.get('cookie')||'').match(/(?:^|;\s*)pa_session=([0-9a-f]{64})(?:;|$)/)?.[1];if(!t)return null;const h=await sha(t);return db.prepare('SELECT u.id,u.email,u.display_name,u.avatar_url,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>unixepoch()').bind(h).first()}
async function signIn(db,u){const t=hex(bytes(32));await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,unixepoch()+2592000)').bind(await sha(t),u.id).run();return json({ok:true,user:{id:u.id,display_name:u.display_name,avatar_url:u.avatar_url||null,role:u.role}},200,cookie(t))}
async function captcha(token,ip,env){if(!env.TURNSTILE_SECRET||!token)return false;const body=new FormData();body.set('secret',env.TURNSTILE_SECRET);body.set('response',token);if(ip)body.set('remoteip',ip);const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:AbortSignal.timeout(5000)});const data=await res.json();return data.success===true&&data.hostname==='pimpanime.tv'}
const oauthCookie='pa_google_flow';
const oauthBase='https://pimpanime.tv/api/native-comments/';
const b64url=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
const googleReady=e=>!!(e.GOOGLE_CLIENT_ID&&e.GOOGLE_CLIENT_SECRET);
function goError(m){const u=new URL('https://pimpanime.tv/community/native/anime/21');u.searchParams.set('auth_error',m);return Response.redirect(u,303)}
async function oauthStart(req,e){if(!googleReady(e))return json({error:'Google login is not configured'},503);
const u=new URL(req.url),ref=u.searchParams.get('from')||'',valid=/^\/community\/native\/(anime|movie|tv|manga)\/[A-Za-z0-9_-]{1,70}\/?$/.test(ref)?ref:'/community/native/anime/21';
const state=hex(bytes(24)),nonce=hex(bytes(24));
const dest=new URL('https://accounts.google.com/o/oauth2/v2/auth');
dest.searchParams.set('client_id',e.GOOGLE_CLIENT_ID);dest.searchParams.set('redirect_uri',oauthBase+'google/callback');dest.searchParams.set('response_type','code');dest.searchParams.set('scope','openid email profile');dest.searchParams.set('state',state);dest.searchParams.set('nonce',nonce);dest.searchParams.set('prompt','select_account');
const cookie=oauthCookie+'='+state+'.'+nonce+'.'+encodeURIComponent(valid)+'; Path=/api/native-comments; HttpOnly; Secure; SameSite=Lax; Max-Age=600';
return new Response(null,{status:302,headers:{Location:dest.toString(),'Set-Cookie':cookie,'Cache-Control':'no-store'}})}
async function verifyGoogleIdToken(token,clientId,nonce){const p=String(token||'').split('.');if(p.length!==3)return null;
let header,body;try{header=JSON.parse(new TextDecoder().decode(b64url(p[0])));body=JSON.parse(new TextDecoder().decode(b64url(p[1])))}catch{return null}
if(header.alg!=='RS256'||!header.kid||!body.sub||body.nonce!==nonce||body.aud!==clientId||!['https://accounts.google.com','accounts.google.com'].includes(body.iss)||body.exp<=Date.now()/1000||body.email_verified!==true)return null;
const r=await fetch('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(5000)});if(!r.ok)return null;const jwks=await r.json(),jwk=(jwks.keys||[]).find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)return null;
const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
const verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64url(p[2]),new TextEncoder().encode(p[0]+'.'+p[1]));
return verified?body:null}
async function oauthCallback(req,e,db){if(!googleReady(e))return goError('Google sign-in is not configured');
const url=new URL(req.url),state=url.searchParams.get('state'),code=url.searchParams.get('code'),cookie=(req.headers.get('cookie')||'').match(/(?:^|;\s*)pa_google_flow=([^;]+)/)?.[1];
const m=cookie?.match(/^([0-9a-f]{48})\.([0-9a-f]{48})\.(.*)$/);
if(!m||!state||m[1]!==state||!code)return goError('Google sign-in expired. Please try again');
let redirect;try{redirect=decodeURIComponent(m[3])}catch{redirect='/community/native/anime/21'}
if(!/^\/community\/native\/(anime|movie|tv|manga)\/[A-Za-z0-9_-]{1,70}\/?$/.test(redirect))redirect='/community/native/anime/21';
const clear=oauthCookie+'=; Path=/api/native-comments; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
try{const form=new URLSearchParams({code,client_id:e.GOOGLE_CLIENT_ID,client_secret:e.GOOGLE_CLIENT_SECRET,redirect_uri:oauthBase+'google/callback',grant_type:'authorization_code'});
const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:form,signal:AbortSignal.timeout(7000)});if(!r.ok)return goError('Google sign-in could not be completed');
const token=await r.json();const data=await verifyGoogleIdToken(token.id_token,e.GOOGLE_CLIENT_ID,m[2]);
if(!data||typeof data.email!=='string')return goError('Google identity verification failed');
let u=await db.prepare('SELECT id,email,display_name,avatar_url,role FROM users WHERE google_sub=?').bind(data.sub).first();
if(!u){const collision=await db.prepare('SELECT id FROM users WHERE email=?').bind(data.email.toLowerCase()).first();if(collision)return goError('Email already registered. Use email sign-in');
const id=crypto.randomUUID(),name=safe(data.name||data.given_name||'Member',40)||'Member',avatar=typeof data.picture==='string'&&data.picture.startsWith('https://')?data.picture.slice(0,700):null;
await db.prepare('INSERT INTO users(id,email,display_name,google_sub,avatar_url) VALUES(?,?,?,?,?)').bind(id,data.email.toLowerCase(),name,data.sub,avatar).run();u={id,email:data.email,display_name:name,avatar_url:avatar,role:'user'}}
const session=await signIn(db,u);const h=new Headers({'Location':'https://pimpanime.tv'+redirect,'Cache-Control':'no-store'});
h.append('Set-Cookie',session.headers.get('set-cookie'));h.append('Set-Cookie',clear);return new Response(null,{status:303,headers:h})
}catch{return goError('Google sign-in failed. Please try again')}}
export default {async fetch(req,env){
  const url=new URL(req.url),path=url.pathname.replace(/^\/api\/native-comments\/?/,'').replace(/\/$/,'');
  if(!url.pathname.startsWith('/api/native-comments'))return json({error:'Not found'},404);
  if(req.method!=='GET'&&req.method!=='POST')return json({error:'Method not allowed'},405);
  const db=env.DB;if(!db)return json({error:'Comments database unavailable'},503);
  if(req.method==='GET'&&path==='google/start')return oauthStart(req,env);
  if(req.method==='GET'&&path==='google/callback')return oauthCallback(req,env,db);
  if(path==='health')return json({status:'ok',service:'pimpanime-native-comments',version:'0.1',emailRegistration:!!env.TURNSTILE_SECRET,googleLogin:!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET),turnstileSiteKey:'0x4AAAAAAGNVHOBeibCrdSE1'});
  if(path==='me'&&req.method==='GET'){const u=await user(req,db);return json({user:u||null,emailRegistration:!!env.TURNSTILE_SECRET,googleLogin:!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET),turnstileSiteKey:'0x4AAAAAAGNVHOBeibCrdSE1'})}
  if(path==='comments'&&req.method==='GET'){
    const kind=url.searchParams.get('kind'),title=url.searchParams.get('id');if(!kindOk(kind)||!idOk(title))return json({error:'Invalid title'},400);
    const cursor=Math.max(0,Math.min(9999999999,Number(url.searchParams.get('before')||0)||0));const page=await db.prepare("SELECT c.id,c.parent_id,c.body,c.spoiler,c.created_at,u.display_name,u.avatar_url,(SELECT count(*) FROM reactions r WHERE r.comment_id=c.id) likes FROM comments c JOIN users u ON u.id=c.user_id WHERE c.kind=? AND c.title_id=? AND c.status='visible' AND (?=0 OR c.created_at<?) ORDER BY c.created_at DESC LIMIT 31").bind(kind,title,cursor,cursor).all();const items=(page.results||[]).slice(0,30);return json({comments:items,hasMore:(page.results||[]).length>30,nextBefore:items.length?items[items.length-1].created_at:null})}
  if(req.method!=='POST')return json({error:'Not found'},404);
  if(!guard(req))return json({error:'Invalid request origin'},403);
  const ip=req.headers.get('cf-connecting-ip')||'unknown',ipkey=await sha(ip);
  if(Number(req.headers.get('content-length')||0)>12000)return json({error:'Request too large'},413);
  let b;try{b=await req.json()}catch{return json({error:'Invalid JSON'},400)}
  if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Invalid body'},400);
  if(path==='register'){
    if(!env.TURNSTILE_SECRET)return json({error:'Registration requires anti-bot configuration'},503);
    if(await limited(db,'reg:'+ipkey,4,86400))return json({error:'Too many registrations'},429);
    const email=safe(b.email,254).toLowerCase(),name=safe(b.name,48),pass=String(b.password||'');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<2||name.length>40||pass.length<12||pass.length>128)return json({error:'Check email, display name and password (12–128 characters)'},400);
    if(!await captcha(b.turnstileToken,ip,env))return json({error:'Anti-bot verification failed'},403);
    const id=crypto.randomUUID(),salt=hex(bytes(16));try{await db.prepare('INSERT INTO users(id,email,display_name,password_salt,password_hash) VALUES(?,?,?,?,?)').bind(id,email,name,salt,await passhash(pass,salt)).run()}catch{return json({error:'Account could not be created; email may already be in use'},409)}
    return signIn(db,{id,display_name:name,avatar_url:null,role:'user'});
  }
  if(path==='login'){
    if(await limited(db,'login:'+ipkey,12,900))return json({error:'Too many login attempts'},429);
    const email=safe(b.email,254).toLowerCase(),pass=String(b.password||'');if(!email||pass.length>128)return json({error:'Invalid credentials'},401);
    const row=await db.prepare('SELECT * FROM users WHERE email=? AND password_salt IS NOT NULL').bind(email).first();
    const actual=await passhash(pass,row?.password_salt||'00000000000000000000000000000000');
    if(!row||actual!==row.password_hash)return json({error:'Invalid credentials'},401);
    return signIn(db,row);
  }
  const me=await user(req,db);
  if(path==='logout'){const token=(req.headers.get('cookie')||'').match(/(?:^|;\s*)pa_session=([0-9a-f]{64})(?:;|$)/)?.[1];if(token)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(token)).run();return json({ok:true},200,removeCookie)}
  if(!me)return json({error:'Sign in to continue'},401);
  if(path==='post'){
    if(await limited(db,'post:'+me.id,20,3600))return json({error:'Posting limit reached'},429);
    const kind=safe(b.kind,12),title=safe(b.id,70),body=safe(b.body,5000),parent=safe(b.parentId,70);
    if(!kindOk(kind)||!idOk(title)||body.length<2||body.length>3000||/[\u0000-\u0008\u000b\u000e-\u001f]/.test(body))return json({error:'Invalid comment'},400);
    if(parent){const p=await db.prepare("SELECT id FROM comments WHERE id=? AND kind=? AND title_id=? AND status='visible'").bind(parent,kind,title).first();if(!p)return json({error:'Reply target unavailable'},400)}
    const id=crypto.randomUUID();await db.prepare('INSERT INTO comments(id,kind,title_id,user_id,parent_id,body,spoiler) VALUES(?,?,?,?,?,?,?)').bind(id,kind,title,me.id,parent||null,body,b.spoiler?1:0).run();return json({ok:true,id},201);
  }
  if(path==='react'){
    const id=safe(b.commentId,60);if(!idOk(id))return json({error:'Invalid comment'},400);
    const item=await db.prepare("SELECT id FROM comments WHERE id=? AND status='visible'").bind(id).first();if(!item)return json({error:'Comment missing'},404);
    if(b.like===false)await db.prepare('DELETE FROM reactions WHERE comment_id=? AND user_id=?').bind(id,me.id).run();
    else await db.prepare("INSERT OR IGNORE INTO reactions(comment_id,user_id) VALUES(?,?)").bind(id,me.id).run();
    return json({ok:true});
  }
  if(path==='report'){
    const id=safe(b.commentId,60),reason=safe(b.reason,400);if(!idOk(id)||reason.length<5)return json({error:'Invalid report'},400);
    const item=await db.prepare("SELECT id FROM comments WHERE id=? AND status='visible'").bind(id).first();if(!item)return json({error:'Comment missing'},404);
    await db.prepare('INSERT OR IGNORE INTO reports(comment_id,user_id,reason) VALUES(?,?,?)').bind(id,me.id,reason).run();return json({ok:true});
  }
  if(path==='hide'){
    if(me.role!=='admin'&&me.role!=='moderator')return json({error:'Moderator required'},403);
    const id=safe(b.commentId,60);if(!idOk(id))return json({error:'Invalid comment'},400);
    await db.prepare("UPDATE comments SET status='hidden',updated_at=unixepoch() WHERE id=?").bind(id).run();return json({ok:true});
  }
  return json({error:'Not found'},404)
}};

