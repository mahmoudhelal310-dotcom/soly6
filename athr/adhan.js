/* الأذان: صفحة كاملة (رجوع/الرئيسية مثل باقي الأقسام) + اختيار المؤذن + فحص تلقائي لتوفر كل صوت + إضافة مؤذن برابط mp3 */
(window.NoorModules = window.NoorModules || []).push((N) => {
  'use strict';
  const { $, $$, store, toast, esc, routes, ar } = N;
  // أضف مؤذنين جدداً هنا: { k: 'معرّف', name: 'الاسم', url: 'رابط mp3 مباشر' }
  const ADHANS = [
    { k: 'makkah', name: 'الحرم المكي', url: 'https://islamic.network/audio/adhan/makkah.mp3' },
    { k: 'afasy', name: 'الشيخ مشاري العفاسي (قد لا يعمل دائماً)', url: 'https://archive.org/download/AdhanMisharyRashid/Adhan%20Mishary%20Rashid.mp3' },
  ];
  const PR = [['fajr', 'الفجر'], ['dhuhr', 'الظهر'], ['asr', 'العصر'], ['maghrib', 'المغرب'], ['isha', 'العشاء']];
  const cfg = () => Object.assign({ on: true, muezzin: 'makkah', off: {}, custom: [] }, store.get('adhan:cfg', {}));
  const save = (c) => store.set('adhan:cfg', c);
  const all = () => ADHANS.concat(cfg().custom);
  const status = () => store.get('adhan:status', {});
  let audio = null, stopBtn = null;

  function stop() { if (audio) { audio.pause(); audio = null; } if (stopBtn) { stopBtn.remove(); stopBtn = null; } }
  function playUrl(url, onOk, onFail) {
    stop();
    window.dispatchEvent(new CustomEvent('noor:audio', { detail: 'adhan' }));
    audio = new Audio(url); audio.preload = 'auto';
    audio.onended = stop;
    audio.onerror = () => { stop(); if (onFail) onFail(); };
    audio.play().then(() => {
      if (onOk) onOk();
      stopBtn = document.createElement('button');
      stopBtn.className = 'adhan-stop'; stopBtn.textContent = '⏹ إيقاف الأذان'; stopBtn.onclick = stop;
      document.getElementById('athrRoot').appendChild(stopBtn);
    }).catch(() => { stop(); if (onFail) onFail(); });
  }
  window.athrAdhan = (key) => {
    const c = cfg(); if (!c.on || c.off[key]) return;
    const m = all().find((x) => x.k === c.muezzin) || all()[0];
    if (m) playUrl(m.url, null, () => toast('تعذّر تشغيل الأذان — افتح صفحة الأذان وجرّب مؤذناً آخر'));
  };

  function probe(m) {
    const a = new Audio(); let done = false;
    const fin = (ok) => { if (done) return; done = true; const st = status(); st[m.k] = ok; store.set('adhan:status', st); renderIfOpen(); };
    const t = setTimeout(() => fin(false), 9000);
    a.preload = 'auto'; a.oncanplay = () => { clearTimeout(t); fin(true); }; a.onerror = () => { clearTimeout(t); fin(false); };
    a.src = m.url; try { a.load(); } catch { fin(false); }
  }
  function checkAll() { const st = {}; store.set('adhan:status', st); all().forEach(probe); renderIfOpen(); }
  let renderIfOpen = () => {};

  function render() {
    const c = cfg();
    N.setTitle('إعدادات الأذان');
    const st = status();
    const icon = (k) => (st[k] === true ? '✅' : st[k] === false ? '⚠️ غير متاح' : '⏳ جارٍ الفحص…');
    N.view.innerHTML = `
      <label class="adh-line"><span>تشغيل الأذان وقت الصلاة</span><input type="checkbox" id="adOn" ${c.on ? 'checked' : ''}></label>
      <div class="adh-h">اختر المؤذن</div>
      <div id="adList">${all().map((m) => `<div class="adh-m ${m.k === c.muezzin ? 'sel' : ''}" data-k="${esc(m.k)}">
        <button class="adh-pick">${m.k === c.muezzin ? '◉' : '○'}</button>
        <div style="flex:1"><b>${esc(m.name)}</b><br><small class="muted">${icon(m.k)}</small></div>
        <button class="adh-try" data-try="${esc(m.k)}">▶ تجربة</button></div>`).join('')}</div>
      <button class="btn ghost" id="adRecheck" style="width:100%;margin-bottom:14px">🔍 إعادة فحص كل الأصوات</button>
      <div class="adh-h">الصلوات</div>
      <div class="adh-prs">${PR.map(([k, n]) => `<label><input type="checkbox" data-pr="${k}" ${c.off[k] ? '' : 'checked'}> ${n}</label>`).join('')}</div>
      <div class="adh-h">إضافة مؤذن برابط mp3</div>
      <input id="adName" class="rd-search" placeholder="اسم المؤذن"><input id="adUrl" class="rd-search" placeholder="https://…/adhan.mp3" dir="ltr">
      <button class="btn block" id="adAdd">➕ إضافة</button>
      <p class="muted" style="font-size:.78rem;margin-top:10px">الأذان يعمل طالما الموقع أو التطبيق مفتوح أمامك. اضغط «تجربة» للتأكد من أي صوت بنفسك — علامة ⚠️ تعني أن الرابط لا يعمل حالياً فاختر غيره.</p>`;
    renderIfOpen = render;
    $('#adOn').onchange = (e) => { const x = cfg(); x.on = e.target.checked; save(x); };
    $('#adRecheck').onclick = checkAll;
    $$('[data-pr]').forEach((b) => { b.onchange = () => { const x = cfg(); x.off[b.dataset.pr] = !b.checked; save(x); }; });
    $$('.adh-m').forEach((r) => { r.querySelector('.adh-pick').onclick = () => { const x = cfg(); x.muezzin = r.dataset.k; save(x); render(); }; });
    $$('[data-try]').forEach((b) => { b.onclick = () => { const m = all().find((x) => x.k === b.dataset.try); playUrl(m.url, () => toast('✅ يعمل'), () => toast('⚠️ تعذّر تشغيل هذا الصوت')); }; });
    $('#adAdd').onclick = () => {
      const name = $('#adName').value.trim(), url = $('#adUrl').value.trim();
      if (!name || !/^https:\/\/.+/i.test(url)) { toast('اكتب الاسم ورابط https مباشراً'); return; }
      const x = cfg(); x.custom.push({ k: 'c' + Date.now(), name, url }); save(x); render(); probe(x.custom[x.custom.length - 1]);
    };
    if (!Object.keys(st).length) checkAll();
  }
  routes.adhan = { title: 'إعدادات الأذان', render, back: 'home' };
});
