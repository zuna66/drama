import express from 'express';
import Dramabox from './api/Dramabox.js';
import dramaboxV2Router from './api/DramaboxV2.js';
import netShortRouter from './api/NetShort.js';
import meloloRouter from './api/Melolo.js';
import dramaDashRouter from './api/Dramadash.js';
import dramawaveRouter from './api/Dramawave.js';
import flickreelRouter from './api/Flickreel.js';
import goodshortRouter from './api/GoodShort.js';
import dobdaRouter from './api/Dobda.js';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.json());
app.use((req, res, next) => {
    res.locals.request = req;
    next();
});

app.get('/', (req, res) => {
  res.render('docs', { 
    PORT: PORT,
    publicUrl: process.env.PUBLIC_URL || "" 
  });
});

app.get('/api/search', async (req, res) => {
  try {
    const { keyword, page, lang } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Parameter keyword wajib diisi' });

    const dramabox = new Dramabox(lang || 'in');
    
    const result = await dramabox.searchDrama(keyword, page || 1);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/search/suggest', async (req, res) => {
  try {
    const { keyword, page, lang } = req.query;
    if (!keyword) return res.status(400).json({ error: 'Parameter keyword wajib diisi' });

    const dramabox = new Dramabox(lang || 'in');
    
    const result = await dramabox.rsearchDrama(keyword, page || 1);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/list-lang', (req, res) => {
    const languageMap = [
        { code: 'in', name: '🇮🇩 Indonesia', arti: 'Bahasa Indonesia' },
        { code: 'en', name: '🇺🇸 English', arti: 'Inggris' },
        { code: 'ja', name: '🇯🇵 日本語', arti: 'Jepang' },
        { code: 'zhHans', name: '🇨🇳 简体中文', arti: 'Mandarin (Sederhana)' },
        { code: 'zh', name: '🇹🇼 繁體中文', arti: 'Mandarin (Tradisional)' },
        { code: 'es', name: '🇪🇸 Español', arti: 'Spanyol' },
        { code: 'de', name: '🇩🇪 Deutsch', arti: 'Jerman' },
        { code: 'fr', name: '🇫🇷 Français', arti: 'Prancis' },
        { code: 'pt', name: '🇵🇹 Português', arti: 'Portugis' },
        { code: 'ar', name: '🇸🇦 العربية', arti: 'Arab' },
        { code: 'th', name: '🇹🇭 ไทย', arti: 'Thailand' },
        { code: 'tl', name: '🇵🇭 Tagalog', arti: 'Tagalog' }
    ];

    res.json({ success: true, data: languageMap });
});

const FILTER_OPTIONS = {
    regions: [
        { code: 'all', value: '', name: '🌍 Semua Negara', arti: 'Global' },
        { code: 'id', value: '印度尼西亚', name: '🇮🇩 Indonesia', arti: 'Lokal Indonesia' },
        { code: 'cn', value: '中国', name: '🇨🇳 China', arti: 'Drama China' },
        { code: 'us', value: '美国', name: '🇺🇸 Amerika', arti: 'Drama US' },
        { code: 'kr', value: '韩国', name: '🇰🇷 Korea', arti: 'Drama Korea' },
        { code: 'jp', value: '日本', name: '🇯🇵 Jepang', arti: 'Drama Jepang' }
    ],
    formats: [
        { code: 'all', value: '', name: '🔊 Campur', arti: 'Semua Format' },
        { code: 'sub', value: '0', name: '📝 Subtitle Only', arti: 'Suara Asli + Teks' },
        { code: 'dub', value: '1', name: '🎙️ Dubbing', arti: 'Sulih Suara' }
    ],
    genres: [
        { code: 'all', value: '', name: 'Daftar Semua', arti: 'Semua Genre' },
        { code: 'ceo', value: '1324', name: 'CEO', arti: 'Kisah CEO Kaya' },
        { code: 'revenge', value: '1337', name: 'Balas Dendam', arti: 'Revenge Story' },
        { code: 'romance', value: '1357', name: 'Romansa', arti: 'Percintaan' },
        { code: 'family', value: '1348', name: 'Keluarga', arti: 'Drama Keluarga' },
        { code: 'history', value: '1319', name: 'Sejarah', arti: 'Kolosal / Kerajaan' },
        { code: 'betrayal', value: '1341', name: 'Perselingkuhan', arti: 'Pengkhianatan Cinta' },
        { code: 'identity', value: '1338', name: 'Identitas Rahasia', arti: 'Penyamar' },
        { code: 'rebirth', value: '1345', name: 'Rebirth', arti: 'Terlahir Kembali' },
        { code: 'power', value: '1334', name: 'Kekuatan Khusus', arti: 'Superpower' }
    ],
    sorts: [
        { code: 'popular', value: '1', name: '🔥 Terpopuler', arti: 'Paling Banyak Ditonton' },
        { code: 'latest', value: '2', name: '🆕 Terbaru', arti: 'Rilis Paling Baru' }
    ]
};

app.get('/api/list-custom', (req, res) => {
    res.json({
        success: true,
        data: FILTER_OPTIONS
    });
});

app.get('/api/custom-drama', async (req, res) => {
    try {
        const { page, size, lang, region, format, genre, sort } = req.query;
        const dramabox = new Dramabox(lang || 'in');
        const getValue = (list, code) => {
            if (!code) return ""; 
            const item = list.find(i => i.code === code);
            return item ? item.value : code; 
        };
        const regionVal = getValue(FILTER_OPTIONS.regions, region);
        const formatVal = getValue(FILTER_OPTIONS.formats, format);
        const genreVal  = getValue(FILTER_OPTIONS.genres, genre);
        const sortVal   = getValue(FILTER_OPTIONS.sorts, sort) || "1";
        const result = await dramabox.getDramaCustom(page || 1, size || 10, {
            region: regionVal,
            format: formatVal,
            genre: genreVal,
            sort: sortVal
        });
        res.json({ 
            success: true, 
            filters_applied: { region, format, genre, sort }, 
            data: result 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/home', async (req, res) => {
  try {
    const { page, size, lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in'); 

    const result = await dramabox.getDramaList(page || 1, size || 10);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sulih-suara', async (req, res) => {
  try {
    const { page, size, lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in'); 

    const result = await dramabox.getDramaDub(page || 1, size || 10);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/vip', async (req, res) => {
  try {
    const { lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in'); 
    
    const result = await dramabox.getVip();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/foryou', async (req, res) => {
  try {
    const { page, size, lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in');
    const result = await dramabox.foryou(page || 1, size || 15);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/latest', async (req, res) => {
  try {
    const { page, lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in');
    const result = await dramabox.getLatest(page || 1);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/popular', async (req, res) => {
  try {
    const { page, lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in');
    const result = await dramabox.getDramaPopular(page || 1);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/popular-search', async (req, res) => {
  try {
    const { page, lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in');
    const result = await dramabox.searchDramaIndex(page || 1);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/recommend', async (req, res) => {
  try {
    const { lang } = req.query;

    const dramabox = new Dramabox(lang || 'in'); 

    const result = await dramabox.getRecommendedBooks();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const { lang } = req.query;

    const dramabox = new Dramabox(lang || 'in'); 
    
    const result = await dramabox.getCategories();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { page, size, lang } = req.query;

    const dramabox = new Dramabox(lang || 'in'); 

    const result = await dramabox.getBookFromCategories(id, page || 1, size || 10);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/detail/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { lang, recommend, from } = req.query;
    if (!bookId) return res.status(400).json({ error: 'Book ID required' });

    const dramabox = new Dramabox(lang || 'in'); 
    const isRecommend = recommend === 'true';

    const result = await dramabox.getDramaDetail(bookId, isRecommend, from);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/detail/:bookId/v2', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { lang } = req.query;
    if (!bookId) return res.status(400).json({ error: 'Book ID required' });

    const dramabox = new Dramabox(lang || 'in'); 

    const result = await dramabox.getDramaDetailV2(bookId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/chapters/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { lang } = req.query;

    const dramabox = new Dramabox(lang || 'in'); 

    const result = await dramabox.getChapters(bookId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/video/proxy', (req, res) => {
  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).send('Missing or invalid url');
  }
  let parsed;
  try { parsed = new URL(target); } catch { return res.status(400).send('Bad URL'); }
  const mod = parsed.protocol === 'http:' ? http : https;
  const outHeaders = {
    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
    'Accept': '*/*',
  };
  if (req.headers.range) outHeaders['Range'] = req.headers.range;
  const upstream = mod.request({
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'http:' ? 80 : 443),
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: outHeaders,
  }, (upRes) => {
    res.status(upRes.statusCode || 200);
    const fwd = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'cache-control'];
    for (const h of fwd) if (upRes.headers[h]) res.setHeader(h, upRes.headers[h]);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    upRes.pipe(res);
  });
  upstream.on('error', (err) => {
    if (!res.headersSent) res.status(502).send(`Upstream error: ${err.message}`);
    else res.destroy();
  });
  req.on('close', () => upstream.destroy());
  upstream.end();
});

app.options('/api/video/proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.status(204).end();
});

app.get('/api/stream', async (req, res) => {
  try {
    const { bookId, episode, lang } = req.query;

    if (!bookId || !episode) {
      return res.status(400).json({ error: 'Parameter bookId dan episode wajib diisi.' });
    }
    const dramabox = new Dramabox(lang || 'in');
    const result = await dramabox.getStreamUrl(bookId, episode);
    res.json(result); 

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/download/:bookId', async (req, res) => {
    const { bookId } = req.params;
    const { lang } = req.query; 

    if (!bookId) {
        return res.status(400).json({ error: "Missing bookId" });
    }

    try {
        const dramabox = new Dramabox(lang || 'in'); 

        const rawData = await dramabox.batchDownload(bookId);

        if (!rawData || rawData.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "Tidak ada data yang ditemukan atau terjadi error."
            });
        }

        res.json({
            status: "success",
            total: rawData.length,
            data: rawData
        });

    } catch (error) {
        console.error("Download Error:", error.message);
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.get('/api/refresh-token', async (req, res) => {
  try {
    const { lang } = req.query;
    
    const dramabox = new Dramabox(lang || 'in'); 
    
    const tokenData = await dramabox.getToken();
    const timestamp = Date.now(); 
    const baseHeaders = dramabox.buildHeaders(tokenData, timestamp);
    const body = JSON.stringify({});
    const sn = dramabox.util.sign(
      `timestamp=${timestamp}${body}${tokenData.deviceId}${tokenData.androidId}${baseHeaders['tn']}`
    );
    
    const finalHeaders = {
      ...baseHeaders,
      'sn': sn,
      'request-timestamp': timestamp, 
    };

    const rawToken = baseHeaders['tn'] || "";
    const cleanToken = rawToken.replace("Bearer ", "");     
      res.json({
      message: "Header lengkap dengan SN dan Timestamp berhasil dibuat.",
      language_used: dramabox.lang,
      timestamp_ms: timestamp,
      target_url_ref: `${dramabox.baseUrl_Dramabox}/ENDPOINT_EXAMPLE?timestamp=${timestamp}`,
      generated_headers: finalHeaders,
      token_cache_info: {
          token: cleanToken,
          deviceId: tokenData.deviceId,
          androidId: tokenData.androidId,
          spoffer: tokenData.spoffer,
          token_valid_until: new Date(tokenData.expiry).toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({
      error: "Gagal memproses permintaan header.",
      details: error.message
    });
  }
});

app.get('/api/random', async (req, res) => {
  try {
    const { count, lang } = req.query;
    const limit = parseInt(count) || 1;
    const dramabox = new Dramabox(lang || 'in');
    const result = await dramabox.getRandomDrama(limit);
    res.json({ success: true, request_count: limit, result_count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api/dramaboxv2', dramaboxV2Router);
app.use('/api/netshort', netShortRouter);
app.use('/api/melolo', meloloRouter);
app.use('/api/dramadash', dramaDashRouter);
app.use('/api/dramawave', dramawaveRouter)
app.use('/api/flickreel', flickreelRouter);
app.use('/api/goodshort', goodshortRouter);
app.use('/api/v1', dobdaRouter);

// Only start the HTTP server when running locally (not on Vercel serverless).
// Vercel imports this file as a module and uses the exported `app` directly.
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
