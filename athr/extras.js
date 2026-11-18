/* القبلة (بوصلة + اتجاه بالدرجات) والأسماء الحسنى */
(window.NoorModules = window.NoorModules || []).push((N) => {
  'use strict';
  const { $, store, toast, ar, esc, routes } = N;
  const KAABA = { lat: 21.422487, lng: 39.826206 };
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const bearing = (la, lo) => { const p1 = rad(la), p2 = rad(KAABA.lat), dl = rad(KAABA.lng - lo); return (deg(Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl))) + 360) % 360; };
  const dist = (la, lo) => { const a = Math.sin(rad(KAABA.lat - la) / 2) ** 2 + Math.cos(rad(la)) * Math.cos(rad(KAABA.lat)) * Math.sin(rad(KAABA.lng - lo) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(a)); };
  function savedLoc() {
    const s = store.get('qibla:loc'); if (s) return s;
    try { const ci = parseInt(localStorage.getItem('selected_country_idx') || '0'), ti = parseInt(localStorage.getItem('selected_city_idx') || '0'); const c = locations[ci].cities[ti]; return { lat: c.lat, lng: c.lng, name: c.ar }; } catch { return { lat: 30.0444, lng: 31.2357, name: 'القاهرة' }; }
  }
  function renderQibla() {
    let loc = savedLoc(), heading = null, aligned = false;
    N.view.innerHTML = `<div class="qb-card">
      <div class="qb-ring"><span class="qb-n" id="qbN">ش</span><div class="qb-needle" id="qbNeedle"><i>🕋</i></div><div class="qb-dot"></div></div>
      <div class="qb-info"><b id="qbDeg"></b><small id="qbMeta"></small><div id="qbState" class="qb-state"></div></div>
      <div class="qb-btns"><button class="btn" id="qbGps">📍 تحديد موقعي</button><button class="btn ghost" id="qbCompass">🧭 تفعيل البوصلة</button></div>
      <p class="muted" style="font-size:.78rem">ضع الهاتف أفقياً بعيداً عن المعادن والمغناطيس. إن لم تتوفر البوصلة فاتجه بالزاوية الموضحة من الشمال.</p></div>`;
    const paint = () => {
      const b = bearing(loc.lat, loc.lng);
      $('#qbDeg').textContent = `اتجاه القبلة: ${ar(Math.round(b))}° من الشمال`;
      $('#qbMeta').textContent = `${loc.name || 'موقعك'} — تبعد عن الكعبة حوالي ${ar(Math.round(dist(loc.lat, loc.lng)))} كم`;
      const h = heading == null ? 0 : heading;
      $('#qbNeedle').style.transform = `rotate(${b - h}deg)`; $('#qbN').style.transform = `rotate(${-h}deg)`;
      const diff = Math.abs(((b - h + 540) % 360) - 180);
      const ok = heading != null && diff < 6;
      $('#qbState').textContent = heading == null ? 'فعّل البوصلة لتتبع الاتجاه مباشرة' : ok ? '✅ أنت متجه نحو القبلة' : 'أدر الهاتف حتى يشير السهم لأعلى';
      if (ok && !aligned && navigator.vibrate) navigator.vibrate(60); aligned = ok;
    };
    const onOri = (e) => {
      let h = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading; else if (e.alpha != null) h = 360 - e.alpha;
      if (h != null) { heading = (h + 360) % 360; paint(); }
    };
    $('#qbGps').onclick = () => {
      if (!navigator.geolocation) { toast('المتصفح لا يدعم تحديد الموقع'); return; }
      navigator.geolocation.getCurrentPosition((p) => { loc = { lat: p.coords.latitude, lng: p.coords.longitude, name: 'موقعك الحالي' }; store.set('qibla:loc', loc); paint(); toast('تم تحديد موقعك'); }, () => toast('تعذّر تحديد الموقع — تأكد من السماح بالوصول'), { enableHighAccuracy: true, timeout: 12000 });
    };
    $('#qbCompass').onclick = async () => {
      try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { toast('لم يُسمح باستخدام البوصلة'); return; } } } catch { /* */ }
      window.addEventListener('deviceorientationabsolute', onOri, true); window.addEventListener('deviceorientation', onOri, true);
      toast('تم تفعيل البوصلة');
    };
    paint();
    return () => { window.removeEventListener('deviceorientationabsolute', onOri, true); window.removeEventListener('deviceorientation', onOri, true); };
  }
  function renderNames() {
    N.view.innerHTML = `<div class="card center"><p class="hadith-text" style="font-size:1.1rem">«إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا، مِائَةً إِلَّا وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»</p><div class="ref">متفق عليه</div></div>
      <div class="nm-grid">${ASMA_ALHUSNA.map((n, i) => `<div class="nm-card"><small>${ar(i + 1)}</small><b>${esc(n)}</b></div>`).join('')}</div>`;
  }
  Object.assign(routes, { qibla: { title: 'اتجاه القبلة', render: renderQibla, back: 'home' }, names: { title: 'الأسماء الحسنى', render: renderNames, back: 'home' } });
});
