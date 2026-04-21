import express from 'express';
import axios from 'axios';

const router = express.Router();

const BASE = 'https://www.goodshort.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const http = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
  },
});

const unicodeUnescape = (s) => (s || '').replace(/\\u002F/g, '/').replace(/\\u0026/g, '&').replace(/\\u003d/g, '=');

const uniq = (arr, key) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = key(x);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

async function fetchHtml(url) {
  const res = await http.get(url);
  return res.data;
}

function titleFromSlug(slug) {
  return slug
    .replace(/-\d+$/, '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function titleNear(html, linkIdx) {
  const window = html.slice(Math.max(0, linkIdx - 600), linkIdx + 800);
  const patterns = [
    /class="book-name[^>]*>([^<]+)</i,
    /class="item-title[^>]*>([^<]+)</i,
    /<h3[^>]*>([^<]+)</i,
    /alt="([^"]+)"/,
  ];
  for (const p of patterns) {
    const m = window.match(p);
    if (m && m[1].trim().length > 1 && !/default-book-cover/i.test(m[0])) return m[1].trim();
  }
  return null;
}

function coverNear(html, linkIdx) {
  const window = html.slice(Math.max(0, linkIdx - 600), linkIdx + 800);
  const imgs = [...window.matchAll(/<img[^>]*src="([^"]+)"/g)];
  for (const m of imgs) {
    const u = unicodeUnescape(m[1]);
    if (!/default-book-cover|placeholder|logo/i.test(u) && /goodshort|cdn/i.test(u)) return u;
  }
  return null;
}

function parseDramaLinks(html) {
  const re = /href="(\/drama\/([a-z0-9-]+-(\d+)))"/g;
  const items = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(html))) {
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);
    const title = titleNear(html, m.index) || titleFromSlug(id);
    const cover = coverNear(html, m.index);
    items.push({
      src: 'goodshort',
      id,
      bookId: m[3],
      title,
      cover,
    });
  }
  return items;
}

async function getHome() {
  const html = await fetchHtml(`${BASE}/`);
  return parseDramaLinks(html).slice(0, 40);
}

async function search(q) {
  const html = await fetchHtml(`${BASE}/search?q=${encodeURIComponent(q)}`);
  return parseDramaLinks(html).slice(0, 40);
}

function extractMetaFromDetail(html, resourceUrl) {
  const m = resourceUrl.match(/^(.*)-(\d+)$/);
  const bookId = m ? m[2] : null;

  const ogTitle = (html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) || [])[1];
  const ogImg = (html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) || [])[1];
  const ogDesc = (html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) || [])[1];

  const epRe = new RegExp(`/episode/${resourceUrl.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}/(\\d+)-(\\d+)`, 'g');
  const eps = [];
  const seen = new Set();
  let em;
  while ((em = epRe.exec(html))) {
    const idx = parseInt(em[1], 10);
    const chapterId = em[2];
    if (seen.has(idx)) continue;
    seen.add(idx);
    eps.push({ no: idx, chapterId, resource: `${em[1]}-${em[2]}` });
  }
  eps.sort((a, b) => a.no - b.no);

  return {
    bookId,
    title: ogTitle ? ogTitle.replace(/\s*\|\s*GoodShort.*$/i, '').trim() : null,
    cover: ogImg || null,
    description: ogDesc || null,
    episodes: eps,
  };
}

async function getDetail(id) {
  const html = await fetchHtml(`${BASE}/drama/${id}`);
  return extractMetaFromDetail(html, id);
}

async function getStream(id, ep) {
  const detail = await getDetail(id);
  const target = detail.episodes.find((e) => Number(e.no) === Number(ep));
  if (!target) return { detail, stream: null };

  const epUrl = `${BASE}/episode/${id}/${target.resource}`;
  const html = await fetchHtml(epUrl);

  const chapRe = /"id":\s*(\d+)[^{}]*?"chapterName":"([^"]+)"[^{}]*?"index":\s*(\d+)[^{}]*?"m3u8Path":"([^"]+)"(?:[^{}]*?"image":"([^"]+)")?/g;
  let best = null;
  let match;
  while ((match = chapRe.exec(html))) {
    const idx = parseInt(match[3], 10);
    const m3u8 = unicodeUnescape(match[4]);
    const cover = match[5] ? unicodeUnescape(match[5]) : null;
    if (idx + 1 === Number(ep)) {
      best = { no: ep, m3u8, cover, chapterId: match[1] };
      break;
    }
  }
  return { detail, stream: best };
}

router.get('/home', async (req, res) => {
  try {
    const data = await getHome();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const data = await search(q);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const data = await getDetail(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/watch/:id/:ep', async (req, res) => {
  try {
    const data = await getStream(req.params.id, req.params.ep);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
