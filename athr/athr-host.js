(() => {
'use strict';
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const view=$('#athrView'), root=$('#athrRoot');
const ar=n=>Number(n).toLocaleString('ar-EG',{useGrouping:false}), arG=n=>Number(n).toLocaleString('ar-EG');
const toAr=s=>String(s).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('noor:'+k);return v==null?d:JSON.parse(v);}catch{return d;}},set(k,v){try{localStorage.setItem('noor:'+k,JSON.stringify(v));}catch{}}};
const settings=Object.assign({location:{name:'القاهرة',lat:30.0444,lng:31.2357},hijriAdj:0,adj:{}},store.get('settings',{}));
const saveSettings=()=>store.set('settings',settings);
const tz=()=>undefined;
function toast(m){const t=$('#athrToast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2400);}
const go=r=>{location.hash='#/'+r;};
function ymdIn(date,timeZone){const p=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const g=t=>+p.find(x=>x.type===t).value;return [g('year'),g('month'),g('day')];}
const todayKey=()=>ymdIn(new Date(),tz()).join('-');
const fmtTime=d=>d.toLocaleTimeString('ar-EG',{hour:'numeric',minute:'2-digit'});
const hijri=d=>{try{return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab',{day:'numeric',month:'long',year:'numeric'}).format(new Date(d.getTime()+(settings.hijriAdj||0)*864e5));}catch{return '';}};
const greg=d=>d.toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const PRAYERS=[{key:'fajr',name:'الفجر',ic:'🌅'},{key:'sunrise',name:'الشروق',ic:'☀️',sun:true},{key:'dhuhr',name:'الظهر',ic:'🌞'},{key:'asr',name:'العصر',ic:'🌤️'},{key:'maghrib',name:'المغرب',ic:'🌇'},{key:'isha',name:'العشاء',ic:'🌙'}];
function timesFor(date){const T=typeof cachedPrayerTimings!=='undefined'?cachedPrayerTimings:null;if(!T)throw new Error('no times');
 const mk=s=>{const[h,m]=String(s).slice(0,5).split(':').map(Number);const d=new Date(date);d.setHours(h,m,0,0);return d;};
 return{fajr:mk(T.Fajr),sunrise:mk(T.Sunrise),dhuhr:mk(T.Dhuhr),asr:mk(T.Asr),maghrib:mk(T.Maghrib),isha:mk(T.Isha)};}
const API='https://api.alquran.cloud/v1';
async function fetchJSON(url,key){const c=key&&store.get(key);if(c)return c;const r=await fetch(url);if(!r.ok)throw new Error(r.status);const j=await r.json();if(key)store.set(key,j.data);return j.data;}
const normAr=t=>t.replace(/[ً-ٰٟۖ-ۭ]/g,'').replace(/[ٱأإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
async function shareText(text){const t=text+'\n\nمن تطبيق رفيق المسلم';try{if(navigator.share){await navigator.share({text:t});return;}}catch(e){if(e&&e.name==='AbortError')return;}try{await navigator.clipboard.writeText(t);toast('تم نسخ النص');}catch{toast('تعذّر النسخ');}}
function sheet(html){const bd=document.createElement('div');bd.className='sheet-backdrop';bd.innerHTML=`<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div>${html}</div>`;root.appendChild(bd);requestAnimationFrame(()=>bd.classList.add('open'));const close=()=>{bd.classList.remove('open');setTimeout(()=>bd.remove(),250);};bd.addEventListener('click',e=>{if(e.target===bd)close();});return{el:$('.sheet',bd),close};}

async function storyCard({ kind, text, ref }) {
  const modal = document.getElementById('storyPreviewModal'), img = document.getElementById('storyPreviewImg'), ld = document.getElementById('storyLoading');
  modal.style.display = 'flex'; img.style.display = 'none'; if (ld) ld.style.display = 'block';
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  try {
    if (typeof ensureStoryFonts === 'function') await ensureStoryFonts();
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 1080, 1920); g.addColorStop(0, '#06170f'); g.addColorStop(0.3, '#0b261a'); g.addColorStop(0.7, '#143827'); g.addColorStop(1, '#05140d');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
    x.strokeStyle = '#d4af37'; x.lineWidth = 4; x.strokeRect(55, 55, 970, 1810); x.strokeStyle = 'rgba(212,175,55,.35)'; x.lineWidth = 1.5; x.strokeRect(70, 70, 940, 1780);
    x.textAlign = 'center'; x.fillStyle = '#d4af37'; x.font = 'bold 44px Cairo, sans-serif'; x.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 540, 150);
    x.fillStyle = '#fff'; x.font = 'bold 40px Cairo, sans-serif'; x.fillText(kind || 'حديث شريف', 540, 230);
    x.strokeStyle = '#d4af37'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(380, 270); x.lineTo(700, 270); x.stroke();
    let fs = 46, lines = [], lh = 0;
    for (; fs >= 24; fs -= 2) { x.font = `bold ${fs}px Amiri, serif`; lh = Math.round(fs * 1.7); lines = wrapCanvasText(x, text, 840); if (lines.length * lh <= 1020) break; }
    const bh = Math.max(300, lines.length * lh + 120), top = 330;
    drawRoundedBox(x, 90, top, 900, bh, 20, 'rgba(255,255,255,.05)', 'rgba(212,175,55,.3)');
    x.fillStyle = '#ffd700'; x.font = `bold ${fs}px Amiri, serif`;
    const y0 = top + (bh - lines.length * lh) / 2 + lh * 0.72; lines.forEach((l, i) => x.fillText(l, 540, y0 + i * lh));
    if (ref) { x.fillStyle = '#80ed99'; x.font = 'bold 32px Cairo, sans-serif'; x.fillText('📚 ' + ref, 540, top + bh + 70); }
    x.fillStyle = '#80ed99'; x.font = 'bold 30px Cairo, sans-serif'; x.fillText('🌿 صدقة جارية — لا تنسونا من صالح دعائكم', 540, 1660);
    x.fillStyle = '#d4af37'; x.font = 'bold 32px Cairo, sans-serif'; x.fillText('رفيق المسلم', 540, 1730);
    x.fillStyle = '#fff'; x.font = 'bold 36px Cairo, sans-serif'; x.fillText('by Mahmoud Helal', 540, 1785);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
    generatedStoryBlob = blob; img.src = URL.createObjectURL(blob); img.style.display = 'block';
  } catch (e) { toast('تعذّر تجهيز الصورة'); modal.style.display = 'none'; }
  if (ld) ld.style.display = 'none';
}
const routes={};
window.Noor={$,$$,view,store,toast,go,ar,arG,toAr,esc,routes,settings,saveSettings,fetchJSON,API,sheet,shareText,storyCard,todayKey,ymdIn,tz,hijri,greg,NATIVE:false,applyTheme(){},PRAYERS,timesFor,fmtTime,normAr,setTitle:t=>{$('#athrTitle').textContent=t;},homeExtras:[]};
(window.NoorModules||[]).forEach(m=>{try{m(window.Noor);}catch(e){console.error('module',e);}});
let cleanup=null,seq=0;
const runCleanup=()=>{if(typeof cleanup==='function'){try{cleanup();}catch(e){console.error(e);}}cleanup=null;};
function show(){
 const h=location.hash; if(!h.startsWith('#/'))return false;
 const [name,a,b,c]=h.slice(2).split('/'); const route=routes[name]; if(!route)return false;
 runCleanup(); $$('.sheet-backdrop').forEach(e=>e.remove());
 openSection('athrSection');
 $('#athrTitle').textContent=route.title; const bk=$('#athrBack'); bk.style.display=route.back?'inline-flex':'none';
 bk.onclick=()=>history.length>1?history.back():go(route.back);
 view.innerHTML=''; view.className='fade-in';
 const out=route.render(a,b,c);
 if(out&&typeof out.then==='function'){const mine=++seq;out.then(fn=>{if(typeof fn!=='function')return;if(mine===seq)cleanup=fn;else fn();}).catch(()=>{});}else{cleanup=out||null;seq++;}
 window.scrollTo(0,0); return true;
}
window.openAthr=r=>{location.hash='#/'+r;};
window.athrLeave=()=>{runCleanup();if(routes[location.hash.slice(2).split('/')[0]])history.replaceState(null,'',location.pathname+location.search);};
window.athrHome=()=>{window.athrLeave();goHome();};
window.addEventListener('hashchange',()=>{if(!show()){runCleanup();if(location.hash===''||location.hash==='#'||location.hash==='#/')goHome();}});
window.addEventListener('DOMContentLoaded',()=>{show();});
})();
