import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const dramaboxRouter = express.Router();

const generateRandomIP = () => {
    return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
};

const generateFakeToken = () => {
    const chars = 'abcdef0123456789';
    let token = 'dk_';
    for (let i = 0; i < 64; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
};

// Konfigurasi URL
const DS_BASE_URL = 'https://regexd.com/base.php'; 
const DS_SEARCH_URL = 'https://regexd.com/base.php'; 
const DS_DETAIL_URL = 'https://regexd.com/base.php'; 
const DB2_BASE_URL = 'https://dramabox.web.id/index.php';
const DB2_SEARCH_URL = 'https://dramabox.web.id/search.php';
const DB2_DETAIL_URL = 'https://dramabox.web.id/watch.php';
const PRIMARY_LATEST_URL = 'https://dramabox.sansekai.my.id/api/dramabox/latest';
const PRIMARY_TRENDING_URL = 'https://dramabox.sansekai.my.id/api/dramabox/trending';
const PRIMARY_SEARCH_URL = 'https://dramabox.sansekai.my.id/api/dramabox/search';
const PRIMARY_DETAIL_URL = 'https://dramabox.sansekai.my.id/api/dramabox/detail';
const PRIMARY_EPISODE_URL = 'https://dramabox.sansekai.my.id/api/dramabox/allepisode';

const SUPPORTED_LANGS = ['in', 'en', 'zhHans', 'zh', 'es', 'ko', 'ja', 'de', 'fr', 'pt', 'ar', 'th'];

// In-Memory Cache
let dramaboxCache = {}; 
const CACHE_DURATION = 60 * 60 * 1000; // 60 Menit

// Auto Clean Cache
setInterval(() => {
    const now = Date.now();
    for (const key in dramaboxCache) {
        if (now - dramaboxCache[key].timestamp > CACHE_DURATION) {
            delete dramaboxCache[key];
        }
    }
}, CACHE_DURATION);

// Helper: Random User Agent
const getRandomUserAgent = () => {
    const agents = [
       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        // ------------------ Windows - Chrome ------------------
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.179 Safari/537.36',
        'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.5790.171 Safari/537.36',
        // ------------------ Windows - Firefox ------------------
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0',
        'Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0',
        // ------------------ Windows - Edge ------------------
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36 Edg/118.0.5993.90',
        // ------------------ MacOS - Safari ------------------
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
        // ------------------ MacOS - Chrome ------------------
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36',
        // ------------------ MacOS - Firefox ------------------
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1; rv:119.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1; rv:118.0) Gecko/20100101 Firefox/118.0',
        // ------------------ Linux ------------------
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64; rv:119.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (X11; Linux x86_64; rv:118.0) Gecko/20100101 Firefox/118.0',
        // ------------------ iPhone ------------------
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.7 Mobile/15E148 Safari/604.1',
        // ------------------ iPad ------------------
        'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        // ------------------ Android - Chrome ------------------
        'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 14; SM-S908N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; Xiaomi 13 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Mobile Safari/537.36',
        // ------------------ Android - Firefox ------------------
        'Mozilla/5.0 (Linux; Android 14; Mobile; rv:119.0) Gecko/119.0 Firefox/119.0',
        'Mozilla/5.0 (Linux; Android 13; Mobile; rv:118.0) Gecko/118.0 Firefox/118.0',
        'Mozilla/5.0 (Linux; Android 12; Mobile; rv:117.0) Gecko/117.0 Firefox/117.0',
        // ------------------ Edge Mobile ------------------
        'Mozilla/5.0 (Linux; Android 14; Mobile; Edg/119.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        // ------------------ Tambahan Modern ------------------
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.5790.171 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.179 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 12; Pixel 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.179 Mobile Safari/537.36',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
};

let currentSpoofIp = generateRandomIP();
let currentUserAgent = getRandomUserAgent();
let currentToken = generateFakeToken();

const getDsHeaders = () => ({
    'User-Agent': getRandomUserAgent(),
    'X-Requested-With': 'XMLHttpRequest'
});

const AXIOS_CONFIG = {
    timeout: 15000,
    headers: getDsHeaders()
};

const extractBookId = (url) => {
    if (!url) return null;
    try {
        const fullUrl = url.startsWith('http') ? url : `http://dummy.com/${url}`;
        const urlParams = new URLSearchParams(new URL(fullUrl).search);
        return urlParams.get('bookId');
    } catch (e) {
        return null;
    }
};

const cleanCoverUrl = (url) => {
    if (!url) return null;
    return url.split('@')[0]; 
};

// 1. Search
dramaboxRouter.get('/search', async (req, res) => {
    const query = req.query.q;
    const lang = 'in';
    if (!query) return res.status(400).json({ creator: "Sanka Vollerei", status: "error", message: 'Parameter q required' });
    try {
        let response;
        let usedSource = 'primary_scraper';
        try {
            response = await axios.get(DS_SEARCH_URL, {
                params: { q: query, lang },
                ...AXIOS_CONFIG
            });
        } catch (primaryError) {
            console.log(`[Search] Primary DS failed. Switching to DB2...`);
            try {
                response = await axios.get(DB2_SEARCH_URL, {
                    params: { q: query, lang },
                    ...AXIOS_CONFIG
                });
                usedSource = 'secondary_scraper';
            } catch (secondaryError) {
                console.log(`[Search] DB2 failed. Switching to Sansekai API Fallback...`);
            }
        }
        if (response && response.data) {
            const $ = cheerio.load(response.data);
            const searchResults = [];
            const resultCountText = $('.search-results-count').text().trim();
            $('.drama-grid .drama-card').each((index, element) => {
                const title = $(element).find('.drama-title').text().trim();
                const rawCover = $(element).find('.drama-image img').attr('src');
                const cover = cleanCoverUrl(rawCover);
                let episodeText = $(element).find('.drama-meta span[itemprop="numberOfEpisodes"]').text().trim();
                if (!episodeText) episodeText = $(element).find('.drama-meta').text().replace('👁️ 0', '').trim();
                const linkHref = $(element).find('a.watch-button').attr('href');
                searchResults.push({
                    bookId: extractBookId(linkHref),
                    judul: title,
                    total_episode: episodeText.replace('📺', '').trim(),
                    cover: cover
                });
            });
            const resultData = {
                creator: "Sanka Vollerei",
                status: 'success',
                query,
                info: resultCountText,
                total_results: searchResults.length,
                data: searchResults
            };
            return res.json(resultData);
        }
        try {
            const apiResponse = await axios.get(PRIMARY_SEARCH_URL, {
                params: { query: query }
            });
            const apiData = apiResponse.data;
            if (Array.isArray(apiData) && apiData.length > 0) {
                const mappedData = apiData.map(item => ({
                    bookId: item.bookId,
                    judul: item.bookName,
                    total_episode: `${item.chapterCount || '?'} Eps`,
                    cover: item.cover,
                    tags: item.tagNames ? item.tagNames.join(', ') : ''
                }));
                const resultData = {
                    creator: "Sanka Vollerei",
                    status: 'success',
                    query,
                    total_results: mappedData.length,
                    data: mappedData
                };
                return res.json(resultData);
            } else {
                    return res.json({ creator: "Sanka Vollerei", status: "success", message: "Data tidak ditemukan di semua sumber.", data: [] });
            }
        } catch (apiError) {
            throw new Error("Api kena kanker.");
        }

    } catch (error) {
        res.status(500).json({ creator: "Sanka Vollerei", status: "error", message: error.message });
    }
});

// 2. Latest 
dramaboxRouter.get('/latest', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const lang = 'in';
    let useScraper = true; 
    if (page === 1) {
        try {
            const primaryResponse = await axios.get(PRIMARY_LATEST_URL);
            const primaryData = primaryResponse.data;
            if (Array.isArray(primaryData) && primaryData.length > 0) {
                const mappedData = primaryData.map(item => ({
                    bookId: item.bookId,
                    judul: item.bookName,
                    total_episode: `${item.chapterCount} ep`, 
                    cover: item.coverWap
                }));
                const resultData = {
                    creator: "Sanka Vollerei",
                    status: 'success',
                    type: 'latest',
                    page: page,
                    total: mappedData.length,
                    data: mappedData
                };
                return res.json(resultData);
            }
        } catch (primaryError) {
            console.log(`[Latest Page 1] Primary API Error/Mati. Fallback ke Scraper...`);
        }
    }
    try {
        let response;
        try {
            response = await axios.get(DS_BASE_URL, {
                params: { page, lang },
                ...AXIOS_CONFIG
            });
        } catch (scraperError) {
            console.log(`[Latest] Primary Scraper DS failed. Switching to DB2 Fallback...`);
            response = await axios.get(DB2_BASE_URL, {
                params: { page, lang },
                ...AXIOS_CONFIG
            });
        }
        const $ = cheerio.load(response.data);
        const dramas = [];
        $('.drama-grid .drama-card').each((index, element) => {
            const title = $(element).find('.drama-title').text().trim();
            const rawCover = $(element).find('.drama-image img').attr('src');
            const cover = cleanCoverUrl(rawCover);
            const episodeText = $(element).find('.drama-meta span').text().trim();
            const linkHref = $(element).find('a.watch-button').attr('href');
            const currentBookId = extractBookId(linkHref);
            if (currentBookId === '42000000271') return;
            dramas.push({
                bookId: currentBookId,
                judul: title,
                total_episode: episodeText.replace('📺', '').trim(),
                cover: cover
            });
        });
        const resultData = {
            creator: "Sanka Vollerei",
            status: 'success',
            type: 'latest',
            page: page,
            total: dramas.length,
            data: dramas
        };
        res.json(resultData);
    } catch (error) {
        res.status(500).json({ 
            creator: "Sanka Vollerei", 
            status: "error", 
            message: error.message 
        });
    }
});

// 3. Trending 
dramaboxRouter.get('/trending', async (req, res) => {
    const lang = 'in';
    try {
        const primaryResponse = await axios.get(PRIMARY_TRENDING_URL);
        const primaryData = primaryResponse.data;
        if (Array.isArray(primaryData) && primaryData.length > 0) {
            const mappedData = primaryData.map(item => ({
                rank: item.rankVo ? item.rankVo.sort : 0, 
                bookId: item.bookId,
                judul: item.bookName,
                total_episode: `${item.chapterCount} Ep`,
                cover: item.coverWap
            }));
            mappedData.sort((a, b) => a.rank - b.rank);
            const resultData = {
                creator: "Sanka Vollerei",
                status: 'success',
                type: 'trending',
                total: mappedData.length,
                data: mappedData
            };
            return res.json(resultData);
        }
    } catch (primaryError) {
        console.log(`[Trending] Primary API failed, switching to scraper fallback...`);
    }
    try {
        let response;
        try {
            response = await axios.get(DS_BASE_URL, {
                params: { page: 1, lang },
                ...AXIOS_CONFIG
            });
        } catch (scraperError) {
            console.log(`[Trending] Primary Scraper DS failed. Switching to DB2 Fallback...`);
            response = await axios.get(DB2_BASE_URL, {
                params: { page: 1, lang },
                ...AXIOS_CONFIG
            });
        }
        const $ = cheerio.load(response.data);
        const trendingDramas = [];
        $('.rank-list .rank-item').each((index, element) => {
            const title = $(element).find('.rank-title').text().trim();
            const rawCover = $(element).find('.rank-image img').attr('src');
            const cover = cleanCoverUrl(rawCover);
            const episodeText = $(element).find('.rank-meta span').text().trim();
            const rankNumber = $(element).find('.rank-number').text().trim();
            const linkHref = $(element).attr('href');
            trendingDramas.push({
                rank: parseInt(rankNumber),
                bookId: extractBookId(linkHref),
                judul: title,
                total_episode: episodeText.replace('📺', '').trim(),
                cover: cover
            });
        });
        const resultData = {
            creator: "Sanka Vollerei",
            status: 'success',
            type: 'trending',
            total: trendingDramas.length,
            data: trendingDramas
        };
        res.json(resultData);
    } catch (error) {
        res.status(500).json({ creator: "Sanka Vollerei", status: "error", message: error.message });
    }
});

// 4. Detail
dramaboxRouter.get('/detail', async (req, res) => {
    const bookId = req.query.bookId;
    const lang = 'in';
    if (!bookId) return res.status(400).json({ creator: "Sanka Vollerei", status: 'error', message: 'Parameter bookId wajib diisi.' });
    try {
        let response;
        let usedSource = 'primary_scraper';
        try {
            response = await axios.get(DS_DETAIL_URL, {
                params: { bookId, lang },
                ...AXIOS_CONFIG
            });
        } catch (primaryError) {
            console.log(`[Detail] Primary DS failed. Switching to DB2...`);
            try {
                response = await axios.get(DB2_DETAIL_URL, {
                    params: { bookId, lang },
                    ...AXIOS_CONFIG
                });
                usedSource = 'secondary_scraper';
            } catch (secondaryError) {
                console.log(`[Detail] DB2 failed. Switching to Sansekai Fallback...`);
            }
        }
        if (response && response.data) {
            const $ = cheerio.load(response.data);
            const rawTitleHtml = $('h1.video-title').html(); 
            let cleanTitle = rawTitleHtml ? rawTitleHtml.split('<span')[0].trim().replace(/ - Episode$/i, '').replace(/-$/, '').trim() : $('h1.video-title').text().trim();
            const description = $('.video-description').text().trim();
            const rawCover = $('meta[itemprop="thumbnailUrl"]').attr('content');
            const cover = cleanCoverUrl(rawCover);
            const totalEpisodeText = $('.video-meta span[itemprop="numberOfEpisodes"]').text().trim();
            const likesText = $('.video-meta span').first().text().trim();
            const episodes = [];
            $('#episodesList .episode-btn').each((index, element) => {
                const epNum = $(element).attr('data-episode'); 
                const label = $(element).text().trim(); 
                episodes.push({
                    episode_index: parseInt(epNum),
                    episode_label: label,
                });
            });
            const resultData = {
                creator: "Sanka Vollerei",
                status: 'success',
                bookId: bookId,
                judul: cleanTitle,
                deskripsi: description,
                cover: cover,
                total_episode: totalEpisodeText.replace('📺', '').trim(),
                likes: likesText.replace('❤️', '').trim(),
                jumlah_episode_tersedia: episodes.length,
                episodes: episodes
            };
            return res.json(resultData);
        }
        try {
            const apiResponse = await axios.get(PRIMARY_DETAIL_URL, {
                params: { bookId: bookId }
            });
            if (apiResponse.data && apiResponse.data.data && apiResponse.data.data.book) {
                const bookData = apiResponse.data.data.book;
                const chapterList = apiResponse.data.data.chapterList || [];
                const mappedEpisodes = chapterList.map(ep => ({
                    episode_index: ep.index,
                    episode_label: `Episode ${parseInt(ep.index) + 1}`,
                    is_locked: !ep.unlock 
                }));
                const resultData = {
                    creator: "Sanka Vollerei",
                    status: 'success',
                    bookId: bookData.bookId,
                    judul: bookData.bookName,
                    deskripsi: bookData.introduction,
                    cover: cleanCoverUrl(bookData.cover),
                    total_episode: `${bookData.chapterCount} Eps`,
                    likes: `${bookData.followCount || 0} Follows`,
                    jumlah_episode_tersedia: mappedEpisodes.length,
                    episodes: mappedEpisodes
                };
                return res.json(resultData);
            } else {
                    throw new Error("Detail tidak ditemukan.");
            }
        } catch (apiError) {
                throw new Error("Api Gagal Jantung.");
        }
    } catch (error) {
        res.status(500).json({ creator: "Sanka Vollerei", status: 'error', message: 'Gagal mengambil detail drama', error: error.message });
    }
});

// 5. Stream
dramaboxRouter.get('/stream', async (req, res) => {
    const { bookId, episode } = req.query;
    const lang = req.query.lang || 'in';
    if (!bookId || !episode) {
        return res.status(400).json({ 
            creator: "Sanka Vollerei",
            status: 'error', 
            message: 'Parameter bookId dan episode wajib diisi.' 
        });
    }
    try {
        let response;
        let usedSource = 'primary_scraper';
        const params = { 
            ajax: 1,
            bookId: bookId, 
            lang: lang, 
            episode: episode 
        };
        try {
            response = await axios.get(DS_DETAIL_URL, {
                params: params,
                headers: {
                    ...getDsHeaders(),
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': `${DS_DETAIL_URL}?bookId=${bookId}` 
                }
            });
        } catch (primaryError) {
            console.log(`[Stream] Primary DS failed. Switching to DB2...`);
            try {
                response = await axios.get(DB2_DETAIL_URL, {
                    params: params,
                    headers: {
                        ...getDsHeaders(),
                        'X-Requested-With': 'XMLHttpRequest',
                        'Referer': `${DB2_DETAIL_URL}?bookId=${bookId}` 
                    }
                });
                usedSource = 'secondary_scraper';
            } catch (secondaryError) {
                console.log(`[Stream] DB2 failed. Switching to Sansekai Fallback...`);
            }
        }
        if (response && response.data && response.data.chapter) {
            const rawData = response.data;
            const formattedResult = {
                creator: "Sanka Vollerei",
                status: "success",
                data: {
                    bookId: bookId.toString(),
                    allEps: rawData.totalEpisodes,
                    chapter: {
                        id: rawData.chapter.id,
                        index: rawData.chapter.index,
                        indexCode: rawData.chapter.indexStr,
                        duration: rawData.chapter.duration,
                        cover: cleanCoverUrl(rawData.chapter.cover),
                        video: {
                            mp4: rawData.chapter.mp4,
                            m3u8: rawData.chapter.m3u8Url
                        }
                    }
                }
            };
            return res.json(formattedResult);
        }
        try {
            const apiResponse = await axios.get(PRIMARY_EPISODE_URL, {
                params: { bookId: bookId }
            });
            const allEpisodes = apiResponse.data; 
            if (Array.isArray(allEpisodes)) {
                const targetEp = allEpisodes.find(ep => ep.chapterIndex == episode);
                if (targetEp) {
                    let videoUrl = null;
                    if (targetEp.cdnList && targetEp.cdnList.length > 0) {
                            const defaultCdn = targetEp.cdnList.find(c => c.isDefault === 1) || targetEp.cdnList[0];
                            if (defaultCdn && defaultCdn.videoPathList && defaultCdn.videoPathList.length > 0) {
                                const videoObj = defaultCdn.videoPathList.find(v => v.isDefault === 1) || defaultCdn.videoPathList[0];
                                videoUrl = videoObj.videoPath;
                            }
                    }
                    if (videoUrl) {
                        const formattedResult = {
                            creator: "Sanka Vollerei",
                            status: "success",
                            data: {
                                bookId: bookId.toString(),
                                allEps: allEpisodes.length, 
                                chapter: {
                                    id: targetEp.chapterId,
                                    index: targetEp.chapterIndex,
                                    indexCode: targetEp.chapterIndex.toString().padStart(3, '0'), 
                                    duration: 0, 
                                    cover: targetEp.chapterImg,
                                    video: {
                                        mp4: videoUrl,
                                        m3u8: "" 
                                    }
                                }
                            }
                        };
                        return res.json(formattedResult);
                    } else {
                            throw new Error("Link video tidak ditemukan .");
                    }
                } else {
                    return res.status(404).json({
                        creator: "Sanka Vollerei",
                        status: 'error',
                        message: 'Episode tidak ditemukan.'
                    });
                }
            } else {
                    throw new Error("Format tidak valid.");
            }
        } catch (apiError) {
                return res.status(500).json({ 
                creator: "Sanka Vollerei",
                status: 'error', 
                message: 'Gagal mengambil stream dari semua sumber.', 
                error: 'Aiueo' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            creator: "Sanka Vollerei",
            status: 'error', 
            message: 'Internal Server Error', 
            error: error.message 
        });
    }
});

// 6. Refresh Token (Generate New IP & UA)
const handleRefreshIdentity = (req, res) => {
    try {
        const oldIp = currentSpoofIp;
        currentSpoofIp = generateRandomIP();
        currentUserAgent = getRandomUserAgent();
        currentToken = generateFakeToken();
        res.json({
            creator: "Sanka Vollerei",
            status: "success",
            message: "Scraper Identity Refreshed (New IP & UA Generated)",
            token: currentToken, 
            data: {
                previous_ip: oldIp,
                new_fake_ip: currentSpoofIp,
                new_user_agent: currentUserAgent
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

dramaboxRouter.get('/refresh-token', handleRefreshIdentity);
dramaboxRouter.post('/refresh-token', handleRefreshIdentity);

export default dramaboxRouter;