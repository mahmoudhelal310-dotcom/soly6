/* إذاعات القرآن الكريم: بث مباشر من قائمة mp3quran.net الرسمية (واجهة مجانية للمطورين)،
 * ومنها إذاعة القرآن الكريم من السعودية. التشغيل عبر مشغّل المكتبة الصوتية (يعمل في الخلفية مع مؤقت النوم). */
(window.NoorModules = window.NoorModules || []).push((N) => {
  'use strict';
  const { $, $$, store, toast, go, ar, esc, routes } = N;
  const API = 'https://www.mp3quran.net/api/v3/radios?language=ar';
  const MAIN_ID = 109082; // إذاعة القرآن الكريم - السعودية
  // إذاعة القرآن الكريم من القاهرة: بث صوتي مباشر على radiojar (محطة quran-radio-cairo)؛
  // موقع ماسبيرو الرسمي يعرضها بمشغّل فيديو فقط، فنضع رابطه للمشاهدة الرسمية أيضاً
  const EGYPT = { id: 900001, name: 'إذاعة القرآن الكريم من القاهرة', url: 'https://stream.radiojar.com/8s5u5tpdtwzuv' };
  const MASPERO = 'https://www.maspero.eg/stream/7';
  // نسخة احتياطية عند تعذّر تحميل القائمة (من نفس الواجهة الرسمية)
  const FALLBACK = [
    { id: 109082, name: 'إذاعة القرآن الكريم - السعودية', url: 'https://stream.radiojar.com/0tpy1h0kxtzuv' },
    { id: 108, name: 'العامة - متنوعة لمختلف القراء', url: 'https://backup.qurango.net/radio/mix' },
    { id: 109, name: 'تلاوات خاشعة', url: 'https://backup.qurango.net/radio/salma' },
    { id: 79, name: 'مشاري العفاسي', url: 'https://backup.qurango.net/radio/mishary_alafasi' },
    { id: 74, name: 'محمود خليل الحصري', url: 'https://backup.qurango.net/radio/mahmoud_khalil_alhussary' },
    { id: 69, name: 'محمد صديق المنشاوي', url: 'https://backup.qurango.net/radio/mohammed_siddiq_alminshawi' },
    { id: 32, name: 'عبدالباسط عبدالصمد', url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad' },
    { id: 63, name: 'ماهر المعيقلي', url: 'https://backup.qurango.net/radio/maher' },
  ];
  const FEATURED = [108, 109, 123, 10902, 115, 114, 10906, 10907];
  const GROUPS = [
    { k: 'reciters', t: '🎙️ إذاعات القراء' },
    { k: 'general', t: '📻 إذاعات متنوعة' },
    { k: 'ilm', t: '📚 التفسير والسيرة والحديث' },
    { k: 'tr', t: '🌍 ترجمات معاني القرآن' },
  ];
  const variant = (url) => (/_mojawwad$/.test(url) ? ' (مجوّد)' : /_warsh$/.test(url) ? ' (ورش)' : /_qalon$/.test(url) ? ' (قالون)' : '');
  const clean = (r) => ({ id: r.id, url: String(r.url || '').replace(/^http:/, 'https:'), name: String(r.name || '').replace(/^[-*\s]+|[-*\s]+$/g, '').replace(/\s+/g, ' ').trim() + variant(r.url || '') });
  function groupOf(r) {
    if (/translation/i.test(r.url)) return 'tr';
    if (/tafseer|tafsir|tabri|gareeb|siyra|sahabah|saheh|riyad|alanbiya|shmaeel|fatwa|alaikhtiarat|ramadan/i.test(r.url)) return 'ilm';
    if (/\/(mix|salma|tarateel|sakeenah|albaqarah|Surah_Al-Mulk|roqiah|athkar_sabah|athkar_masa|eid)$/.test(r.url) || r.id === MAIN_ID || r.id === EGYPT.id) return 'general';
    return 'reciters';
  }
  const norm = (t) => t.replace(/[ً-ْ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

  let LIST = null;
  async function load() {
    if (LIST) return LIST;
    const c = store.get('radio:list');
    if (c && Date.now() - c.t < 3 * 864e5) return (LIST = c.data);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(res.status);
      const data = (await res.json()).radios.map(clean).filter((r) => /^https:\/\//.test(r.url));
      store.set('radio:list', { t: Date.now(), data });
      return (LIST = data);
    } catch (e) {
      return c ? (LIST = c.data) : FALLBACK.map(clean);
    }
  }

  const favs = () => store.get('radio:fav', []);
  // بث radiojar يعيد التوجيه إلى http فيحجبه أندرويد؛ خدمة صغيرة على Supabase تعيد الرابط النهائي بصيغة https
  // بث radiojar يعيد التوجيه إلى http فيحجبه أندرويد ومتصفح فيسبوك؛ نجرّب الرابط الأصلي وعناوين خوادم radiojar الآمنة (https) معاً
  // ونعتمد أسرع رابط يعمل فعلاً، ثم نحفظه على الجهاز فلا تتكرر التجربة.
  function probeAudio(url, ms, bag) {
    return new Promise((res) => {
      const a = new Audio(); bag.push(a); let done = false;
      const fin = (ok) => { if (done) return; done = true; clearTimeout(t); stopAudio(a); res(ok); };
      const t = setTimeout(() => fin(false), ms);
      a.preload = 'auto'; a.onerror = () => fin(false); a.oncanplay = () => fin(true); a.onloadeddata = () => fin(true);
      a.src = url; try { a.load(); } catch { fin(false); }
    });
  }
  function stopAudio(a) { try { a.onerror = a.oncanplay = a.onloadeddata = null; a.pause(); a.removeAttribute('src'); a.load(); } catch { /* */ } }
  // رابط خدمة التحويل الخاصة بك (انظر ملف radio-worker.js): ضع هنا عنوان الخدمة منتهياً بـ ?id=
  const RESOLVER = 'https://quran-radio.mahmoudhelal310.workers.dev/?id=';
  async function resolveJar(url, force) {
    const m = /^https:\/\/stream\.radiojar\.com\/([a-z0-9]+)/i.exec(url);
    if (!m) return url;
    const id = m[1];
    if (RESOLVER) {
      try { const j = await (await fetch(RESOLVER + id, { cache: 'no-store' })).json(); if (j && j.url) return j.url; } catch { /* */ }
      return url;
    }
    // بدون خدمة تحويل: المحاولة الأولى مباشرة دون انتظار، وعند الفشل (force) نجرّب عناوين الخوادم الآمنة
    const ck = 'radio:node:' + id, c = store.get(ck);
    if (!force) return (c && c.u && Date.now() - c.t < 3 * 864e5) ? c.u : url;
    const cands = [url].concat(Array.from({ length: 12 }, (_, i) => `https://n${String(i + 1).padStart(2, '0')}.radiojar.com/${id}`));
    const bag = [];
    const win = await new Promise((res) => {
      let left = cands.length;
      cands.forEach((u) => probeAudio(u, 7000, bag).then((ok) => { if (ok) res(u); else if (--left === 0) res(null); }));
    });
    bag.forEach(stopAudio);
    if (win) { store.set(ck, { u: win, t: Date.now() }); return win; }
    return url;
  }
  async function play(r) {
    const lib = N.audioLib;
    if (!lib) { toast('المشغّل غير متاح'); return; }
    if (navigator.onLine === false) { toast('الإذاعة تحتاج اتصالاً بالإنترنت'); return; }
    // خادم backup.qurango.net متوقف حالياً؛ الخادم الأساسي qurango.net يعمل بنفس المسارات
    const jar = /stream\.radiojar\.com/.test(r.url);
    const url = jar ? await resolveJar(r.url) : r.url.replace('//backup.qurango.net/', '//qurango.net/');
    lib.playQueue([{ url, alt: url !== r.url && !jar ? r.url : null, resolve: jar ? () => resolveJar(r.url, true) : null, title: r.name, sub: '📻 بث مباشر', live: true, radio: r.id }], 0);
    store.set('radio:last', r);
    toast(`جارٍ تشغيل: ${r.name}`);
    setTimeout(paint, 300);
  }
  const playingId = () => { const c = N.audioLib && N.audioLib.cur(); return c && c.radio && !N.audioLib.audio.paused ? c.radio : null; };

  function row(r) {
    const on = playingId() === r.id;
    return `<div class="rx-tile ${on ? 'on' : ''}"><b>${esc(r.name)}</b>
      <div class="rx-row"><button class="rx-p" data-p="${r.id}" aria-label="تشغيل">${on ? '⏸' : '▶'}</button>
      <button class="rx-f" data-f="${r.id}" aria-label="المفضلة">${favs().includes(r.id) ? '★' : '☆'}</button></div></div>`;
  }
  function bind(root, list) {
    const byId = Object.fromEntries(list.map((r) => [r.id, r]));
    $$('[data-p]', root).forEach((b) => { b.onclick = () => { const id = +b.dataset.p; if (playingId() === id) { N.audioLib.audio.pause(); setTimeout(paint, 100); } else play(byId[id]); }; });
    $$('[data-f]', root).forEach((b) => { b.onclick = () => { const F = favs(); const id = +b.dataset.f; const i = F.indexOf(id); if (i < 0) F.unshift(id); else F.splice(i, 1); store.set('radio:fav', F); toast(i < 0 ? 'أضيفت إلى المفضلة' : 'أُزيلت من المفضلة'); relist(); }; });
  }
  let paint = () => {};
  let relist = () => {};

  async function renderRadio() {
    N.view.innerHTML = '<div class="card center muted">جارٍ تحميل الإذاعات…</div>';
    const list = await load();
    if (!location.hash.startsWith('#/radio')) return;
    if (!list.some((r) => r.id === EGYPT.id)) list.unshift(EGYPT);
    const byId = Object.fromEntries(list.map((r) => [r.id, r]));
    const main = byId[MAIN_ID] || clean(FALLBACK[0]);
    const feats = [[EGYPT, '🇪🇬', 'مصر'], [main, '🇸🇦', 'السعودية']];
    let q = '';
    let group = store.get('radio:group', 'reciters');
    const toggle = (r) => { if (playingId() === r.id) { N.audioLib.audio.pause(); setTimeout(paint, 100); } else play(r); };
    paint = () => {
      if (!location.hash.startsWith('#/radio')) return;
      const on = playingId(); const cur = on ? byId[on] : null;
      N.view.innerHTML = `
        <div class="rx-now ${on ? 'on' : ''}">
          <div class="rx-eq"><i></i><i></i><i></i><i></i></div>
          <div class="rx-mid"><span class="rx-live">مباشر</span><div class="rx-nm">${cur ? esc(cur.name) : 'اختر إذاعة للاستماع'}</div></div>
          <button class="rx-big" id="rxBig" aria-label="تشغيل أو إيقاف">${on ? '⏸' : '▶'}</button>
        </div>
        <div class="rx-feat">${feats.map(([r, fl, c]) => `<div class="rx-fcard ${playingId() === r.id ? 'on' : ''}" data-hero="${r.id}"><div class="rx-fl">${fl}</div><b>إذاعة القرآن الكريم</b><small>من ${c}</small></div>`).join('')}</div>
        <input id="rdQ" class="rd-search" type="search" placeholder="ابحث باسم القارئ أو الإذاعة…" value="${esc(q)}">
        <div id="rdBody"></div>
        <p class="center muted" style="font-size:.8rem">${ar(list.length)} إذاعة • المصدر: mp3quran.net • تحتاج اتصالاً بالإنترنت</p>`;
      $('#rxBig').onclick = () => { if (playingId()) { N.audioLib.audio.pause(); setTimeout(paint, 100); } else play(store.get('radio:last', null) || EGYPT); };
      $$('[data-hero]').forEach((b) => { b.onclick = () => toggle(byId[+b.dataset.hero]); });
      const inp = $('#rdQ');
      inp.oninput = () => { q = inp.value; paintList(); };
      paintList();
    };
    const paintList = () => {
      const box = $('#rdBody'); if (!box) return;
      const F = favs().map((id) => byId[id]).filter(Boolean);
      const nq = norm(q.trim());
      const collate = (x, y) => x.name.localeCompare(y.name, 'ar');
      const shown = (nq ? list.filter((r) => norm(r.name).includes(nq)) : list.filter((r) => groupOf(r) === group)).slice().sort(collate);
      box.innerHTML = `${F.length && !nq ? `<h3 class="rd-h">⭐ المفضلة</h3><div class="rx-grid">${F.map(row).join('')}</div>` : ''}
        ${nq ? '' : `<div class="rx-pills">${GROUPS.map((g) => `<button data-g="${g.k}" class="rx-pill ${g.k === group ? 'active' : ''}">${g.t}</button>`).join('')}</div>`}
        <div class="rx-grid">${shown.map(row).join('') || '<div class="card center muted">لا توجد نتائج</div>'}</div>`;
      bind(box, list);
      $$('[data-g]', box).forEach((b) => { b.onclick = () => { group = b.dataset.g; store.set('radio:group', group); paintList(); }; });
    };
    relist = () => paintList();
    paint();
    const a = N.audioLib && N.audioLib.audio;
    const re = () => paint();
    if (a) { a.addEventListener('play', re); a.addEventListener('pause', re); }
    return () => { paint = () => {}; if (a) { a.removeEventListener('play', re); a.removeEventListener('pause', re); } };
  }

  routes.radio = { title: 'إذاعات الراديو', render: renderRadio, back: 'home' };
});
