#!/usr/bin/env python3
"""إضافة ابتهالات إلى فهرس الموقع (athr/ibtihal-data.js).
الاستعمال:
  python3 tools/add_ibtihal.py "الشيخ سيد النقشبندي" https://youtu.be/XXXXXXXXXXX
  python3 tools/add_ibtihal.py "الشيخ سيد النقشبندي" "https://www.youtube.com/playlist?list=PLxxxxxxxx"
رابط فيديو مفرد أو عدة روابط، أو رابط قائمة تشغيل كاملة (list=...) فيضيف كل فيديوهاتها دفعة واحدة.
يجلب العنوان تلقائياً من يوتيوب (بدون مفتاح API)."""
import sys, re, json, urllib.request, urllib.parse
P = "athr/ibtihal-data.js"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")

def oembed_title(vid):
    try:
        u = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote("https://www.youtube.com/watch?v=" + vid)
        return json.load(urllib.request.urlopen(u, timeout=15))["title"]
    except Exception:
        return None

def expand_playlist(list_id):
    """يستخرج (videoId, title) من صفحة قائمة التشغيل العامة دون مفتاح API."""
    html = fetch("https://www.youtube.com/playlist?list=" + list_id)
    pairs, seen = [], set()
    for m in re.finditer(r'"videoId":"([\w-]{11})"[^}]*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"', html):
        vid, title = m.group(1), m.group(2).encode().decode("unicode_escape")
        if vid not in seen:
            seen.add(vid); pairs.append((vid, title))
    return pairs

def main():
    if len(sys.argv) < 3:
        print(__doc__); return
    reciter, links = sys.argv[1], sys.argv[2:]
    src = open(P, encoding="utf-8").read()
    m = re.search(r"window\.IBTIHAL_DATA=(\[.*\]);", src, re.S)
    data = json.loads(m.group(1)); have = {x["v"] for x in data}
    added = 0
    for link in links:
        lm = re.search(r"[?&]list=([\w-]+)", link)
        if lm and "watch?v=" not in link:
            print("جاري قراءة قائمة التشغيل…")
            try:
                items = expand_playlist(lm.group(1))
            except Exception as e:
                print("تعذّر قراءة قائمة التشغيل:", e); continue
            if not items:
                print("لم أجد فيديوهات في القائمة (قد تكون خاصة أو المحتوى تغيّر)."); continue
            for vid, title in items:
                if vid in have:
                    continue
                data.append({"t": title, "r": reciter, "v": vid}); have.add(vid); added += 1
                print("أضيف:", title)
            continue
        vm = re.search(r"(?:v=|youtu\.be/|embed/|shorts/)([\w-]{11})", link) or re.fullmatch(r"([\w-]{11})", link)
        if not vm:
            print("رابط غير مفهوم:", link); continue
        vid = vm.group(1)
        if vid in have:
            print("موجود:", vid); continue
        title = oembed_title(vid) or input(f"تعذّر جلب العنوان لـ {vid}، اكتبه: ")
        data.append({"t": title, "r": reciter, "v": vid}); have.add(vid); added += 1
        print("أضيف:", title)
    if added:
        open(P, "w", encoding="utf-8").write("window.IBTIHAL_DATA=" + json.dumps(data, ensure_ascii=False, indent=0) + ";\n")
        print(f"تم حفظ {added} ابتهالاً جديداً. ارفع athr/ibtihal-data.js على الموقع.")
    else:
        print("لم تُضَف عناصر جديدة.")

if __name__ == "__main__":
    main()
