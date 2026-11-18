/* تذكير صوتي دوري بالأذكار والصلاة على النبي ﷺ: نص مرئي دائماً + صوت تلقائي (نطق الجهاز) إن توفر */
(window.NoorModules = window.NoorModules || []).push((N) => {
  'use strict';
  const { $, $$, store, toast, routes, ar } = N;
  const PHRASES = [
    'اللهم صلِّ وسلم وبارك على نبينا محمد',
    'سبحان الله وبحمده سبحان الله العظيم',
    'أستغفر الله العظيم وأتوب إليه',
    'لا إله إلا الله وحده لا شريك له والحمد لله رب العالمين',
    'لا حول ولا قوة إلا بالله العلي العظيم',
  ];
  const INTERVALS = [5, 10, 15, 20, 30, 45, 60, 90, 120];
  const cfg = () => Object.assign({ on: true, every: 20 }, store.get('rem:cfg', {}));
  const save = (c) => store.set('rem:cfg', c);
  let timer = null, idx = -1;

  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA'; u.rate = 0.95;
      const v = speechSynthesis.getVoices().find((v) => /^ar/i.test(v.lang));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch { /* الجهاز لا يدعم النطق — الرسالة المرئية تكفي */ }
  }
  function fire() { idx = (idx + 1) % PHRASES.length; const text = PHRASES[idx]; toast('🤲 ' + text); speak(text); }
  function schedule() {
    if (timer) { clearInterval(timer); timer = null; }
    const c = cfg(); if (!c.on) return;
    timer = setInterval(fire, Math.max(1, c.every) * 60000);
  }
  schedule();

  function render() {
    const c = cfg();
    N.setTitle('تذكير الأذكار والصلاة على النبي');
    N.view.innerHTML = `
      <label class="adh-line"><span>تفعيل التذكير</span><input type="checkbox" id="remOn" ${c.on ? 'checked' : ''}></label>
      <div class="adh-h">كل كام دقيقة</div>
      <select id="remEvery" class="rd-search">${INTERVALS.map((m) => `<option value="${m}" ${c.every === m ? 'selected' : ''}>${ar(m)} دقيقة</option>`).join('')}</select>
      <button class="btn block" id="remTest" style="margin-top:14px">🔊 تجربة الآن</button>
      <p class="muted" style="font-size:.78rem;margin-top:10px">تظهر رسالة دائماً، وينطقها صوت الجهاز إن كان متوفراً. يعمل فقط والتطبيق مفتوح أمامك.</p>`;
    $('#remOn').onchange = (e) => { const x = cfg(); x.on = e.target.checked; save(x); schedule(); };
    $('#remEvery').onchange = (e) => { const x = cfg(); x.every = +e.target.value; save(x); schedule(); };
    $('#remTest').onclick = fire;
  }
  routes.reminders = { title: 'تذكير الأذكار', render, back: 'home' };
});
