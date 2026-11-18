/* التواشيح والابتهالات: نفس شكل الموقع الأول (أخضر وذهبي) + فهرس خاص + فحص تلقائي للروابط وتخطي ما لا يعمل */
(window.NoorModules = window.NoorModules || []).push((N) => {
  'use strict';
  const { $, $$, store, toast, esc, routes } = N;
  const DATA = (window.IBTIHAL_DATA || []).map((x) => ({ t: x.t, r: x.r, v: x.v }));
  const badSet = () => new Set(store.get('tw:bad', []));
  const WEEK = 7 * 864e5;

  function renderHome() {
    let active = '', reciter = 'all', q = '', showHidden = false, checking = false;
    const recs = [...new Set(DATA.map((x) => x.r))];
    N.view.innerHTML = `<div style="background:var(--card-bg); padding:18px; border-radius:16px; border:1px solid var(--border);">
      <h2 style="color:var(--primary); margin-bottom:4px; text-align:center;">🎙️ التواشيح والابتهالات الدينية</h2>
      <p style="font-size:0.86rem; color:var(--text-muted); text-align:center; margin-bottom:14px;">باقة من روائع كبار المبتهلين — يبدأ التالي تلقائياً</p>
      <div class="ibtihal-player-wrapper">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px;"><span id="twTitle" style="font-weight:700; font-size:0.88rem; color:var(--primary);">🎬 اختر ابتهالاً من القائمة لتشغيله</span></div>
        <div class="ibtihal-video-frame"><iframe id="twF" src="" title="مشغّل الابتهالات" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
        <select id="twSel" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text); font-weight:700;"><option value="all">🎙️ كل المبتهلين</option>${recs.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select>
        <input type="text" id="twQ" placeholder="ابحث باسم الابتهال..." style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--text);">
      </div>
      <div id="twInfo" style="font-size:.8rem; color:var(--text-muted); text-align:center; margin-bottom:10px;"></div>
      <div id="twList"></div></div>`;
    const frame = $('#twF');
    let checkFrame = null;
    const visible = () => { const bad = badSet(); return DATA.filter((x) => (reciter === 'all' || x.r === reciter) && (!q || x.t.includes(q) || x.r.includes(q)) && (showHidden || !bad.has(x.v))); };
    const info = () => {
      const n = badSet().size;
      $('#twInfo').innerHTML = checking ? '⏳ جاري فحص توفر الابتهالات في الخلفية…' : n ? `تم إخفاء ${n} ابتهال غير متاح على يوتيوب — <a href="#" id="twShowBad" style="color:var(--primary);font-weight:700">${showHidden ? 'إخفاء' : 'عرضها'}</a> · <a href="#" id="twRecheck" style="color:var(--primary);font-weight:700">إعادة الفحص</a>` : `<a href="#" id="twRecheck" style="color:var(--primary);font-weight:700">🔍 فحص توفر الابتهالات</a>`;
      const sb = $('#twShowBad'); if (sb) sb.onclick = (e) => { e.preventDefault(); showHidden = !showHidden; draw(); };
      const rc = $('#twRecheck'); if (rc) rc.onclick = (e) => { e.preventDefault(); store.set('tw:bad', []); startCheck(); };
    };
    const draw = () => {
      const list = visible(), bad = badSet(), box = $('#twList');
      box.innerHTML = list.length ? list.map((x) => { const on = x.v === active; return `<div class="ibtihal-card ${on ? 'active' : ''}" data-v="${x.v}" style="${bad.has(x.v) ? 'opacity:.5' : ''}">
        <div class="ibtihal-meta"><div class="ibtihal-title">${esc(x.t)}</div><div class="ibtihal-reciter">🎙️ ${esc(x.r)}${bad.has(x.v) ? ' — ⚠️ غير متاح' : ''}</div></div>
        <button class="btn btn-play" type="button">${on ? '⏸️ يعمل' : '▶️ تشغيل'}</button></div>`; }).join('') : '<div style="text-align:center; color:var(--text-muted); padding:20px;">لا توجد ابتهالات مطابقة للبحث.</div>';
      $$('.ibtihal-card', box).forEach((c) => { c.onclick = () => play(c.dataset.v); });
      info();
    };
    const play = (v) => {
      const x = DATA.find((d) => d.v === v); if (!x) return;
      active = v; $('#twTitle').textContent = `🎬 ${x.t} — ${x.r}`;
      window.dispatchEvent(new CustomEvent('noor:audio', { detail: 'tawasheeh' }));
      frame.src = `athr/yt.html?v=${v}`; draw();
    };
    const next = () => { const l = visible(); const i = l.findIndex((d) => d.v === active); if (i >= 0 && i < l.length - 1) play(l[i + 1].v); };
    function startCheck() {
      if (checking || !DATA.length) return;
      checking = true; info();
      checkFrame = document.createElement('iframe'); checkFrame.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none'; checkFrame.setAttribute('aria-hidden', 'true');
      checkFrame.src = `athr/yt.html?check=${DATA.map((x) => x.v).join(',')}`;
      document.body.appendChild(checkFrame);
    }
    const stopCheck = () => { checking = false; if (checkFrame) { checkFrame.remove(); checkFrame = null; } };
    const onMsg = (e) => {
      const m = e.data || {}; if (m.src !== 'athar-yt') return;
      if (checkFrame && e.source === checkFrame.contentWindow) {
        if (m.type === 'check' && !m.ok) { const s = badSet(); s.add(m.id); store.set('tw:bad', [...s]); }
        if (m.type === 'check-done') { stopCheck(); store.set('tw:checked', Date.now()); const n = badSet().size; toast(n ? `اكتمل الفحص: ${n} ابتهال غير متاح تم إخفاؤه` : 'اكتمل الفحص: كل الابتهالات متاحة'); draw(); }
        return;
      }
      if (e.source !== frame.contentWindow) return;
      if (m.type === 'state' && m.s === 0) next();
      if (m.type === 'error') {
        const s = badSet(); s.add(active); store.set('tw:bad', [...s]);
        toast('هذا الابتهال غير متاح — جاري تشغيل التالي'); const cur = active; draw();
        setTimeout(() => { if (active === cur) next(); }, 1200);
      }
    };
    window.addEventListener('message', onMsg);
    $('#twSel').onchange = (e) => { reciter = e.target.value; draw(); };
    $('#twQ').oninput = (e) => { q = e.target.value.trim(); draw(); };
    draw();
    if (!store.get('tw:checked') || Date.now() - store.get('tw:checked') > WEEK) setTimeout(startCheck, 600);
    return () => { window.removeEventListener('message', onMsg); stopCheck(); frame.src = ''; };
  }
  routes.ibtihal = { title: 'التواشيح والابتهالات', render: renderHome, back: 'home' };
});
