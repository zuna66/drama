import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import heicConvert from 'heic-convert';

const meloloRouter = express.Router();

const randomNumeric = (length) => {
    let result = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const randomHex = (length) => {
    let result = '';
    const characters = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateRandomIP = () => {
        return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
};

const MELOLO_HOST = 'api.tmtreader.com';
const MELOLO_BASE_URL = `https://${MELOLO_HOST}`;
const spoofIp = generateRandomIP();
const MELOLO_HEADERS = {
    'Host': MELOLO_HOST,
    'Accept': 'application/json; charset=utf-8,application/x-protobuf',
    'X-Xs-From-Web': 'false',
    'Age-Range': '8',
    'Sdk-Version': '2',
    'Passport-Sdk-Version': '50357',
    'X-Vc-Bdturing-Sdk-Version': '2.2.1.i18n',
    'User-Agent': 'com.worldance.drama/49819 (Linux; U; Android 9; in; SM-N976N; Build/QP1A.190711.020;tt-ok/3.12.13.17)',
    'X-Forwarded-For': spoofIp,
    'X-Real-IP': spoofIp,
};
const MELOLO_PARAMS = {
    iid: randomNumeric(19),           
    device_id: randomNumeric(19),
    openudid: randomHex(16),
    cdid: crypto.randomUUID(),
    ac: 'wifi',
    channel: 'gp',
    aid: '645713',
    app_name: 'Melolo',
    version_code: '49819',
    version_name: '4.9.8',
    device_platform: 'android',
    os: 'android',
    ssmix: 'a',
    device_type: 'SM-N976N',
    device_brand: 'samsung',
    language: 'in',
    os_api: '28',
    os_version: '9',
    manifest_version_code: '49819',
    resolution: '900*1600',
    dpi: '320',
    update_version_code: '49819',
    current_region: 'ID',
    carrier_region: 'ID',
    app_language: 'id',
    sys_language: 'in',
    app_region: 'ID',
    sys_region: 'ID',
    mcc_mnc: '46002',
    carrier_region_v2: '460',
    user_language: 'id',
    time_zone: 'Asia/Bangkok',
    ui_language: 'in',
};

const MELOLO_CELLS = {
    trending: '7450059162446200848',
    latest: '7470064000445710353',
};

function generate_melolo_ticket() {
    return String(BigInt(`0x${crypto.randomUUID().replace(/-/g, '')}`) >> BigInt(64));
}

const createProxyUrl = (req, originalUrl) => {
    if (!originalUrl) return null;
    const [base, query] = originalUrl.split('?');
    const proxyPath = `/api/melolo/proxy-img`; 
    const fullProxy = `${req.protocol}://${req.get('host')}${proxyPath}`;
    return `${fullProxy}?url=${encodeURIComponent(base)}&${query || ''}`;
};

const formatMeloloBook = (req, book) => {
    let tags = [];
    try {
        if (book.category_info) {
            const parsedCats = JSON.parse(book.category_info);
            tags = parsedCats.map(c => c.Name);
        }
    } catch (e) {}

    return {
        id: book.book_id,
        title: book.book_name,
        author: book.author,
        synopsis: book.abstract,
        cover: createProxyUrl(req, book.thumb_url),
        original_cover: book.thumb_url,
        status: book.show_creation_status,
        rating: book.age_gate + "+",
        tags: tags,
        stats: {
            read_count: book.read_count || 0,
            episode_count: book.serial_count || 0,
            is_finished: book.book_status === "1"
        },
    };
};

// 1. ENDPOINT PROXY IMAGE 
meloloRouter.get('/proxy-img', async (req, res) => {
    const { url, ...rest } = req.query;
    if (!url) return res.status(400).json({ error: 'Parameter url required' });
    let target = String(url);
    const extraParams = new URLSearchParams();
    for (const [key, value] of Object.entries(rest)) {
        extraParams.append(key, String(value));
    }
    const extraQuery = extraParams.toString();
    if (extraQuery) target += (target.includes('?') ? '&' : '?') + extraQuery;

    try {
        const upstream = await axios.get(target, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'python-httpx/0.28.1', 'Accept': '*/*' },
            validateStatus: () => true,
        });

        const contentType = upstream.headers['content-type'] || 'application/octet-stream';
        const buffer = Buffer.from(upstream.data || []);

        if (upstream.status !== 200) {
            res.status(upstream.status).set('Content-Type', contentType).send(buffer);
            return;
        }

        const isHeic = contentType.includes('heic') || contentType.includes('heif') || target.toLowerCase().includes('.heic');
        if (isHeic) {
            try {
                const outputBuffer = await heicConvert({
                    buffer,
                    format: 'JPEG',
                    quality: 0.8,
                });
                res.set('Content-Type', 'image/jpeg');
                return res.send(outputBuffer);
            } catch (e) {
                console.log('HEIC convert error, serving raw:', e.message);
            }
        }

        res.set('Content-Type', contentType);
        res.send(buffer);

    } catch (err) {
        res.status(500).send('Proxy Error');
    }
});

// 2. ENDPOINT SEARCH
meloloRouter.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: "error", message: "Query 'q' required" });

    try {
        const params = { ...MELOLO_PARAMS, query: q, limit: '0', offset: '0', _rticket: generate_melolo_ticket() };
        const { data } = await axios.get(`${MELOLO_BASE_URL}/i18n_novel/search/page/v1/`, { headers: MELOLO_HEADERS, params });

        if (data.code !== 0) throw new Error(data.message || 'Upstream Error');

        const searchData = data.data?.search_data || [];
        let results = [];

        for (const cell of searchData) {
            if (cell.books && Array.isArray(cell.books)) {
                const mappedBooks = cell.books.map(b => formatMeloloBook(req, b));
                results = [...results, ...mappedBooks];
            }
        }

        res.json({
            status: "success",
            total: results.length,
            results
        });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 3. ENDPOINT TRENDING
meloloRouter.get('/trending', async (req, res) => {
    try {
        const params = { 
            ...MELOLO_PARAMS, 
            tab_scene: '3', tab_type: '0', limit: '0', start_offset: '0', 
            cell_id: MELOLO_CELLS.trending, _rticket: generate_melolo_ticket() 
        };
        const { data } = await axios.get(`${MELOLO_BASE_URL}/i18n_novel/bookmall/cell/change/v1/`, { headers: MELOLO_HEADERS, params });

        const books = data.data?.cell?.books || [];
        const results = books.map(b => formatMeloloBook(req, b));

        res.json({
            status: "success",
            type: "Trending",
            results
        });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 4. ENDPOINT LATEST
meloloRouter.get('/latest', async (req, res) => {
    try {
        const params = { 
            ...MELOLO_PARAMS, 
            tab_scene: '3', tab_type: '0', limit: '0', start_offset: '0', 
            cell_id: MELOLO_CELLS.latest, _rticket: generate_melolo_ticket() 
        };
        const { data } = await axios.get(`${MELOLO_BASE_URL}/i18n_novel/bookmall/cell/change/v1/`, { headers: MELOLO_HEADERS, params });

        const books = data.data?.cell?.books || [];
        const results = books.map(b => formatMeloloBook(req, b));

        res.json({
            status: "success",
            type: "Latest",
            results
        });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 5. ENDPOINT SERIES DETAIL & EPISODES
meloloRouter.get('/detail', async (req, res) => {
    const { id } = req.query; 
    if (!id) return res.status(400).json({ status: "error", message: "Query 'id' required" });

    try {
        const params = { ...MELOLO_PARAMS, _rticket: generate_melolo_ticket() };
        const payload = {
            biz_param: {
                detail_page_version: 0, from_video_id: '', need_all_video_definition: false,
                need_mp4_align: false, source: 4, use_os_player: false, video_id_type: 1
            },
            series_id: String(id)
        };

        const { data } = await axios.post(`${MELOLO_BASE_URL}/novel/player/video_detail/v1/`, payload, { headers: MELOLO_HEADERS, params });
        const videoData = data.data?.video_data || {};
        const idstream = String(req.query.id);

        const result = {
            id: videoData.series_id,
            id_stream: idstream,
            title: videoData.series_title,
            synopsis: videoData.series_intro,
            cover: createProxyUrl(req, videoData.series_cover),
            original_cover: videoData.series_cover,
            total_episodes: videoData.episode_cnt,
            play_count: videoData.series_play_cnt,
            status: videoData.series_status === 1 ? "Ongoing/Finished" : "Unknown",
            episodes: (videoData.video_list || []).map(ep => ({
                index: ep.vid_index,
                title: `Episode ${ep.vid_index}`,
                video_id: ep.vid,
                duration: ep.duration,
                cover: createProxyUrl(req, ep.episode_cover),
                likes: ep.digged_count,
                vertical: ep.vertical,
                stream_url: `/movie/api/melolo/watch?vid=${ep.vid}&sid=${idstream}`
            }))
        };

        res.json({
            status: "success",
            data: result
        });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 6. ENDPOINT WATCH (Get Stream URL)
function slugify(s) {
    return String(s || '').toLowerCase()
        .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '');
}

function pickMatchingSlug(html, title) {
    const slugs = [...new Set((html.match(/\/dramas\/[a-z0-9-]+/gi) || []))]
        .map(s => s.replace(/^\/dramas\//, ''));
    if (!slugs.length) return null;
    const titleSlug = slugify(title);
    const titleWords = titleSlug.split('-').filter(w => w.length >= 3);
    if (!titleWords.length) return slugs[0];
    let best = null, bestScore = 0;
    for (const slug of slugs) {
        const tokens = slug.split('-');
        const score = titleWords.filter(w => tokens.includes(w)).length / titleWords.length;
        if (score > bestScore) { bestScore = score; best = slug; }
    }
    return bestScore >= 0.5 ? best : null;
}

async function scrapeMeloloWeb(title, episodeIndex) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    };
    const locales = ['', '/id', '/en'];
    let slug = null;
    for (const loc of locales) {
        const searchUrl = `https://melolo.com${loc}/search?q=${encodeURIComponent(title)}`;
        try {
            const { data: html } = await axios.get(searchUrl, { headers, timeout: 20000 });
            const match = pickMatchingSlug(html, title);
            if (match) { slug = match; break; }
        } catch {}
    }
    if (!slug) return [];
    const epUrl = `https://melolo.com/dramas/${slug}/ep${episodeIndex}`;
    let epHtml;
    try {
        ({ data: epHtml } = await axios.get(epUrl, { headers, timeout: 20000 }));
    } catch { return []; }
    const raw = epHtml.match(/https?:\/\/v\.melolo\.com\/[^"'\\\s]+\.mp4[^"'\\\s]*/g) || [];
    const urls = [...new Set(raw.map(u => u.replace(/\\+$/, '')))];
    return urls;
}

meloloRouter.get('/watch', async (req, res) => {
    const { vid, sid } = req.query;
    if (!vid) return res.status(400).json({ status: "error", message: "Query 'vid' required" });

    try {
        const params = { ...MELOLO_PARAMS, _rticket: generate_melolo_ticket() };

        let seriesTitle = "Melolo Movie";
        let episodeTitle = "Unknown Episode";
        let next_vid = null;
        let prev_vid = null;
        let episodeIndex = null;

        if (sid) {
            const detailPayload = {
                biz_param: { detail_page_version: 0, source: 4, video_id_type: 1 },
                series_id: String(sid)
            };

            try {
                const { data: detailData } = await axios.post(`${MELOLO_BASE_URL}/novel/player/video_detail/v1/`, detailPayload, { headers: MELOLO_HEADERS, params });
                const videoData = detailData.data?.video_data || {};

                seriesTitle = videoData.series_title || seriesTitle;
                const fullVideoList = videoData.video_list || [];

                const currentIndex = fullVideoList.findIndex(v => String(v.vid) === String(vid));
                if (currentIndex !== -1) {
                    const cur = fullVideoList[currentIndex];
                    episodeTitle = `Episode ${cur.vid_index}`;
                    episodeIndex = cur.vid_index;
                    if (currentIndex > 0) prev_vid = fullVideoList[currentIndex - 1].vid;
                    if (currentIndex < fullVideoList.length - 1) next_vid = fullVideoList[currentIndex + 1].vid;
                }
            } catch (err) {
                console.log("Gagal fetch metadata detail");
            }
        }

        const streamPayload = {
            biz_param: {
                detail_page_version: 0, device_level: 3,
                need_all_video_definition: true, source: 4,
                video_id_type: 0, video_platform: 3
            },
            video_id: String(vid)
        };

        let raw = null;
        let videoModel = {};
        try {
            const { data: streamRes } = await axios.post(`${MELOLO_BASE_URL}/novel/player/video_model/v1/`, streamPayload, { headers: MELOLO_HEADERS, params });
            raw = streamRes.data;
            if (raw?.video_model) {
                try { videoModel = JSON.parse(raw.video_model); } catch (e) {}
            }
        } catch (err) {
            console.log(`[Melolo] video_model upstream failed: ${err.message}`);
        }

        const streamList = [];
        const wrapProxy = (u) => u ? `/api/video/proxy?url=${encodeURIComponent(u)}` : u;
        if (raw?.main_url) streamList.push({ quality: "HD (Source)", resolution: `${raw.video_width}x${raw.video_height}`, url: wrapProxy(raw.main_url), direct: raw.main_url });

        const videoListObj = videoModel.video_list || {};
        for (const key in videoListObj) {
            const item = videoListObj[key];
            let decodedUrl = item.main_url;
            try { if(!decodedUrl.startsWith('http')) decodedUrl = Buffer.from(item.main_url, 'base64').toString('utf-8'); } catch (e) {}
            streamList.push({
                quality: item.definition,
                resolution: `${item.vwidth}x${item.vheight}`,
                size_mb: (item.size / 1024 / 1024).toFixed(2),
                url: wrapProxy(decodedUrl),
                direct: decodedUrl,
            });
        }

        if (streamList.length === 0 && seriesTitle && episodeIndex) {
            console.log(`[Melolo] Fallback scrape melolo.com (${seriesTitle} ep${episodeIndex})`);
            try {
                const webUrls = await scrapeMeloloWeb(seriesTitle, episodeIndex);
                if (webUrls.length > 0) {
                    streamList.push({ quality: "HD (web)", resolution: "unknown", url: wrapProxy(webUrls[0]), direct: webUrls[0] });
                }
            } catch (err) {
                console.log(`[Melolo] Web fallback failed: ${err.message}`);
            }
        }

        if (streamList.length === 0) {
            return res.status(404).json({ status: "error", message: "Video not found" });
        }

        res.json({
            creator: "Sanka Vollerei",
            status: "success",
            data: {
                vid: vid,
                sid: sid || null,
                title: seriesTitle, 
                episode: episodeTitle, 
                navigation: {
                    prev_vid: prev_vid,
                    next_vid: next_vid,
                    prev_endpoint: prev_vid ? `/movie/api/melolo/watch?vid=${prev_vid}&sid=${sid}` : null,
                    next_endpoint: next_vid ? `/movie/api/melolo/watch?vid=${next_vid}&sid=${sid}` : null
                },
                vertical: (raw?.video_height || 0) > (raw?.video_width || 0),
                cover: createProxyUrl(req, videoModel.poster_url || raw?.poster_url),
                streams: streamList.sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution))
            }
        });

    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 7. ENDPOINT RECOMMENDATIONS
meloloRouter.get('/recommend', async (req, res) => {
    try {
        const params = { 
            ...MELOLO_PARAMS, 
            from_scene: '0',
            _rticket: generate_melolo_ticket() 
        };
        const { data: recData } = await axios.get(`${MELOLO_BASE_URL}/i18n_novel/search/scroll_recommend/v1/`, { 
            headers: MELOLO_HEADERS, 
            params 
        });
        if (recData.code !== 0) throw new Error(recData.message || 'Upstream Error');
        const scrollWords = recData.data?.scroll_words || [];
        const searchInfos = recData.data?.search_infos || [];
        const basicList = scrollWords.map((word, index) => {
            const info = searchInfos[index] || {};
            return {
                title: word,
                id: info.search_source_book_id
            };
        });

        const detailedResults = await Promise.all(basicList.map(async (item) => {
            if (!item.id) return item; 

            try {
                const detailParams = { ...MELOLO_PARAMS, _rticket: generate_melolo_ticket() };
                const payload = {
                    biz_param: {
                        detail_page_version: 0, from_video_id: '', need_all_video_definition: false,
                        need_mp4_align: false, source: 4, use_os_player: false, video_id_type: 1
                    },
                    series_id: String(item.id)
                };

                const { data: detailData } = await axios.post(
                    `${MELOLO_BASE_URL}/novel/player/video_detail/v1/`, 
                    payload, 
                    { headers: MELOLO_HEADERS, params: detailParams }
                );

                const videoData = detailData.data?.video_data || {};
                return {
                    id: item.id,
                    title: item.title || videoData.series_title, 
                    synopsis: videoData.series_intro || "",
                    cover: createProxyUrl(req, videoData.series_cover),
                    original_cover: videoData.series_cover,
                    total_episodes: videoData.episode_cnt || 0,
                    play_count: videoData.series_play_cnt || 0,
                    status: videoData.series_status === 1 ? "Ongoing/Finished" : "Unknown",
                };

            } catch (err) {
                return {
                    ...item,
                    note: "Detail failed to fetch"
                };
            }
        }));

        const cleanResults = detailedResults.filter(r => r && r.id);

        res.json({
            status: "success",
            total: cleanResults.length,
            results: cleanResults
        });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 8. Refresh Token (GET & POST)
const handleMeloloRefresh = (req, res) => {
    try {
        MELOLO_PARAMS.iid = randomNumeric(19);
        MELOLO_PARAMS.device_id = randomNumeric(19);
        MELOLO_PARAMS.openudid = randomHex(16);
        MELOLO_PARAMS.cdid = crypto.randomUUID();
        const newIp = generateRandomIP();
        MELOLO_HEADERS['X-Forwarded-For'] = newIp;
        MELOLO_HEADERS['X-Real-IP'] = newIp;
        res.json({
            creator: "Sanka Vollerei",
            status: "success",
            message: "Melolo Device Identity & IP Refreshed",
            data: {
                new_iid: MELOLO_PARAMS.iid,
                new_device_id: MELOLO_PARAMS.device_id,
                new_fake_ip: newIp
            }
        });
    } catch (e) {
        res.status(500).json({ 
            creator: "Sanka Vollerei", 
            status: "error", 
            message: e.message 
        });
    }
};

meloloRouter.get('/refresh-token', handleMeloloRefresh);
meloloRouter.post('/refresh-token', handleMeloloRefresh);

export default meloloRouter;