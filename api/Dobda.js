import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

const BASE = 'https://api-drama.dobda.id';
const KEY = process.env.DOBDA_API_KEY;

if (!KEY) {
  console.warn('[dobda] DOBDA_API_KEY not set — /api/dobda/* will return 503');
}

function stripUpstreamWrappers(obj) {
  if (obj == null) return obj;
  if (typeof obj === 'string') {
    const m = obj.match(/^https?:\/\/api-drama\.dobda\.id\/api\/proxy\/(?:image|subtitle|stream)\?url=(.+)$/);
    if (m) {
      try {
        return decodeURIComponent(m[1].split('&')[0]);
      } catch {
        return obj;
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(stripUpstreamWrappers);
  if (typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = stripUpstreamWrappers(obj[k]);
    return out;
  }
  return obj;
}

async function dobdaGet(path) {
  if (!KEY) throw Object.assign(new Error('API key not configured'), { status: 503 });
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', KEY).update(`GET:${path}:${ts}`).digest('hex');
  const { data } = await axios.get(BASE + path, {
    headers: { 'X-Timestamp': ts, 'X-Signature': sig, 'User-Agent': 'sinema/1.0' },
    timeout: 20000,
    validateStatus: () => true,
  });
  return stripUpstreamWrappers(data);
}

const buildQs = (obj) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
};

router.get('/status', async (_req, res) => {
  try {
    const d = await dobdaGet('/api/v2/key/status');
    res.json(d);
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    res.json(await dobdaGet('/api/v2/categories'));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/languages', async (_req, res) => {
  try {
    res.json(await dobdaGet('/api/v2/languages'));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/plan', async (_req, res) => {
  try {
    res.json(await dobdaGet('/api/v2/key/plan'));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/banner/:platform', async (req, res) => {
  try {
    const { lang } = req.query;
    const path = `/api/v2/banner${buildQs({ category_p: req.params.platform, lang: lang || 'id' })}`;
    res.json(await dobdaGet(path));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/home/:platform', async (req, res) => {
  try {
    const { lang } = req.query;
    const path = `/api/v2/home${buildQs({ category_p: req.params.platform, lang: lang || 'id' })}`;
    res.json(await dobdaGet(path));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/discover/:platform', async (req, res) => {
  try {
    const { lang, page } = req.query;
    const path = `/api/v2/discover${buildQs({ category_p: req.params.platform, lang: lang || 'id', page: page || 1 })}`;
    res.json(await dobdaGet(path));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/detail/:platform/:id', async (req, res) => {
  try {
    const { lang } = req.query;
    const path = `/api/v2/detail${buildQs({ category_p: req.params.platform, id: req.params.id, lang: lang || 'id' })}`;
    res.json(await dobdaGet(path));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/video/:platform/:id/:chapterId', async (req, res) => {
  try {
    const { lang } = req.query;
    const path = `/api/v2/video${buildQs({
      category_p: req.params.platform,
      id: req.params.id,
      chapterId: req.params.chapterId,
      lang: lang || 'id',
    })}`;
    res.json(await dobdaGet(path));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

router.get('/search/:platform', async (req, res) => {
  try {
    const { q, lang, page } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const path = `/api/v2/search${buildQs({
      category_p: req.params.platform,
      q,
      lang: lang || 'id',
      page: page || 1,
    })}`;
    res.json(await dobdaGet(path));
  } catch (e) {
    res.status(e.status || 500).json({ success: false, error: e.message });
  }
});

export default router;
