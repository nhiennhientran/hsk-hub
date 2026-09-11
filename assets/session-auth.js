/* Two-stage session-only password gate for the HSK site.
   Stage 1: website password unlocks the general portal for the current tab session.
   Stage 2: HSK 4 上 / 下 share one additional password, also for the current tab session.
   Closing the tab/browser session requires the relevant password(s) again. */
(()=>{
  'use strict';
  if(window.__HSK_SESSION_AUTH_V2_LOADED)return;
  window.__HSK_SESSION_AUTH_V2_LOADED=true;

  const PORTAL_KEY='hsk_portal_unlocked_v2';
  const HSK4_KEY='hsk4_extra_unlocked_v1';
  const LEGACY_LOCAL_KEY='hsk_site_unlocked_v1';
  const GENERAL_COMPAT_KEYS=['hsk1_ranteacher_unlocked','hsk2_ranteacher_unlocked','hsk3_ranteacher_unlocked'];
  const HSK4_COMPAT_KEYS=['hsk4_upper_ranteacher_unlocked','hsk4_lower_ranteacher_unlocked'];
  const PORTAL_HASH='5b363ff1986142a6f34d3e259948aa38ec4773ad293a0cc03f2357877433a0c5';
  const HSK4_HASH='5b363ff1986142a6f34d3e259948aa38ec4773ad293a0cc03f2357877433a0c5';

  const byId=id=>document.getElementById(id);
  const isHsk4Page=()=>document.body?.classList.contains('hsk4-upper')||document.body?.classList.contains('hsk4-lower')||/(?:^|\/)hsk4(?:up)?\//i.test(location.pathname||'');
  async function digest(text){
    if(!globalThis.crypto?.subtle)return null;
    const data=new TextEncoder().encode(String(text));
    const hash=await crypto.subtle.digest('SHA-256',data);
    return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function clearLegacyPersistence(){try{localStorage.removeItem(LEGACY_LOCAL_KEY)}catch(_e){}}
  function getSession(key){try{return sessionStorage.getItem(key)==='1'}catch(_e){return false}}
  function setSession(key,on=true){try{if(on)sessionStorage.setItem(key,'1');else sessionStorage.removeItem(key)}catch(_e){}}
  function portalUnlocked(){return getSession(PORTAL_KEY)}
  function hsk4Unlocked(){return getSession(HSK4_KEY)}
  function setGeneralCompat(){GENERAL_COMPAT_KEYS.forEach(k=>setSession(k,true))}
  function setHsk4Compat(on){HSK4_COMPAT_KEYS.forEach(k=>setSession(k,on))}
  function normalizeCompat(){
    clearLegacyPersistence();
    if(portalUnlocked())setGeneralCompat();
    if(hsk4Unlocked())setHsk4Compat(true);else setHsk4Compat(false);
    /* Do not set the old hsk_portal_unlocked key: legacy HSK4 code treated it as a full HSK4 unlock. */
    setSession('hsk_portal_unlocked',false);
  }
  function currentStage(){
    if(!portalUnlocked())return 'portal';
    if(isHsk4Page()&&!hsk4Unlocked())return 'hsk4';
    return null;
  }
  function updateGateCopy(stage){
    const overlay=byId('pwOverlay');if(!overlay)return;
    const title=overlay.querySelector('h2'),desc=overlay.querySelector('p'),btn=byId('pwBtn'),input=byId('pwInput'),err=byId('pwError');
    if(stage==='hsk4'){
      if(title)title.textContent='Nhập mật khẩu riêng cho HSK 4';
      if(desc)desc.textContent='HSK 4 上 / HSK 4 下 · Mở khóa thêm một lần trong phiên hiện tại';
      if(btn)btn.textContent='Vào HSK 4';
      if(input)input.placeholder='Mật khẩu HSK 4';
    }else{
      if(title)title.textContent='Nhập mật khẩu để vào website';
      if(desc)desc.textContent='然老师课堂 · HSK 1 / HSK 2 / HSK 3 / HSK 4';
      if(btn)btn.textContent='Vào website';
      if(input)input.placeholder='Mật khẩu website';
    }
    err?.classList.remove('show');
  }
  function setOverlay(open,stage=currentStage()){
    const overlay=byId('pwOverlay');if(!overlay)return;
    if(open)updateGateCopy(stage||'portal');
    overlay.style.display=open?'':'none';
    document.body.style.overflow=open?'hidden':'';
    if(open){const input=byId('pwInput');if(input){input.disabled=false;setTimeout(()=>input.focus(),0)}}
  }
  function syncGate(){
    normalizeCompat();
    const stage=currentStage();
    setOverlay(!!stage,stage);
    updateNotes();
    window.__HSK_SESSION_AUTH={ok:!stage,stage,version:'20260815-2',sessionOnly:true,portalUnlocked:portalUnlocked(),hsk4Unlocked:hsk4Unlocked()};
    return !stage;
  }
  async function verify(raw,stage){
    let hash=null;try{hash=await digest(raw)}catch(_e){}
    if(!hash)return false;
    return hash===(stage==='hsk4'?HSK4_HASH:PORTAL_HASH);
  }
  async function unlock(){
    const input=byId('pwInput'),btn=byId('pwBtn'),err=byId('pwError');
    if(!input)return false;
    const stage=currentStage();
    if(!stage){syncGate();return true}
    if(btn)btn.disabled=true;
    const raw=input.value.trim();
    const ok=await verify(raw,stage);
    if(btn)btn.disabled=false;
    if(ok){
      if(stage==='portal')setSession(PORTAL_KEY,true);else setSession(HSK4_KEY,true);
      input.value='';err?.classList.remove('show');
      syncGate();
      return true;
    }
    err?.classList.add('show');input.select();
    window.__HSK_SESSION_AUTH={ok:false,stage,version:'20260815-2',sessionOnly:true,portalUnlocked:portalUnlocked(),hsk4Unlocked:hsk4Unlocked()};
    return false;
  }
  function updateNotes(){
    const note=document.querySelector('.portal-note');
    if(note)note.innerHTML='🔐 <b>Mật khẩu website chỉ cần nhập một lần trong phiên hiện tại.</b> HSK 1 / 2 / 3 không cần nhập lại. Khi vào HSK 4 上 hoặc HSK 4 下, cần mở khóa thêm lớp mật khẩu HSK 4 một lần; sau đó có thể chuyển tự do giữa HSK 4 上 và HSK 4 下 trong cùng phiên.';
    const banner=document.querySelector('.hsk4-upper .free-banner');
    if(banner&&/Mật khẩu/i.test(banner.textContent||''))banner.innerHTML='<b>✓ HSK 4 上 / 下 dùng chung một lớp mở khóa riêng.</b> Sau khi nhập mật khẩu HSK 4 một lần trong phiên hiện tại, có thể chuyển tự do giữa hai quyển; tiến độ HSK 4 上 vẫn được lưu riêng.';
  }
  function installLegacyWriteGuard(){
    if(!isHsk4Page()||document.__hsk4AuthWriteGuard)return;
    const original=document.write.bind(document);
    document.__hsk4AuthWriteGuard=true;
    document.write=function(...args){
      const html=args.join('');
      if(/assets\/session-auth\.js/i.test(html))return;
      return original(...args);
    };
  }

  window.checkPassword=unlock;
  window.initGate=syncGate;

  document.addEventListener('click',ev=>{
    const btn=ev.target?.closest?.('#pwBtn');if(!btn)return;
    ev.preventDefault();ev.stopImmediatePropagation();unlock();
  },true);
  document.addEventListener('keydown',ev=>{
    if(ev.key!=='Enter'||ev.target!==byId('pwInput'))return;
    ev.preventDefault();ev.stopImmediatePropagation();unlock();
  },true);

  installLegacyWriteGuard();
  syncGate();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installLegacyWriteGuard();syncGate()},{once:true});
  window.__HSK_SESSION_AUTH_API={version:'20260815-2',unlock,syncGate,portalUnlocked,hsk4Unlocked,currentStage,portalKey:PORTAL_KEY,hsk4Key:HSK4_KEY};
})();
/* deployment sync: two-stage HSK4 authentication */

/* Shared UX/a11y shell for portal + HSK4 pages. */
(()=>{
  if(!document?.head||typeof document.createElement!=='function')return;
  if(window.__HSK_SITE_SHELL_LOADED||document.querySelector?.('script[data-hsk-site-shell]'))return;
  const scripts=document.scripts?[...document.scripts]:[];
  const current=scripts.find(s=>/assets\/session-auth\.js(?:\?|$)/.test(s.src||''));
  const s=document.createElement('script');s.dataset.hskSiteShell='1';
  try{s.src=new URL('site-shell.js?v=2026-08-16-1',current?.src||location.href).href}catch(_e){s.src='assets/site-shell.js?v=2026-08-16-1'}
  s.defer=true;document.head.appendChild(s);
})();
