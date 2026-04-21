import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const generateRandomIP = () => {
    return Array.from({length: 4}, () => Math.floor(Math.random() * 256)).join('.');
};
class DramaDash {
    constructor() {
        this.apiUrl = `https://www.dramadash.app/api/`;
        this.deviceId = this.generateDeviceId();
        this.deviceToken = null;
        this.fakeIp = generateRandomIP();
    }

    async ensureToken() {
        if (!this.deviceToken) {
            this.deviceToken = await this.getToken();
        }
    }

    generateDeviceId() {
        return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    }
    

    getDefaultHeaders() {
        return {
            "app-version": 70,
            "lang": "id",
            "platform": "android",
            "tz": "Asia/Bangkok",
            "device-type": "phone",
            "content-type": "application/json; charset=UTF-8",
            "accept-encoding": "gzip",
            "user-agent": "okhttp/5.1.0",
            "X-Forwarded-For": this.fakeIp,
            "X-Real-IP": this.fakeIp,
            ...(this.deviceToken && { "authorization": `Bearer ${this.deviceToken}` })
        };
    }

    async request(endpoint, method = "GET", data = null) {
        if (endpoint !== "landing") {
            await this.ensureToken();
        }

        const config = {
            url: `${this.apiUrl}${endpoint}`,
            method,
            headers: this.getDefaultHeaders(),
            ...(data && { data })
        };

        try {
            const res = await axios(config);
            return res.data;
        } catch (err) {
            if (err.response && err.response.status === 401) {
                this.deviceToken = null; 
                console.log("Token DramaDash expired, renewing...");
            }
            console.error(`DramaDash Request failed [${method} ${endpoint}]:`, err?.response?.data || err.message);
            throw err;
        }
    }

    async getToken() {
        try {
            const payload = { android_id: this.deviceId };
            const config = {
                url: `${this.apiUrl}landing`,
                method: "POST",
                headers: { ...this.getDefaultHeaders(), authorization: undefined }, 
                data: payload
            };
            const res = await axios(config);
            return res.data?.token || null;
        } catch (e) {
            console.error("Gagal mendapatkan token DramaDash:", e.message);
            return null;
        }
    }

    async getHome() {
        const res = await this.request('home', "GET");
        if (!res) return { status: 500, message: "No data" };

        const { dramaList, bannerDramaList, trendingSearches, tabs } = res;
        
        const dramaListFiltered = dramaList ? dramaList.filter(item => Array.isArray(item.list)).flatMap(item => item.list) : [];
        
        const trending = trendingSearches ? trendingSearches.map(item => ({
            id: item.id,
            name: item.name,
            poster: item.poster,
            genres: item.genres ? item.genres.map(g => g.displayName) : []
        })) : [];

        const mapDramaItem = (item) => ({
            id: item.id,
            name: item.name,
            poster: item.poster,
            desc: item.desc || "",
            viewCount: item.viewCount || 0,
            tags: item.tags ? item.tags.map(t => t.displayName) : [],
            genres: item.genres ? item.genres.map(g => g.displayName) : []
        });

        const banner = bannerDramaList && bannerDramaList.list ? bannerDramaList.list.map(mapDramaItem) : [];
        const drama = dramaListFiltered.map(mapDramaItem);

        return {
            status: 200,
            data: {
                banner,
                trending,
                drama_list: drama
            },
            tabs
        };
    }

    async getDrama(dramaId) { 
        try {
            const res = await this.request(`drama/${dramaId}`, "GET");
            const drama = res.drama;
            if(!drama) throw new Error("Drama not found");

            return {
                status: 200,
                data: {
                    id: drama.id,
                    name: drama.name,
                    poster: drama.poster,
                    description: drama.description,
                    total_episodes: drama.episodes ? drama.episodes.length : 0
                },
                episodes: drama.episodes,
            };
        } catch (err) {
            throw new Error(err.message);
        }
    }

    async searchDrama(search) {
        try {
            const res = await this.request(`search/text`, "POST", { search });
            const result = res.result || [];
            
            return {
                status: 200,
                total: result.length,
                data: result.map(item => ({
                    id: item.id,
                    name: item.name,
                    poster: item.poster,
                    genres: item.genres ? item.genres.map(g => g.displayName) : []
                })),
            };
        } catch (err) {
            throw new Error(err.message);
        }
    }

    async getEpisode(dramaId, eps) {
        try {
            const dramaData = await this.getDrama(dramaId);
            const episode = dramaData.episodes.find(e => e.episodeNumber === parseInt(eps));
            
            if (!episode) throw new Error("Episode not found");

            return {
                status: 200,
                drama_title: dramaData.data.name,
                data: episode
            };
        } catch (err) {
            throw new Error(err.message);
        }
    }
}

const dramaDashRouter = express.Router();
const dramaDashService = new DramaDash();

// 1. Home
dramaDashRouter.get('/home', async (req, res) => {
    try {
        const result = await dramaDashService.getHome();
        res.json({ ...result });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 2. Search
dramaDashRouter.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: "error", message: "Query 'q' is required" });
    try {
        const result = await dramaDashService.searchDrama(q);
        res.json({ ...result });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 3. Detail
dramaDashRouter.get('/detail/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dramaDashService.getDrama(id);
        res.json({ ...result });
    } catch (e) {
        res.status(500).json({ status: "error", message: e.message });
    }
});

// 4. Watch Episode
dramaDashRouter.get('/watch', async (req, res) => {
    const { id, e } = req.query; 
    if (!id || !e) return res.status(400).json({ status: "error", message: "Query 'id' and 'e' (episode) are required" });
    try {
        const result = await dramaDashService.getEpisode(id, e);
        res.json({ ...result });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 5. Refresh Token (GET & POST)
const handleDramaDashRefresh = async (req, res) => {
        try {
        dramaDashService.deviceToken = null;
        dramaDashService.deviceId = dramaDashService.generateDeviceId();
        dramaDashService.fakeIp = generateRandomIP(); 
        const newToken = await dramaDashService.getToken();
            
        res.json({
            creator: "Sanka Vollerei",
            status: "success",
            message: "DramaDash Identity & Token Refreshed",
            data: {
                new_token: newToken,
                new_device_id: dramaDashService.deviceId,
                new_fake_ip: dramaDashService.fakeIp
            }
         });
    } catch (err) {
        res.status(500).json({ 
            creator: "Sanka Vollerei", 
            status: "error", 
            message: "Gagal refresh token", 
            error: err.message 
        });
    }
};

dramaDashRouter.get('/refresh-token', handleDramaDashRefresh);
dramaDashRouter.post('/refresh-token', handleDramaDashRefresh);

export default dramaDashRouter;