// Cloudflare Worker: يحوّل رابط بث radiojar إلى رابط https نهائي (يقرأ التحويل من الخادم لأن المتصفح لا يستطيع قراءته)
export default {
  async fetch(req) {
    const h = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
    const id = (new URL(req.url).searchParams.get('id') || '').replace(/[^a-z0-9]/gi, '');
    if (!id) return new Response('{"error":"id"}', { status: 400, headers: h });
    const src = 'https://stream.radiojar.com/' + id;
    try {
      const r = await fetch(src, { redirect: 'manual' });
      const loc = r.headers.get('Location');
      if (r.body) r.body.cancel();
      const url = loc ? new URL(loc, src).href.replace(/^http:/, 'https:') : src;
      return new Response(JSON.stringify({ url }), { headers: h });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'fail' }), { status: 502, headers: h });
    }
  }
};
