import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const flickreelRouter = express.Router();

class FlickreelService {
    constructor() {
        this.baseUrl = "https://api.farsunpteltd.com";
        this.requestSalt = "nW8GqjbdSYRI"; 
        this.deviceSecret = "nW8GqjbdSYRI";
        this.token = ""; 
        this.staticDeviceId = "0d51df6bdb25e4a8";
        this.staticDeviceSign = "25de2327021f4ba4dab7ae169909d616186a86b703be131763ee4853bca43634";
        this.generateNewIdentity();
        this.http = axios.create({
            baseURL: this.baseUrl,
            timeout: 15000,
            headers: {
                'Accept-Encoding': 'gzip',
                'Content-Type': 'application/json; charset=UTF-8',
                'Host': 'api.farsunpteltd.com',
                'User-Agent': 'MyUserAgent',
                'Version': '2.1.7.0',
                'Connection': 'Keep-Alive'
            }
        });

        this.generateNewIdentity();
    }

    generateRandomIP() {
        return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
    }
    generateGStyleId() {
        let result = 'G';
        const characters = '0123456789';
        for (let i = 0; i < 15; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    generateNonce(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    md5(str) {
        return crypto.createHash('md5').update(str).digest('hex');
    }
    sha256(str) {
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    randomNumeric(length) {
        let result = '';
        const characters = '0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    generateNewIdentity() {
        this.fakeIp = this.generateRandomIP();
        this.appsFlyerId = `${Date.now()}-${this.randomNumeric(19)}`;
        this.googleAdId = ""; 
        
        if (this.deviceSecret) {
            this.deviceId = this.generateGStyleId();
            this.deviceSign = this.sha256(this.deviceId + this.deviceSecret);
        } else {
            this.deviceId = this.staticDeviceId;
            this.deviceSign = this.staticDeviceSign;
        }
    }

    generateSign(params) {
        const keys = Object.keys(params).sort();
        let sb = "";
        keys.forEach(key => {
            const val = params[key];
            if (val === null || val === undefined) return;
            if (typeof val === 'string' && val === "") return;
            if (typeof val === 'boolean') return;

            let valStr = val;
            if (Array.isArray(val) || typeof val === 'object') {
                valStr = JSON.stringify(val);
            }
            sb += `${key}=${valStr}&`;
        });
        sb += `signSalt=${this.requestSalt}`;
        return this.md5(sb);
    }

    getCommonPayload() {
        return {
            "main_package_id": 100,
            "googleAdId": this.googleAdId,
            "device_id": this.deviceId,
            "query": this.deviceSign,
            "device_sign": this.deviceSign,
            "apps_flyer_uid": this.appsFlyerId,
            "os": "android",
            "device_brand": "Xiaomi",
            "device_number": "13",
            "language_id": "6",
            "countryCode": "ID"
        };
    }

    async loginAsGuest() {
        this.generateNewIdentity();
        const payload = { ...this.getCommonPayload() };
        const endpoint = '/app/login/loginWithDeviceId';
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();
        const sign = this.generateSign(payload);

        const headers = {
            'Nonce': nonce,
            'Sign': sign,
            'Timestamp': timestamp.toString(),
            'Token': "", 
            'X-Forwarded-For': this.fakeIp,
            'X-Real-IP': this.fakeIp
        };

        try {
            const response = await this.http.post(endpoint, payload, { headers });
                if (response.data && response.data.data && response.data.data.token) {
                this.token = response.data.data.token;
                return {
                    success: true,
                    token: this.token,
                    deviceId: this.deviceId,
                    member_id: response.data.data.member_id, 
                    mode: "UNLIMITED (G-Style)",
                    msg: "Login Berhasil - Akun Baru"
                };
            } else {
                console.error("[Flickreel] Login Gagal:", response.data);
                return { success: false, msg: response.data.msg || "Unknown error" };
            }
        } catch (error) {
            console.error("[Flickreel] Error Login:", error.message);
            return { success: false, msg: error.message };
        }
    }

    async request(endpoint, payload, isRetry = false) {
        if (!this.token && !isRetry) {
            await this.loginAsGuest();
        }
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();
        const finalPayload = { ...payload, ...this.getCommonPayload() };
        Object.assign(finalPayload, payload);
        const sign = this.generateSign(finalPayload);
        const headers = {
            'Nonce': nonce,
            'Sign': sign,
            'Timestamp': timestamp.toString(),
            'Token': this.token,
            'X-Forwarded-For': this.fakeIp,
            'X-Real-IP': this.fakeIp
        };

        try {
            const response = await this.http.post(endpoint, finalPayload, { headers });
            const data = response.data;
            if (data.code === -1 || (data.msg && data.msg.toLowerCase().includes('token'))) {
                if (!isRetry) {
                    console.log("[Flickreel] Token Expired/Invalid. Re-login...");
                    await this.loginAsGuest();
                    return await this.request(endpoint, payload, true); 
                }
            }
            return data;
        } catch (error) {
            console.error(`[Flickreel] HTTP Error ${endpoint}:`, error.message);
            if (error.response) return error.response.data;
            throw error;
        }
    }

    async refreshIdentity() {
        return await this.loginAsGuest();
    }

    async getHome(page = 1) {
        const res = await this.request('/app/playlet/navigationColumn', { "navigation_id": "30", "page": parseInt(page), "page_size": 20 });
        return this.formatList(res?.data || []);
    }
    async getLatest(page = 1) {
        const res = await this.request('/app/playlet/navigationColumn', { "navigation_id": "78", "page": parseInt(page), "page_size": 20 });
        return this.formatList(res?.data || []);
    }
    async getEvent(page = 1) {
        const res = await this.request('/app/playlet/navigationColumn', { "navigation_id": "387", "page": parseInt(page), "page_size": 20 });
        return this.formatList(res?.data || []);
    }
    async getRomance(page = 1) {
        const res = await this.request('/app/playlet/navigationColumn', { "navigation_id": "88", "page": parseInt(page), "page_size": 20 });
        return this.formatList(res?.data || []);
    }
    async getHotRank() {
        const res = await this.request('/app/playlet/hotRank', {});
        return this.formatRanking(res?.data || []);
    }
    async getRecommend() {
        const res = await this.request('/app/playlet/forYou', { "page_size": 10 });
        return this.formatRecommend(res?.data?.list || []);
    }
    async getRanking() {
        const res = await this.request('/app/user_search/searchRankList', {});
        return this.formatRanking(res?.data || []);
    }
    async search(keyword) {
        const res = await this.request('/app/user_search/search', { "is_mid_page": 0, "keyword": keyword });
        return this.formatSearch(res?.data || []);
    }
    async getDetail(playletId) {
        const payload = { "playlet_id": playletId.toString(), "page": 1, "page_size": 1000 };
        const res = await this.request('/app/playlet/chapterList', payload);
        if (!res || !res.data) return { error: "Drama not found or empty data" };
        const data = res.data;
        const list = data.list || [];
        return {
            id: data.playlet_id || playletId,
            title: data.title || "Unknown Title",
            cover: data.cover || "",
            intro: "", 
            total_chapters: list.length,
            tags: [], 
            chapters: list.map(ch => ({
                num: ch.chapter_num,
                id: ch.chapter_id,
                title: ch.chapter_title,
                cover: ch.chapter_cover,
                is_vip: ch.is_vip_episode === 1, 
                is_free: ch.is_lock === 0, 
                stream_url: `/movie/api/flickreel/stream?id=${playletId}&chapter_id=${ch.chapter_id}`
            }))
        };
    }
    async getStream(playletId, chapterId) {
        const res = await this.request('/app/playlet/preload', {
            "auto_unlock": false,
            "chapter_id": chapterId.toString(),
            "chapter_type": -1,
            "fragmentPosition": 0,
            "playlet_id": playletId.toString(),
            "source": 1,
            "vip_btn_scene": "{\"scene_type\":[1,3],\"play_type\":1,\"collection_status\":0}"
        });
        if (res.data) {
            return {
                playlet_id: res.data.playlet_id,
                chapter_id: res.data.chapter_id,
                chapter_num: res.data.chapter_num,
                url: res.data.hls_url,
                timeout: res.data.hls_timeout
            };
        }
        return null;
    }

    formatList(data) {
        const results = [];
        data.forEach(section => {
            if (section.list && Array.isArray(section.list)) {
                section.list.forEach(item => {
                    if (item.playlet_id) {
                        results.push({
                            id: item.playlet_id,
                            title: item.title,
                            cover: item.cover,
                            episodes: item.upload_num,
                            tags: item.playlet_tag_name || [],
                            intro: item.introduce,
                            detail_endpoint: `/api/flickreel/detail?id=${item.playlet_id}`
                        });
                    }
                });
            }
        });
        return results;
    }
    formatRecommend(list) {
        return list.map(item => ({
            id: item.playlet_id,
            title: item.playlet_title,
            cover: item.cover,
            likes: item.praise_num,
            total_chapter: item.chapter_num,
            detail_endpoint: `/api/flickreel/detail?id=${item.playlet_id}`
        }));
    }
    formatRanking(list) {
        const flatList = [];
        if (Array.isArray(list)) {
            list.forEach(group => {
                const items = group.rank_list || group.data || [];
                if (Array.isArray(items)) {
                    items.forEach(item => { flatList.push(this._mapRankItem(item, group.name)); });
                } else if (group.playlet_id) {
                    flatList.push(this._mapRankItem(group));
                }
            });
        }
        return flatList;
    }
    _mapRankItem(item, category = "") {
        return {
            rank: item.rank_order || item.rank_sort || 0,
            id: item.playlet_id,
            title: item.title,
            cover: item.cover,
            cover_sq: item.cover_square,
            hot_num: item.hot_num,
            episodes: item.upload_num,
            category: category || item.rank_name || "Rank",
            tags: item.tag_name || [],
            intro: item.introduce,
            detail_endpoint: `/api/flickreel/detail?id=${item.playlet_id}`
        };
    }
    formatSearch(list) {
        return list.map(item => ({
            id: item.playlet_id,
            title: item.title,
            cover: item.cover,
            episodes: item.upload_num,
            intro: item.introduce,
            detail_endpoint: `/api/flickreel/detail?id=${item.playlet_id}`
        }));
    }
}

const flickreelService = new FlickreelService();


flickreelRouter.get('/auth/refresh', async (req, res) => {
    try {
        const newIdentity = await flickreelService.refreshIdentity();
        res.json({ message: newIdentity.msg || "Identity Refreshed", data: newIdentity });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/home', async (req, res) => {
    try {
        const data = await flickreelService.getHome(req.query.page || 1);
        res.json({ data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/latest', async (req, res) => {
    try {
        const data = await flickreelService.getLatest();
        res.json({ type: "Latest", data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/hot-rank', async (req, res) => {
    try {
        const data = await flickreelService.getHotRank();
        res.json({ type: "Hot Rank", data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/event', async (req, res) => {
    try {
        const data = await flickreelService.getEvent();
        res.json({ type: "Event", data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/romance', async (req, res) => {
    try {
        const data = await flickreelService.getRomance();
        res.json({ type: "Romance", data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/ranking', async (req, res) => {
    try {
        const data = await flickreelService.getRanking();
        res.json({ data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/search', async (req, res) => {
    try {
        if (!req.query.q) return res.json({ data: [] });
        const data = await flickreelService.search(req.query.q);
        res.json({ data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/recommend', async (req, res) => {
    try {
        const data = await flickreelService.getRecommend();
        res.json({ data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/detail', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: "id required" });
        const data = await flickreelService.getDetail(id);
        res.json({ data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

flickreelRouter.get('/stream', async (req, res) => {
    try {
        const { id, chapter_id } = req.query;
        if (!id || !chapter_id) return res.status(400).json({ message: "id & chapter_id required" });

        const data = await flickreelService.getStream(id, chapter_id);
        if (!data) return res.status(404).json({ message: "Link not found / Premium locked" });

        res.json({ data });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

export default flickreelRouter;