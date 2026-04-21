import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import https from 'https';

class CryptoUtil {
  constructor() {
    this.publicKeyPem = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2poXMstZ8NCWE7915MXzDWC5/t+oB2waGfskPqSZwLqxd4ZBR0H1cb1tAZRZcV7P+LmOd6SYNxhnELaWuKTD+D3xkz8Tt1L5j/ynGqVt1MDbiQIEzXQKUkNDSH6T0A+Xzo/67/8QOQXlVJfW06resbaeNvibfx6Qc78j96bCIPlxPrtieilVTBHUFOXjirxK/ki/mO8P2smRbpt73fsQWdGmTGMfYGvfPApGyxbxLkL/qrBjU25XpM8a0MBqzFWUAchHmqSBJ6Mbfam1SSgf3b2U28s67nOW+JiOrhd6iVLcsLFxXA54HX+Zbej3AbOB6jKaEmp/bz1amneE1NYXwwIDAQAB';
    this.privateKeyPem = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCK0Tl1pd7bjTRU93bWoHW1hLCDj2+9bg1MgY8j5C7xXaw6bJfToXhWbH1fXNbnFFVqxyYNErcuOUwJZxyDgcxUXM4yWnRseb2GF97GOicAQ2keDzVYmwky4lrSRwvcXutJRLPUCRQNfc6upfk2G5TKh6/CcP4TV1eXTF7+vdEw2SHxAOITKbSfcaZXr/hVs6a1aRHsBF+7RG99ebwZIP6/AgIyqX9RbDVN6ixi1v2G3/bwAULHLSqGdSaqij/ca17fbFGITaeCeEaZ6d/P4ZuOK+PEPdbPQt6SbY4lZaYwRvdrpH73kigPITgDzIDONFybJ1m7wRKlq1wxWHwbimptAgMBAAECggEAPz3cYJXFtt5YphDrahJGLgEabYVOUc2ub1li/eX54OpdCWzpqneYnD7myyg/m5zu4SuDUVdibsOZuXrpSZw7m3+ATP5apgS8bDe5vTNHC16qqBAjrI9NHIp09/F4HNh9dq6/Am10XkUfgP+KTrU4DyDL2NijV+pltD8N1B5kDE1igokVcsavhnu2INoMRXYE78Wq6urNECuFWw9hldv81M9m2w56t1CQOUukpo4mfmLjZRe2s+kwtcBVefGHP8Cj0OeH2dGltjl2YSQMRBFUCVoixYpOrcjIHoqzWri8IfUZ2tW+nUvHl5IZ9RVxefnFaLGnxiXd2sk6Sn4aD/l9YQKBgQDVv3HaOZxHRqlNSPrNGqplGhE066HnDsq6MlPukiovxE43CRBmpTnk9zDCqrDh9t2HbJuao7nSq5WlBERWgwqXU/qDpH43W7Y/lJfHkDv6A2m0viJa0a9x8+CJpNnCDu1ATo4/IQKwoXYice6JKnUyXgkGKn+HipiN6tO0EtWHlQKBgQCmQfklKFtXtm/FZ6NIMs+d+EyvaE5xNLKGYQxmiCR10WGYd8ZV+K0Q6qXHS+a32TirWB9F3TqPOklTytMrfPZB3BCXj4weEldb8W716G8FYf7LLhaT+MdpF7KDcruObwoQAvKV3N4eX6tUEMmdrx9hpCmmIU5EeXUkhGdmwk7BeQKBgAIXMkThJV8pGMTRvuo8pYgBnkN3PoklAuSZU2rU8Sawc9dj9k4atZtAs7BjvQEoyffmHwt/KHUgCoGnrgdulq7uOlgJRtbBxeGPUYC5L2z9lY4YAfwDawThTsPp4dtdDAMCAbAqYX1axu4FUUD0MltAwjPWPJMVzvIsZs+vE3mVAoGAJPja3OaCmZjadj2709xoyypic0dw2j/ry3JdfZec9A5h87P/CTNJ2U81GoLIhe3qakAohDLUSPGfSOD74NnjMXYswmeLs0xE3Q9tq4XK2pmWPby8DJ/wSHCapByplN0gkbr2E1mQk5SW1xT8oPJGukH1eRpC+3s/D6XaEMH5HZECgYEAigoX5l39LDsCgeaUcI4S9grkaas/WsKv37eqo3oD9Qk6VFiMM5L5Zig6aXJxuAPLVjb38caJRPmPmOXLT2kEP1E1h6OJOhEhETwVIUtcBzsK25ju9LqL89bC+W0uS7BPvk6Tcws/tXHCkQCTgb9jVXceZ2ox+6axvlW/5WgHt5Q=';
  }

  formatPem(key, type) {
    if (/-----BEGIN/.test(key)) return key;
    const b64 = key.replace(/[^A-Za-z0-9+/=]/g, '');
    const chunks = b64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${chunks.join('\n')}\n-----END ${type}-----`;
  }

  rsaEncrypt(plain) {
    try {
      const pem = this.formatPem(this.publicKeyPem, 'PUBLIC KEY');
      const buffer = Buffer.isBuffer(plain) ? plain : Buffer.from(plain, 'utf8');
      const encrypted = crypto.publicEncrypt({
        key: pem,
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, buffer);
      return encrypted.toString('base64');
    } catch (e) {
      throw e;
    }
  }

  rsaDecrypt(ciphertext) {
    try {
      const pem = this.formatPem(this.privateKeyPem, 'PRIVATE KEY');
      const buffer = Buffer.from(ciphertext, 'base64');
      const decrypted = crypto.privateDecrypt({
        key: pem,
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, buffer);
      return decrypted;
    } catch (e) {
      throw e;
    }
  }

  normalizeKey(key) {
    const buf = Buffer.isBuffer(key) ? key : Buffer.from(key);
    return buf.length === 32 ? buf : crypto.createHash('sha256').update(buf).digest();
  }

  addPKCS5Padding(data, blockSize = 16) {
    const padding = blockSize - (data.length % blockSize);
    const paddedData = Buffer.alloc(data.length + padding);
    data.copy(paddedData);
    paddedData.fill(padding, data.length);
    return paddedData;
  }

  removePKCS5Padding(data) {
    if (data.length === 0) return data;
    const paddingLength = data[data.length - 1];
    if (paddingLength < 1 || paddingLength > 16) return data;
    return data.subarray(0, data.length - paddingLength);
  }

  aesEncrypt(plain, key) {
    try {
      key = this.normalizeKey(key);
      const data = Buffer.isBuffer(plain) ? plain : Buffer.from(String(plain), 'utf8');
      const paddedData = this.addPKCS5Padding(data);
      const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
      cipher.setAutoPadding(false);
      const encrypted = Buffer.concat([cipher.update(paddedData), cipher.final()]);
      return encrypted.toString('base64');
    } catch (e) {
      return null;
    }
  }

  aesDecrypt(ciphertext, key) {
    try {
      key = this.normalizeKey(key);
      const encryptedData = Buffer.from(ciphertext, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
      decipher.setAutoPadding(false);
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      return this.removePKCS5Padding(decrypted);
    } catch (e) {
      return Buffer.from("{}");
    }
  }
}

class NetShort {
  constructor(lang = "id_ID") {
    this.cryptoUtil = new CryptoUtil();
    this.lang = lang;
    this.baseUrl = "https://appsecapi.netshort.com";
    this.tokenCache = null;
    this.TOKEN_LIFESPAN = 60 * 60 * 1000;
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Referer: "https://netshort.com",
        "Accept-Encoding": "gzip",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; SM-G991B Build/SP1A.210812.016)",
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false
      }),
      timeout: 60000,
    });
  }

  _generateRandomIP() {
    return [114, Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 254) + 1].join(".");
  }

  _generateDeviceCode() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from(crypto.randomBytes(32), (b) => chars[b % chars.length]).join("").toLowerCase();
  }

  _buildHeaders(deviceCode, encryptKey, token = "") {
    const ip = this._generateRandomIP();
    return {
      Authorization: `Bearer ${token}`,
      "X-Forwarded-For": ip,
      "X-Real-IP": ip,
      canary: "v2",
      os: token ? "1" : "0",
      "Device-Code": deviceCode,
      "encrypt-key": encryptKey,
      push_switch: "true",
      start_type: token ? "cold" : "warm",
      version: "1.9.2",
      timestamp: Date.now().toString(),
      "content-language": this.lang,
      network: token ? "other,cold,true" : "wifi,warm,true",
    };
  }

  _isTokenValid(tokenData) {
    return tokenData?.success && tokenData?.token && Date.now() < tokenData.expiresAt;
  }

  async _request(endpoint, method = "POST", data = {}, headers = {}) {
    try {
      const response = await this.http.request({
        url: endpoint,
        method,
        headers,
        data
      });
      return {
        status: response.status,
        headers: response.headers,
        data: response.data
      };
    } catch (error) {
      if (error.response) return {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      };
      throw error;
    }
  }

  async _decryptResponse(response) {
    const encKeyHeader = response.headers["encrypt-key"];
    if (!encKeyHeader) throw new Error("Missing encrypt-key in response");
    const decryptedKey = this.cryptoUtil.rsaDecrypt(encKeyHeader).toString("utf8");
    const aesKey = Buffer.from(decryptedKey, "base64").toString("utf8");
    const decryptedBuffer = this.cryptoUtil.aesDecrypt(response.data, aesKey);
    return JSON.parse(decryptedBuffer.toString("utf8"));
  }

  async login(deviceCode) {
    const deviceBase64 = Buffer.from(deviceCode, "utf8").toString("base64");
    const encryptKey = this.cryptoUtil.rsaEncrypt(deviceBase64);
    const headers = this._buildHeaders(deviceCode, encryptKey);
    const payload = {
      os: "Android",
      osVer: "12",
      appVer: "1.9.2",
      identity: 0,
      model: "SM-G991B",
      deviceCode,
      source: "visitor"
    };
    const encryptedBody = this.cryptoUtil.aesEncrypt(JSON.stringify(payload), deviceCode);
    const response = await this._request("/prod-app-api/auth/login", "POST", encryptedBody, headers);
    if (response.status !== 200) throw new Error(`Login Failed: ${response.status}`);
    const encKeyHeader = response.headers["encrypt-key"];
    const decryptedKey = this.cryptoUtil.rsaDecrypt(encKeyHeader).toString("utf8");
    const responseKey = Buffer.from(decryptedKey, "base64").toString("utf8");
    const decryptedBuffer = this.cryptoUtil.aesDecrypt(response.data, responseKey);
    return JSON.parse(decryptedBuffer.toString("utf8"));
  }

  async generateToken() {
    const deviceCode = this._generateDeviceCode();
    try {
      const parsedData = await this.login(deviceCode);
      return {
        success: true,
        deviceCode,
        token: parsedData.data?.token || null,
        loginUser: parsedData.data?.loginUser || null,
        data: parsedData
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        deviceCode
      };
    }
  }

  async getValidTokenData() {
    if (this._isTokenValid(this.tokenCache)) return this.tokenCache;
    const newTokenData = await this.generateToken();
    if (newTokenData.success) {
      newTokenData.expiresAt = Date.now() + this.TOKEN_LIFESPAN;
      this.tokenCache = newTokenData;
    } else {
      this.tokenCache = null;
    }
    return newTokenData;
  }

  async apiRequest(endpoint, body, tokenData) {
    try {
      if (!tokenData.success || !tokenData.token) throw new Error("Invalid Token Data");
      const deviceBase64 = Buffer.from(tokenData.deviceCode, "utf8").toString("base64");
      const encryptKey = this.cryptoUtil.rsaEncrypt(deviceBase64);
      const headers = this._buildHeaders(tokenData.deviceCode, encryptKey, tokenData.token);
      const encryptedBody = this.cryptoUtil.aesEncrypt(JSON.stringify(body), tokenData.deviceCode);
      const response = await this._request(endpoint, "POST", encryptedBody, headers);
      if (response.status !== 200) {
        if ([401, 403].includes(response.status)) this.tokenCache = null;
        return {
          success: false,
          error: `HTTP Error ${response.status}`
        };
      }
      const decrypted = await this._decryptResponse(response);
      return {
        success: true,
        data: decrypted
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  async getHome(offset = 0, limit = 10) {
    const tokenData = await this.getValidTokenData();
    if (!tokenData.success) return {
      isEnd: true,
      next: 0,
      result: []
    };
    const res = await this.apiRequest("/prod-app-api/video/shortPlay/tab/load_all_group_tabId", {
      offset,
      limit
    }, tokenData);
    if (res.success && res.data?.data?.contentInfos) {
      const result = res.data.data.contentInfos.map((c) => ({
        id: c.shortPlayId,
        name: c.shortPlayName.replace(/\s+/g, "-"),
        cover: c.shortPlayCover
      }));
      return {
        isEnd: res.data.data.completed,
        next: res.data.data.maxOffset,
        result
      };
    }
    return {
      isEnd: true,
      next: 0,
      result: []
    };
  }

  async getDrama(shortPlayId, quality = "540p") {
    const tokenData = await this.getValidTokenData();
    if (!tokenData.success) return {
      error: "Token failed"
    };
    const body = {
      codec: "h264",
      shortPlayId,
      isRequestReserve: false,
      playClarity: quality
    };
    const res = await this.apiRequest("/prod-app-api/video/shortPlay/base/detail_info", body, tokenData);
    if (!res.success || !res.data?.data) return {
      error: "Failed to fetch drama info"
    };
    const data = res.data.data;
    const episodes = (data.shortPlayEpisodeInfos || []).map((ep) => ({
      id: ep.shortPlayId,
      episodeNo: ep.episodeNo,
      videoUrl: ep.playVoucher,
      isSubtitle: !!(ep.subtitleList && ep.subtitleList.length > 0),
      subtitle: ep.subtitleList?.find((sub) => sub.language_id === 23)?.url || null,
    }));
    const {
      shortPlayEpisodeInfos,
      ...dramaInfo
    } = data;
    return {
      name: dramaInfo.shortPlayName,
      result: episodes,
      dramaInfo
    };
  }

  async getDramaEpisode(shortPlayId, episodeNo = 1, requestedQuality = null) {
    const allQualities = ["1080p", "720p", "540p", "480p", "360p", "240p"];
    const targetQualities = requestedQuality ? [requestedQuality] : allQualities;
    const promises = targetQualities.map(async (quality) => {
      try {
        const data = await this.getDrama(shortPlayId, quality);
        if (data.error || !data.result) return null;
        const episode = data.result.find((ep) => ep.episodeNo === episodeNo);
        if (!episode || !episode.videoUrl) return null;
        return {
          quality,
          url: episode.videoUrl,
          subtitle: episode.subtitle,
          maxEps: data.dramaInfo?.totalEpisode || 0,
          dramaName: data.name,
          isSubtitle: episode.isSubtitle
        };
      } catch (e) {
        return null;
      }
    });
    const results = (await Promise.all(promises)).filter(r => r !== null);
    if (results.length === 0) {
      return {
        status: false,
        message: "Episode not found"
      };
    }
    const firstSuccess = results[0];
    const response = {
      status: true,
      dramaName: firstSuccess.dramaName,
      current: episodeNo,
      maxEps: firstSuccess.maxEps,
      isSubtitle: firstSuccess.isSubtitle,
      subtitle: firstSuccess.subtitle,
      videoUrl: requestedQuality ? firstSuccess.url : {}
    };
    if (!requestedQuality) {
      results.forEach(res => {
        response.videoUrl[res.quality] = res.url;
      });
    }
    return response;
  }

  async searchDrama(searchCode, pageNo = 1, pageSize = 20) {
    const tokenData = await this.getValidTokenData();
    if (!tokenData.success) return {
      success: false,
      message: "Token Error"
    };
    const body = {
      searchFlag: 0,
      pageNo,
      pageSize,
      searchCode
    };
    const res = await this.apiRequest("/prod-app-api/video/shortPlay/search/searchByKeyword", body, tokenData);
    return res.success ? res.data : res;
  }

  async getClassesPage(offset = 0, limit = 15) {
    const tokenData = await this.getValidTokenData();
    if (!tokenData.success) return {
      success: false
    };
    const res = await this.apiRequest("/prod-app-api/video/classes/page", {
      offset,
      limit
    }, tokenData);
    return res.success ? res.data : res;
  }

  async getClassesConstant() {
    const tokenData = await this.getValidTokenData();
    if (!tokenData.success) return {
      data: {
        region: [],
        audio: [],
        tag: []
      }
    };
    const res = await this.apiRequest("/prod-app-api/video/classes/constant", {}, tokenData);
    return res.success ? res.data : {
      data: {
        region: [],
        audio: [],
        tag: []
      }
    };
  }

  async getRegionList() {
    const res = await this.getClassesConstant();
    return {
      status: res?.data?.region ? 200 : 404,
      data: (res?.data?.region || []).map((i) => ({
        name: i.value,
        value: i.key
      }))
    };
  }

  async getAudioList() {
    const res = await this.getClassesConstant();
    return {
      status: res?.data?.audio ? 200 : 404,
      data: (res?.data?.audio || []).map((i) => ({
        name: i.value,
        value: i.key
      }))
    };
  }

  async getTagList() {
    const res = await this.getClassesConstant();
    return {
      status: res?.data?.tag ? 200 : 404,
      data: (res?.data?.tag || []).map((i) => ({
        name: i.labelName,
        value: i.labelLanguageId
      }))
    };
  }

  async getOrderModeList() {
    const res = await this.getClassesConstant();
    return {
      status: res?.data?.orderMode ? 200 : 404,
      data: (res?.data?.orderMode || []).map((i) => ({
        name: i.value,
        value: i.key
      }))
    };
  }

  async filterDrama(tagId, orderMode, regionKey = 0, audioKey = 2, offset = 0, limit = 15) {
    const tokenData = await this.getValidTokenData();
    if (!tokenData.success) return {
      success: false
    };
    const body = await this._buildFilterBody({
      regionKey,
      audioKey,
      tagId,
      offset,
      limit,
      orderMode
    });
    const res = await this.apiRequest("/prod-app-api/video/classes/page", body, tokenData);
    return res.success ? res.data : res;
  }

  async _buildFilterBody(params) {
    try {
      const constants = await this.getClassesConstant();
      if (!constants?.data) return {};
      const {
        regionKey = 0, audioKey = 0, tagId = "semua", offset = 0, limit = 15, orderMode = "1"
      } = params;
      const region = constants.data.region.find((r) => r.key === regionKey);
      const audio = constants.data.audio.find((a) => a.key === audioKey);
      const tag = constants.data.tag.find((t) => t.labelName.toLowerCase().includes(tagId.toLowerCase()));
      const body = {
        offset,
        orderMode,
        limit,
        tagIdList: tag && tagId !== "semua" ? [tag.labelLanguageId] : ["-1"]
      };

      if (tagId !== "semua") {
        body.filterValue = tag ? tag.labelLanguageId : ["-1"];
        body.filterType = "categories";
        if (audioKey !== 0) body.libraryTypeIdList = audio?.extList || [];
        if (regionKey !== 0) body.sourceLanguageList = region?.extList || [];
      } else if (audioKey !== 0) {
        body.libraryTypeIdList = audio?.extList || [];
        if (regionKey === 0) {
          body.filterValue = JSON.stringify(audio?.extList || []);
          body.filterType = "audio_categories";
        } else {
          body.filterValue = JSON.stringify(region?.extList || []);
          body.sourceLanguageList = region?.extList || [];
          body.filterType = "region";
        }
      } else {
        body.filterValue = regionKey === 0 ? "[]" : JSON.stringify(region?.extList || []);
        body.filterType = "region";
        if (regionKey !== 0) body.sourceLanguageList = region?.extList || [];
      }
      return body;
    } catch {
      return {};
    }
  }
}

const netShortRouter = express.Router();
const netShortService = new NetShort();

// 1. Auth Refresh
const authRefreshHandler = async (req, res, next) => {
  try {
    const result = await netShortService.generateToken();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
netShortRouter.get("/refresh-token", authRefreshHandler);
netShortRouter.post("/refresh-token", authRefreshHandler);

// 2. Meta Tags
netShortRouter.get("/config/tags", async (req, res) => {
  try {
    const result = await netShortService.getTagList();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 3. Meta Regions
netShortRouter.get("/config/regions", async (req, res) => {
  try {
    const result = await netShortService.getRegionList();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 4. Meta Audio
netShortRouter.get("/config/audio", async (req, res) => {
  try {
    const result = await netShortService.getAudioList();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 5. Meta Sort
netShortRouter.get("/config/sort", async (req, res, next) => {
  try {
    const result = await netShortService.getOrderModeList();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 6. Config Constants (Lengkap)
netShortRouter.get("/config/constants", async (req, res) => {
  try {
    const result = await netShortService.getClassesConstant();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      
      success: false,
      message: error.message
    });
  }
});

// 7. Search
netShortRouter.get("/search", async (req, res) => {
  try {
    const {
      q,
      page = 1,
      size = 20
    } = req.query;
    if (!q) return res.status(400).json({
      success: false,
      message: "Keyword (q) diperlukan"
    });
    const apiResponse = await netShortService.searchDrama(q, Number(page), Number(size));
    const resultData = apiResponse?.data?.searchCodeSearchResult || [];
    res.json({
      
      success: true,
      data: resultData
    });
  } catch (error) {
    res.status(500).json({
      
      success: false,
      message: error.message
    });
  }
});

// 8. Discover (Filter)
netShortRouter.get("/discover", async (req, res, next) => {
  try {
    const {
      tag,
      sort,
      region = 0,
      lang = 0,
      page = 1,
      limit = 15
    } = req.query;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;
    const result = await netShortService.filterDrama(
      tag || "semua",
      sort || "1",
      Number(region),
      Number(lang),
      skip,
      take
    );
    const finalData = result.data || result;
    res.json({
      success: true,
      meta: {
        page: Number(page),
        limit: take
      },
      data: finalData
    });
  } catch (error) {
    next(error);
  }
});

// 9. Explore / Home
netShortRouter.get("/explore", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10
    } = req.query;

    const limitNum = Number(limit);
    const offset = (Number(page) - 1) * limitNum;

    const result = await netShortService.getHome(offset, limitNum);
    res.json({
      success: true,
      meta: {
        page: Number(page),
        limit: limitNum
      },
      data: result
    });
  } catch (error) {
    res.status(500).json({
      
      success: false,
      message: error.message
    });
  }
});

// 10. Categories
netShortRouter.get("/categories", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15
    } = req.query;

    const limitNum = Number(limit);
    const offset = (Number(page) - 1) * limitNum;

    const result = await netShortService.getClassesPage(offset, limitNum);
    res.json({
      success: true,
      meta: {
        page: Number(page),
        limit: limitNum
      },
      data: result.data || result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 11. Watch Episode
netShortRouter.get("/watch/:shortPlayId/ep/:episodeNo", async (req, res) => {
  try {
    const {
      shortPlayId,
      episodeNo
    } = req.params;
    const {
      quality
    } = req.query;
    const result = await netShortService.getDramaEpisode(shortPlayId, Number(episodeNo), quality);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 12. Info Drama
netShortRouter.get("/detail/:shortPlayId", async (req, res) => {
  try {
    const {
      shortPlayId
    } = req.params;
    const {
      quality
    } = req.query;
    const result = await netShortService.getDrama(shortPlayId, quality || "540p");
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      
      success: false,
      message: error.message
    });
  }
});

export default netShortRouter;