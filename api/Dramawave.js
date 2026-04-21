import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const dramawaveRouter = express.Router();

class DramawaveV2 {
    constructor() {
        this.baseUrl = 'https://api.mydramawave.com';
        this.salt = "8IAcbWyCsVhYv82S2eofRqK1DF3nNDAv";
        this.tokenCache = null;
        this.baseUrlFR = 'https://apiv2.free-reels.com';
        this.saltFR = "8IAcbWyCsVhYv82S2eofRqK1DF3nNDAv";
        this.tokenCacheFR = null;
        
        this.fallbackIp = this.generateRandomIP();

        this.http = axios.create({
            timeout: 20000,
            headers: {
                'User-Agent': 'okhttp/4.12.0',
                'Content-Type': 'application/json; charset=UTF-8',
                'Accept-Encoding': 'gzip',
                'device': 'android',
                'language': 'id-ID',
                'country': 'ID'
            }
        });
    }

    generateRandomIP() {
        return Array.from({length: 4}, () => Math.floor(Math.random() * 255) + 1).join('.');
    }

    md5(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }

    generateSign(params, salt) {
        const keys = Object.keys(params).sort();
        const paramStr = keys.map(k => `${k}=${params[k]}`).join('&');
        return this.md5(`${paramStr}&key=${salt}`);
    }

    generateAuthHeader(tokenData, saltToUse) {
        if (!tokenData || !tokenData.token) return null;
        const ts = Date.now();
        const signature = this.md5(`${saltToUse}&${tokenData.secret}`);
        return `oauth_signature=${signature},oauth_token=${tokenData.token},ts=${ts}`;
    }

    async login() {
        try {
            const deviceId = crypto.randomUUID();
            const spoofIp = this.generateRandomIP();

            const payload = { "device_id": deviceId, "device_name": "Samsung SM-G991B", "ts": Math.floor(Date.now() / 1000) };
            const sign = this.generateSign(payload, this.salt);

            const res = await this.http.post(`${this.baseUrl}/dm-api/anonymous/login`, { ...payload, sign }, {
                headers: {
                    'app-name': 'com.dramawave.app',
                    'app-version': '1.7.01',
                    'device-id': deviceId,
                    'X-Forwarded-For': spoofIp,
                    'X-Real-IP': spoofIp
                }
            });

            if (res.data?.code === 200) {
                this.tokenCache = {
                    token: res.data.data.auth_key,
                    secret: res.data.data.auth_secret,
                    deviceId: deviceId,
                    ip: spoofIp
                };
                return this.tokenCache;
            }
        } catch (e) { console.error("[DW Login] Error:", e.message); }
        return null;
    }

    async loginFR() {
        try {
            const deviceId = crypto.randomUUID();
            const spoofIp = this.generateRandomIP();

            const payload = { "device_id": deviceId, "device_name": "Samsung SM-G991B", "ts": Math.floor(Date.now() / 1000) };
            const sign = this.generateSign(payload, this.saltFR);

            const res = await this.http.post(`${this.baseUrlFR}/frv2-api/anonymous/login`, { ...payload, sign }, {
                headers: {
                    'app-name': 'com.freereels.app',
                    'app-version': '2.1.41',
                    'device-id': deviceId,
                    'X-Forwarded-For': spoofIp,
                    'X-Real-IP': spoofIp
                }
            });

            if (res.data?.code === 200) {
                this.tokenCacheFR = {
                    token: res.data.data.auth_key,
                    secret: res.data.data.auth_secret,
                    deviceId: deviceId,
                    ip: spoofIp
                };
                return this.tokenCacheFR;
            }
        } catch (e) { console.error("[FR Login] Error:", e.message); }
        return null;
    }

    async request(endpoint, method = 'GET', params = null) {
        if (!this.tokenCache) await this.login();
        const currentIp = this.tokenCache?.ip || this.fallbackIp;

        const config = {
            method: method.toUpperCase(),
            url: `${this.baseUrl}${endpoint}`,
            headers: {
                ...this.http.defaults.headers,
                'app-name': 'com.dramawave.app', 'app-version': '1.7.01',
                'device-id': this.tokenCache?.deviceId,
                'Authorization': this.generateAuthHeader(this.tokenCache, this.salt),
                'X-Forwarded-For': currentIp,
                'X-Real-IP': currentIp
            }
        };
        if (method === 'GET') config.params = params; else config.data = params;

        try {
            const response = await this.http.request(config);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                this.tokenCache = null;
                return this.request(endpoint, method, params);
            }
            throw error;
        }
    }

    async requestFR(endpoint, method = 'GET', params = null) {
        if (!this.tokenCacheFR) await this.loginFR();
        const currentIp = this.tokenCacheFR?.ip || this.fallbackIp;
        const config = {
            method: method.toUpperCase(),
            url: `${this.baseUrlFR}${endpoint}`,
            headers: {
                ...this.http.defaults.headers,
                'app-name': 'com.freereels.app',
                'app-version': '2.1.41', 
                'device-id': this.tokenCacheFR?.deviceId,
                'Authorization': this.generateAuthHeader(this.tokenCacheFR, this.saltFR),
                'X-Forwarded-For': currentIp, 'X-Real-IP': currentIp
            }
        };
        if (method === 'GET') config.params = params; else config.data = params;
        try {
            const response = await this.http.request(config);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                this.tokenCacheFR = null;
                return this.requestFR(endpoint, method, params);
            }
            throw error;
        }
    }

    async getDetail(seriesId, baseUrl = "") { 
        if (!this.tokenCacheFR) await this.loginFR();
        const currentIpFR = this.tokenCacheFR?.ip || this.fallbackIp;
        try {
            const response = await axios.request({
                method: 'GET',
                url: `${this.baseUrlFR}/frv2-api/drama/info_v2?series_id=${seriesId}&clip_content=`,
                headers: {
                    ...this.http.defaults.headers,
                    'app-name': 'com.freereels.app', 'app-version': '2.1.41',
                    'device-id': this.tokenCacheFR?.deviceId,
                    'Authorization': this.generateAuthHeader(this.tokenCacheFR, this.saltFR),
                    'X-Forwarded-For': currentIpFR,
                    'X-Real-IP': currentIpFR
                }
            });
            if (response.data?.code === 401) {
                this.tokenCacheFR = null;
                await this.loginFR();
                return this.getDetail(seriesId, baseUrl); 
            }
            return this.cleanDetail(response.data, baseUrl); 
        } catch (error) {
            if (error.response?.status === 401) {
                this.tokenCacheFR = null;
                return { error: true, code: 401, message: "Unauthorized External" };
            }
            return { error: true, message: "Server Error" };
        }
    }

    cleanList(rawData) {
        let rawItems = [];
        let itemModuleKey = null;
        if (rawData.data?.items) {
            if (rawData.data.items.length > 0) {
                itemModuleKey = rawData.data.items[0].module_key; 
                if (rawData.data.items[0].items) {
                    rawData.data.items.forEach(mod => { 
                        if (mod.items && Array.isArray(mod.items)) rawItems.push(...mod.items); 
                    });
                } else {
                    rawItems = rawData.data.items;
                }
            }
        }
        let nextToken = rawData.data?.page_info?.next || null;
        const finalModuleKey = rawData.data?.module_key || rawData.data?.page_info?.module_key || itemModuleKey;
        if (nextToken && finalModuleKey) {
            if (!nextToken.includes('module_key=')) {
                nextToken += `&module_key=${finalModuleKey}`;
            }
        }
        return {
            items: rawItems.map(item => ({
                id: item.key || item.id,
                title: item.title || item.name,
                desc: item.desc || "",
                cover: item.cover,
                episode_count: item.episode_count,
                view_count: item.view_count || 0,
                score: item.score || 0,
                first_episode: item.episode || item.episode_info || item.container?.episode_info || null
            })),
            next: nextToken
        };
    }

    cleanDetail(rawData, baseUrl = "") {
        const info = rawData.data?.info;
        if (!info) return null;
        const proxyPath = '/movie/api/dramawave/stream/proxy?url=';
        const fullProxyEndpoint = baseUrl ? `${baseUrl}${proxyPath}` : proxyPath;
        return {
            id: info.id, 
            title: info.name, 
            desc: info.desc, 
            cover: info.cover, 
            total_episodes: info.episode_count,
            tags: info.tags || [],
            episodes: (info.episode_list || []).map(ep => ({
                index: ep.index, 
                id: ep.id, 
                name: ep.name, 
                cover: ep.cover, 
                duration: ep.duration, 
                is_locked: !ep.unlock,
                video_h264: ep.external_audio_h264_m3u8 || "", video_h265: ep.external_audio_h265_m3u8 || "",
                subtitles: (ep.subtitle_list || []).map(s => ({ 
                    lang: s.display_name, 
                    url: `${fullProxyEndpoint}${encodeURIComponent(s.subtitle)}`,
                    vtt: s.vtt ? `${fullProxyEndpoint}${encodeURIComponent(s.vtt)}` : ""
                })) 
            }))
        };
    }

    async getTabContent(tabKey, nextParams = "") {
        const isNextPage = nextParams && (nextParams.includes('offset=') || nextParams.includes('module_key='));
        if (isNextPage) {
            const params = new URLSearchParams(nextParams);
            const moduleKey = params.get('module_key');
            params.delete('module_key'); 
            const nextString = decodeURIComponent(params.toString()); 
            const payload = {
                "next": nextString,
                "module_key": moduleKey || "" 
            };
            return this.cleanList(await this.request('/dm-api/homepage/v2/tab/feed', 'POST', payload));
        } else {
            let url = `/dm-api/homepage/v2/tab/index?tab_key=${tabKey}`;
            if (nextParams) {
                url += `&${nextParams}`;
            } else {
                url += `&position_index=10000`;
            }
            return this.cleanList(await this.request(url));
        }
    }
    async getForYou(next = "") { return this.cleanList(await this.request(`/dm-api/foryou/feed?next=${next || ''}`)); }

    async getHotList(next = "") {
        const payload = { next: next || "" };
        return this.cleanList(await this.request('/dm-api/search/hot-list', 'POST', payload));
    }

    async getHotWords() {
        const res = await this.request('/dm-api/search/hot_words');
        const rawList = res.data?.hot_words || [];
        return rawList.map(item => {
            let score = 0;
            try { const info = JSON.parse(item.r_info); score = info.recall_score || 0; } catch (e) { score = 0; }
            return { keyword: item.word, score: parseFloat(score.toFixed(2)) };
        });
    }

    async searchDrama(keyword, next = "") {
        const payload = {
            "next": next || "",
            "keyword": keyword,
            "timestamp": Date.now().toString() 
        };
        const res = await this.requestFR('/frv2-api/search/drama', 'POST', payload);
        return this.cleanList(res);
    }

    async getSearchSuggestions(keyword) {
        const payload = { "keyword": keyword };
        const res = await this.request('/dm-api/search/keywords', 'POST', payload);
        const rawKeywords = res.data?.keywords || [];
        return rawKeywords.map(item => ({
            keyword: item.keyword,
            highlight: item.highlight 
        }));
    }

    async getTabList() {
        const raw = await this.request('/dm-api/homepage/v3/tab/list');
        const tabs = [];
        raw.data?.list?.forEach(g => {
            if (g.children) { g.children.forEach(c => tabs.push({ name: c.name, id: c.tab_key })); }
            else { tabs.push({ name: g.name, id: g.tab_key }); }
        });
        return tabs;
    }
}

const dw = new DramawaveV2();

const getPagination = (req, defaultValue = "") => {
    let param = req.query.next || req.query.page;
    if (!param || param === '1' || param === '0') return defaultValue;
    const ignoredKeys = ['q', 'page', 'next', 'url']; 
    const extras = [];
    Object.keys(req.query).forEach(key => {
        if (!ignoredKeys.includes(key)) {
            extras.push(`${key}=${req.query[key]}`);
        }
    });
    if (extras.length > 0) {
        param = param ? `${param}&${extras.join('&')}` : extras.join('&');
    }
    return param;
};
// ================= ROUTES =================

// 1. KATEGORI (Looping ID)
const dwCategories = {
    'popular': '678', 'upcoming': '686', 'event': '687', 'new': '681',
    'exclusive': '684', 'dubbing': '685', 'vip': '683', 'female': '680',
    'male': '682', 'free': '679', 'anime': '499'
};

for (const [slug, id] of Object.entries(dwCategories)) {
    dramawaveRouter.get(`/category/${slug}`, async (req, res) => {
        try {
            let defaultParams = "position_index=10000";
            if (slug === 'anime') defaultParams = "position_index=10001";
            const finalParams = getPagination(req, defaultParams);
            const data = await dw.getTabContent(id, finalParams);
            res.json({ type: slug, data });
        } catch (e) { res.status(500).json({ message: e.message }); }
    });
}

// 2. HOT WORDS (Clean Output)
dramawaveRouter.get('/hot-words', async (req, res) => {
    try {
        const data = await dw.getHotWords();
        res.json({ data });
    } catch (e) {
        res.status(500).json({ creator: "Sanka Vollerei", status: "error", message: e.message });
    }
});

// 3. HOT LIST
dramawaveRouter.get('/hot-list', async (req, res) => {
    try {
        const data = await dw.getHotList(getPagination(req));
        res.json({ data });
    } catch (e) {
        res.status(500).json({ creator: "Sanka Vollerei", status: "error", message: e.message });
    }
});

// 4. FOR YOU (Feed)
dramawaveRouter.get('/foryou', async (req, res) => {
    try {
        const data = await dw.getForYou(getPagination(req));
        res.json({ data });
    } catch (e) {
        res.status(500).json({ creator: "Sanka Vollerei", status: "error", message: e.message });
    }
});

// 5. SEARCH
dramawaveRouter.get('/search', async (req, res) => {
    try {
        if (!req.query.q) return res.status(400).json({ error: "Param q required" });
        const result = await dw.searchDrama(req.query.q, getPagination(req));
        res.json({ data: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

dramawaveRouter.get('/search/suggest', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: "Param q required" });

        const data = await dw.getSearchSuggestions(query);
        res.json({ data });
    } catch (e) {
        res.status(500).json({ creator: "Sanka Vollerei", status: "error", message: e.message });
    }
});

// 6. DETAIL
dramawaveRouter.get('/detail/:id', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const result = await dw.getDetail(req.params.id, baseUrl);
        if (result?.error && result?.code === 401) return res.status(401).json(result);
        if (!result) return res.status(404).json({ error: "Not Found" });
        res.json({ data: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. LIST TABS (Raw)
dramawaveRouter.get('/tabs', async (req, res) => {
    try {
        res.json({ data: await dw.getTabList() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8. GENERIC TAB (Fallback)
dramawaveRouter.get('/tab/:id', async (req, res) => {
    try {
        const finalParams = getPagination(req, "position_index=10000");
        res.json({ data: await dw.getTabContent(req.params.id, finalParams) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 9. REFRESH TOKEN (DUAL LOGIN & IP REGEN)
const handleDwRefresh = async (req, res) => {
    try {
        dw.tokenCache = null;
        dw.tokenCacheFR = null;
        const newTokenDW = await dw.login();
        const newTokenFR = await dw.loginFR();

        if (newTokenDW || newTokenFR) {
            res.json({
                creator: "Sanka Vollerei",
                status: "success",
                message: "Token Refresh Completed",
                data: {
                    dramawave: newTokenDW ? {
                        status: "success",
                        token_preview: newTokenDW.token,
                        device_id: newTokenDW.deviceId,
                        fake_ip: newTokenDW.ip
                    } : { status: "failed" },

                    freereels: newTokenFR ? {
                        status: "success",
                        token_preview: newTokenFR.token,
                        device_id: newTokenFR.deviceId,
                        fake_ip: newTokenFR.ip
                    } : { status: "failed" }
                }
            });
        } else {
            res.status(500).json({ status: "error", message: "Gagal mengambil token baru." });
        }
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
};
dramawaveRouter.get('/refresh-token', handleDwRefresh);
dramawaveRouter.post('/refresh-token', handleDwRefresh);

dramawaveRouter.get('/stream/proxy', async (req, res) => {
const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('No URL provided');
    const isM3u8 = targetUrl.includes('.m3u8');

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://mydramawave.com/'
            }
        });
        res.set('Access-Control-Allow-Origin', '*');

        if (isM3u8) {
            let m3u8Content = response.data;
            const targetBase = targetUrl.split('/').slice(0, -1).join('/') + '/';
            const currentHost = `${req.protocol}://${req.get('host')}`;
            const myProxyUrl = `${currentHost}/movie/api/dramawave/stream/proxy?url=`;
            const processUrl = (url) => {
                const absoluteUrl = url.startsWith('http') ? url : targetBase + url;
                if (absoluteUrl.includes('.m3u8')) {
                    return myProxyUrl + encodeURIComponent(absoluteUrl);
                }
                return absoluteUrl;
            };
            m3u8Content = m3u8Content.replace(/URI="([^"]+)"/g, (match, p1) => {
                return `URI="${processUrl(p1)}"`;
            });
            m3u8Content = m3u8Content.replace(/^(?!#)(.+)$/gm, (match) => {
                return processUrl(match.trim());
            });
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            res.send(m3u8Content);
        } else {
            res.set('Content-Type', response.headers['content-type']);
            res.send(response.data);
        }

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.set('Access-Control-Allow-Origin', '*'); 
        res.status(500).send('Proxy Error');
    }
});

export default dramawaveRouter;