import axios from 'axios';
import https from 'https';
import DramaboxUtil from '../utils.js';
import curlClient from './curlClient.js';

const episodeCache = new Map();

const androidHttpsAgent = new https.Agent({
  ciphers: [
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256",
    "ECDHE-ECDSA-AES128-GCM-SHA256",
    "ECDHE-RSA-AES128-GCM-SHA256"
  ].join(':'),
  honorCipherOrder: true,
  minVersion: 'TLSv1.2'
});

export default class Dramabox {
  util;
  baseUrl_Dramabox = 'https://sapi.dramaboxdb.com';
  webficUrl = 'https://www.webfic.com';
  tokenCache = null;
  http;
  lang;

  constructor(lang = 'in') {
    this.util = new DramaboxUtil();
    this.http = curlClient;
    this.lang = lang;
  }

  isTokenValid() {
    return this.tokenCache !== null;
  }

  _getLocalTime() {
    const now = new Date();
    const offset = 7 * 60 * 60 * 1000;
    const bangkokTime = new Date(now.getTime() + offset);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${bangkokTime.getUTCFullYear()}-${pad(bangkokTime.getUTCMonth() + 1)}-${pad(bangkokTime.getUTCDate())} ${pad(bangkokTime.getUTCHours())}:${pad(bangkokTime.getUTCMinutes())}:${pad(bangkokTime.getUTCSeconds())}.${bangkokTime.getUTCMilliseconds().toString().padStart(3, '0')} +0700`;
  }

  async generateNewToken(timestamp = Date.now(), retryCount = 0) {
    try {
      const spoffer = this.util.generateRandomIP();
      const deviceId = this.util.generateUUID();
      const androidId = this.util.randomAndroidId();
      const headers = {
        "tn": ``,
        "version": "561",
        "vn": "5.6.1",
        "cid": "DRA1000042",
        "package-name": "com.storymatrix.drama",
        "apn": "1",
        "device-id": deviceId,
        "language": this.lang,
        "current-language": this.lang,
        "p": "60",
        "time-zone": "+0700",
        "md": "Redmi Note 5",
        "ov": "10",
        "over-flow": "new-fly",
        "android-id": androidId,
        "X-Forwarded-For": spoffer,
        "X-Real-IP": spoffer,
        "mf": "XIAOMI",
        "brand": "Xiaomi",
        "content-type": "application/json; charset=UTF-8",
      };

      const body = JSON.stringify({
        distinctId: null
      });
      headers['sn'] = this.util.sign(`timestamp=${timestamp}${body}${deviceId}${androidId}`);
      const url = `${this.baseUrl_Dramabox}/drama-box/ap001/bootstrap?timestamp=${timestamp}`;
      const res = await curlClient.post(url, {
        distinctId: null
      }, {
        headers,
        timeout: 15000
      });
      if (!res.data?.data?.user) {
        if (retryCount < 5) {
          console.log(`[Token Gen] Data kosong. Retry ${retryCount + 1}/5...`);
          await new Promise(r => setTimeout(r, 2000));
          return await this.generateNewToken(Date.now(), retryCount + 1);
        }
        throw new Error("Gagal generate token: Data user tidak ditemukan.");
      }

      const creationTime = Date.now();
      const tokenData = {
        token: res.data.data.user.token,
        deviceId,
        androidId,
        spoffer,
        uuid: res.data.data.user.uid,
        attributionPubParam: res.data.data.attributionPubParam,
        timestamp: creationTime,
        expiry: creationTime + (24 * 60 * 60 * 1000)
      };

      this.tokenCache = tokenData;
      return tokenData;

    } catch (error) {
      const status = error.response?.status;
      if (status === 403) {
        console.log(`[Token Gen] Blocked (403). Tidak retry.`);
        throw new Error(`Token generation blocked (403): IP/header diblokir server.`);
      }
      if (retryCount < 5) {
        console.log(`[Token Gen Error] ${error.message}. Retry ${retryCount + 1}/5...`);
        await new Promise(r => setTimeout(r, 2000));
        return await this.generateNewToken(Date.now(), retryCount + 1);
      }
      throw new Error(`Token generation failed after 5 attempts: ${error.message}`);
    }
  }

  async getToken() {
    if (this.isTokenValid()) {
      return this.tokenCache;
    }
    return this.generateNewToken();
  }

  buildHeaders(tokenData, timestamp) {
    return {
      "mchid": "DRA1000042",
      "tz": "-420",
      "language": this.lang,
      "mcc": "510",
      "locale": `${this.lang}_ID`,
      "is_root": "1",
      "device-id": tokenData.deviceId,
      "nchid": "DRA1000042",
      "md": "Redmi Note 5",
      "store-source": "store_google",
      "mf": "XIAOMI",
      "local-time": this._getLocalTime(),
      "time-zone": "+0700",
      "brand": "Xiaomi",
      "apn": "1",
      "lat": "0",
      "is_emulator": "0",
      "current-language": this.lang,
      "ov": "10",
      "version": "561",
      "afid": Date.now() + "-" + Math.floor(Math.random() * 9999999999999999),
      "package-name": "com.storymatrix.drama",
      "android-id": tokenData.androidId,
      "srn": "1080x2160",
      "p": "60",
      "is_vpn": "1",
      "build": "Build/QQ3A.200805.001",
      "pline": "ANDROID",
      "vn": "5.6.1",
      "over-flow": "new-fly",
      "tn": `Bearer ${tokenData.token}`,
      "cid": "DRA1000042",
      "active-time": "1297",
      "content-type": "application/json; charset=UTF-8",
      "accept-encoding": "gzip",
      "user-agent": "okhttp/4.10.0",
      "Connection": "Keep-Alive"
    };
  }

  async request(endpoint, payload = {}, isWebfic = false, method = "POST", retryCount = 0) {
    const MAX_RETRIES = 5;
    try {
      const timestamp = Date.now();
      let url, headers, tokenData;
      if (isWebfic) {
        url = `${this.webficUrl}${endpoint}`;
        headers = {
          "Content-Type": "application/json",
          "pline": "DRAMABOX",
          "language": this.lang,
        };
      } else {
        tokenData = await this.getToken();
        const ts = Date.now();

        url = `${this.baseUrl_Dramabox}${endpoint}?timestamp=${ts}`;
        headers = this.buildHeaders(tokenData, ts);

        const body = JSON.stringify(payload);
        headers['sn'] = this.util.sign(`timestamp=${ts}${body}${tokenData.deviceId}${tokenData.androidId}${headers['tn']}`);
      }

      const config = {
        method: method.toUpperCase(),
        url,
        headers,
        timeout: 60000,
        httpsAgent: isWebfic ? undefined : androidHttpsAgent,
        data: method.toUpperCase() !== "GET" ? payload : undefined,
      };

      const response = await this.http.request(config);

      if (!isWebfic && response.data && response.data.success === false) {
        if (retryCount < MAX_RETRIES) {
          console.log(`[API Logic Error] Refreshing token...`);
          const oldTokenData = this.tokenCache;
          this.tokenCache = null;
          await this.generateNewToken(Date.now(), 0);
          return await this.request(endpoint, payload, isWebfic, method, retryCount + 1);
        }
      }

      return response.data;

    } catch (error) {
      const isServerOverload = error.response && (error.response.status === 502 || error.response.status === 503 || error.response.status === 504 || error.response.status === 500);
      const isNetworkError = !error.response;
      if (retryCount < MAX_RETRIES && (isServerOverload || isNetworkError)) {
        const statusMsg = error.response ? `HTTP ${error.response.status}` : error.message;
        console.log(`[Request Failed] ${statusMsg}. Retry ${retryCount + 1}/${MAX_RETRIES} in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (retryCount >= 2) {
          this.tokenCache = null;
          await this.generateNewToken(Date.now(), 0);
        }
        return await this.request(endpoint, payload, isWebfic, method, retryCount + 1);
      }
      if (error.response) {
        throw new Error(`HTTP ${error.response.status} Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getVip() {
    try {
      const payload = {
        homePageStyle: 0,
        isNeedRank: 1,
        index: 4,
        type: 0,
        channelId: 205
      };

      const data = await this.request("/drama-box/he001/theater", payload);
      return data;

    } catch (error) {
      console.error("Error fetching VIP (RAW):", error);
      return null;
    }
  }

  async getStreamUrl(bookId, episode) {
    if (!bookId || episode === undefined || episode === null) {
        throw new Error('Parameter bookId dan episode wajib diisi.');
    }
    const targetIndex = parseInt(episode, 10);
    const targetBookId = String(bookId);
    const cacheKey = `drama_book_${targetBookId}`;

    if (episodeCache.has(cacheKey)) {
        const cachedEpisodes = episodeCache.get(cacheKey);
        const cachedChapter = cachedEpisodes.find(c => c.chapterIndex == targetIndex);
        if (cachedChapter) {
            console.log(`[Cache] Hit! EP ${targetIndex} ditemukan.`);
            return this.formatStreamResult(targetBookId, cachedEpisodes.length, cachedChapter);
        }
    }

    let errors = { sansekai: null, internal: null };

    try {
        let allEpisodes = episodeCache.get(cacheKey);
        if (!allEpisodes || allEpisodes.length === 0) {
            const sansekaiUrl = `https://api.sansekai.my.id/api/dramabox/allepisode?bookId=${targetBookId}`;
            const response = await axios.get(sansekaiUrl);
            allEpisodes = response.data;
            if (Array.isArray(allEpisodes) && allEpisodes.length > 0) {
                episodeCache.set(cacheKey, allEpisodes);
            }
        }

        if (!Array.isArray(allEpisodes) || allEpisodes.length === 0) {
            throw new Error("Sansekai API returned empty.");
        }

        const matchedEp = allEpisodes.find(ep => ep.chapterIndex == targetIndex);
        if (!matchedEp) throw new Error(`Episode ${targetIndex} not found in Sansekai.`);

        return this.formatStreamResult(targetBookId, allEpisodes.length, matchedEp);

    } catch (err) {
        console.warn(`[Stream] Sansekai failed: ${err.message}. Switching to Fallback 4 (Internal)...`);
        errors.sansekai = err.message;
    }

    try {
        let currentCache = episodeCache.get(cacheKey) || [];
        let foundChapter = currentCache.find(c => c.chapterIndex == targetIndex);

        if (!foundChapter) {
            const sessionKey = "10942710-" + Date.now();
            let currentSearchIndex = targetIndex;
            const MAX_LOOPS = 5;

            for (let loop = 0; loop < MAX_LOOPS; loop++) {
                const response = await this.request("/drama-box/chapterv2/batch/load", {
                    boundaryIndex: 0,
                    comingPlaySectionId: -1,
                    index: currentSearchIndex,
                    currencyPlaySourceName: "首页发现_Untukmu_推荐列表",
                    rid: "",
                    enterReaderChapterIndex: 0,
                    loadDirection: 1,
                    startUpKey: sessionKey,
                    bookId: targetBookId,
                    currencyPlaySource: "discover_175_rec",
                    needEndRecommend: 0,
                    preLoad: false,
                    pullCid: ""
                });

                const newChapters = response?.data?.chapterList || [];
                if (newChapters.length === 0) break;

                const normalizedChapters = newChapters.map(ch => ({
                    chapterId: ch.chapterId,
                    chapterIndex: ch.chapterIndex,
                    chapterName: ch.chapterName,
                    viewingDuration: ch.duration,
                    chapterImg: ch.chapterImg || ch.cover || ch.coverWap,
                    cdnList: ch.cdnList
                }));

                const mergedMap = new Map(currentCache.map(i => [i.chapterIndex, i]));
                normalizedChapters.forEach(i => mergedMap.set(i.chapterIndex, i));
                currentCache = Array.from(mergedMap.values()).sort((a, b) => a.chapterIndex - b.chapterIndex);
                episodeCache.set(cacheKey, currentCache);

                foundChapter = normalizedChapters.find(c => c.chapterIndex == targetIndex);
                if (foundChapter) break;

                const lastIdx = newChapters[newChapters.length - 1].chapterIndex;
                if (lastIdx < targetIndex) currentSearchIndex = lastIdx + 1;
                else break;

                await new Promise(r => setTimeout(r, 500));
            }
        }

        if (foundChapter) {
            return this.formatStreamResult(targetBookId, currentCache.length, foundChapter);
        }

        throw new Error(`Episode ${targetIndex} not found in internal batch.`);

    } catch (err) {
        errors.internal = err.message;
    }

      throw new Error(
          `Gagal mengambil stream dari semua sumber.\n` +
          `Sansekai: ${errors.sansekai} | ` +
          `Internal: ${errors.internal}`
      );
  }

  formatStreamResult(bookId, totalEpisodes, chapter) {
    const cdn = chapter?.cdnList?.find(c => c.isDefault === 1) || chapter?.cdnList?.[0] || {};
    const paths = cdn?.videoPathList || [];
    const wrapProxy = (u) => u ? `/api/video/proxy?url=${encodeURIComponent(u)}` : null;
    const qualities = paths
      .map(v => ({
        resolution: v.quality ? `${v.quality}p` : 'Unknown',
        quality: v.quality || 0,
        url: wrapProxy(v.videoPath),
        direct: v.videoPath,
        isDefault: v.isDefault === 1,
      }))
      .filter(q => q.direct)
      .sort((a, b) => b.quality - a.quality);

    const chosen = qualities.find(q => q.isDefault) || qualities[0] || {};
    const direct = chosen.direct || cdn?.videoPath || null;
    const proxied = wrapProxy(direct);
    const m3u8 = direct && /\.m3u8(\?|$)/i.test(direct) ? proxied : null;
    const mp4 = direct && /\.mp4(\?|$)/i.test(direct) ? proxied : (!m3u8 ? proxied : null);

    return {
      status: 'success',
      data: {
        bookId,
        totalEpisodes,
        chapter: {
          chapterId: chapter?.chapterId,
          chapterIndex: chapter?.chapterIndex,
          chapterName: chapter?.chapterName,
          duration: chapter?.viewingDuration || chapter?.duration || 0,
          cover: chapter?.chapterImg || chapter?.cover || chapter?.coverWap || '',
          qualities,
          video: { m3u8, mp4, url: proxied, direct },
          m3u8Url: m3u8,
          mp4: mp4,
        },
      },
    };
  }

  async getDramaDetail(bookId, needRecommend = false, from = "book_album") {
    if (!bookId) {
      throw new Error("bookId is required!");
    }

    return await this.request("/drama-box/chapterv2/detail", {
      needRecommend,
      from,
      bookId
    });
  }

  async getDramaDetailV2(bookId, needRecommend = true, from = "book_album") {
    if (!bookId) throw new Error("bookId is required!");
    const metaPromise = this.request("/drama-box/chapterv2/batch/load", {
      boundaryIndex: 0,
      comingPlaySectionId: -1,
      index: 0,
      currencyPlaySourceName: "首页发现_Untukmu_推荐列表",
      rid: "",
      enterReaderChapterIndex: 0,
      loadDirection: 1,
      bookId: String(bookId),
      currencyPlaySource: "discover_175_rec",
      needEndRecommend: 0,
      preLoad: false,
      pullCid: ""
    });

    const listPromise = this.request("/drama-box/chapterv2/detail", {
      needRecommend,
      from,
      bookId: String(bookId)
    });

    const [metaRes, listRes] = await Promise.all([metaPromise, listPromise]);
    const bookMeta = metaRes?.data || {};
    const detailData = listRes?.data || {};
    const fullChapterList = detailData.list || [];
    const finalCover = bookMeta.bookCover || bookMeta.coverWap || bookMeta.cover || "";
    let formattedViews = bookMeta.playCount || "0";
    let rawLikes = bookMeta.inLibraryCount || 0;
    let formattedLikes = rawLikes.toString();
    if (rawLikes >= 1000000) formattedLikes = (rawLikes / 1000000).toFixed(1) + 'M';
    else if (rawLikes >= 1000) formattedLikes = (rawLikes / 1000).toFixed(1) + 'K';
    const castList = bookMeta.performers?.map(p => p.performerName).join(', ') || "-";
    const genreList = bookMeta.tags?.join(', ') || "Drama";
    const rawRecommendations = detailData.recommendList || detailData.recommendBookList || [];
    const metaChaptersMap = new Map();
    if (bookMeta.chapterList) {
      bookMeta.chapterList.forEach(ch => {
        metaChaptersMap.set(ch.chapterIndex, ch.chapterImg || ch.cover);
      });
    }
    const episodes = fullChapterList.map(ch => {
      const thumb = metaChaptersMap.get(ch.chapterIndex) || finalCover;

      return {
        episode_index: ch.chapterIndex,
        episode_label: `EP ${ch.chapterIndex + 1}`,
        duration: "0s",
        thumbnail: thumb
      };
    });

    const recommendations = rawRecommendations.map(rec => ({
      bookId: String(rec.bookId),
      judul: rec.bookName,
      cover: rec.coverWap || rec.cover || "",
      total_episode: rec.chapterCount || 0,
      rating: rec.score || "N/A"
    }));

    return {
      bookId: String(bookId),
      judul: bookMeta.bookName || "Unknown Title",
      deskripsi: bookMeta.introduction || "",
      cover: finalCover,
      genre: genreList,
      cast: castList,
      views: `${formattedViews} Tayangan`,
      total_episode: `${bookMeta.chapterCount || fullChapterList.length} Episode`,
      likes: `${formattedLikes} Pengikut`,
      jumlah_episode_tersedia: fullChapterList.length,
      episodes: episodes,
      recommendations: recommendations
    };
  }

  async getChapters(bookId) {
    const detailRes = await this.request("/drama-box/chapterv2/detail", {
      needRecommend: false,
      from: "book_album",
      bookId: String(bookId)
    });
    const fullList = detailRes?.data?.list || [];

    let thumbMap = new Map();
    try {
      const metaRes = await this.request("/drama-box/chapterv2/batch/load", {
        boundaryIndex: 0,
        comingPlaySectionId: -1,
        index: 0,
        currencyPlaySourceName: "",
        rid: "",
        enterReaderChapterIndex: 0,
        loadDirection: 1,
        bookId: String(bookId),
        currencyPlaySource: "discover_175_rec",
        needEndRecommend: 0,
        preLoad: false,
        pullCid: ""
      });
      (metaRes?.data?.chapterList || []).forEach(ch => {
        thumbMap.set(ch.chapterIndex, { cdnList: ch.cdnList, cover: ch.chapterImg || ch.cover });
      });
    } catch {}

    return fullList.map(ch => {
      const meta = thumbMap.get(ch.chapterIndex) || {};
      return {
        chapterId: ch.chapterId,
        chapterIndex: ch.chapterIndex,
        chapterName: ch.chapterName || `EP ${ch.chapterIndex + 1}`,
        isLocked: ch.unlockStatus ? ch.unlockStatus !== 1 : (ch.isLocked || false),
        isVip: !!ch.vipEpisode || !!ch.needVip || !!ch.vip,
        duration: ch.duration || 0,
        cover: meta.cover || ch.chapterImg || ch.coverWap || "",
        cdnList: meta.cdnList,
      };
    });
  }

  async foryou(pageNo = 1, pageSize = 15) {
    const typeList = [
      { type: 1, value: "" },
      { type: 2, value: "" },
      { type: 3, value: "" },
      { type: 4, value: "" },
      { type: 5, value: "1" }
    ];

    const data = await this.request("/drama-box/home/classify", {
      pageSize: pageSize.toString(),
      typeList: typeList,
      pageNo: pageNo.toString(),
      showLabels: false
    });
    const records = data?.data?.classifyBookList?.records || [];
    const isMore = (data?.data?.classifyBookList?.isMore || 0) === 1;
    const outList = records.map(r => ({
      bookId: String(r.bookId),
      bookName: r.bookName || '',
      introduction: r.introduction || '',
      cover: r.coverWap || r.cover || '',
      chapterCount: r.chapterCount || 0,
      playCount: r.playCount || '',
      corner: r.corner || null
    }));

    return { isMore, list: outList };
  }

  async batchDownload(bookId) {
    let savedPayChapterNum = 0;
    let result = [];
    let totalChapters = 0;
    let bookCover = "";
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    console.log(`\n==================================================`);
    console.log(`🚀 Memulai scraping untuk Book ID: ${bookId}`);
    console.log(`==================================================`);

    const fetchBatch = async (index, bId, isRetry = false) => {
      try {
        if (process && process.stdout) {
          process.stdout.write(`📥 Fetching Index: ${index}... `);
        } else {
          console.log(`📥 Fetching Index: ${index}... `);
        }

        const data = await this.request("/drama-box/chapterv2/batch/load", {
          boundaryIndex: 0,
          comingPlaySectionId: -1,
          index: index,
          currencyPlaySourceName: "首页发现_Untukmu_推荐列表",
          rid: "",
          enterReaderChapterIndex: 0,
          loadDirection: 1,
          startUpKey: "10942710-5e9e-48f2-8927-7c387e6f5fac",
          bookId: bId,
          currencyPlaySource: "discover_175_rec",
          needEndRecommend: 0,
          preLoad: false,
          pullCid: ""
        });

        const chapters = data?.data?.chapterList || [];
        const isEndOfBook = (index + 5) >= totalChapters && totalChapters !== 0;

        if (chapters.length <= 2 && index !== savedPayChapterNum && !isRetry && !isEndOfBook) {
          console.log(`⚠️ Data terbatas (${chapters.length}). Memicu Refresh Token...`);
          throw new Error("TriggerRetry: Data suspected limited");
        }

        if (chapters.length === 0 && index !== savedPayChapterNum) {
          throw new Error("Soft Error: Data kosong");
        }

        console.log(`✅ Success (${chapters.length} items)`);
        return data;
      } catch (error) {
        if (!isRetry) {
          console.log(`\n🔄 [RETRY] Menyegarkan sesi untuk Index ${index}...`);
          this.tokenCache = null;
          await this.generateNewToken(Date.now());

          if (savedPayChapterNum > 0 && index !== savedPayChapterNum) {
            await fetchBatch(savedPayChapterNum, bId, true).catch(() => { });
            await delay(1500);
          }
          await delay(2000);
          return fetchBatch(index, bId, true);
        }
        return null;
      }
    };

    try {
      const firstBatchData = await fetchBatch(1, bookId);

      if (firstBatchData?.data) {
        totalChapters = firstBatchData.data.chapterCount || 0;
        const bookName = firstBatchData.data.bookName;
        savedPayChapterNum = firstBatchData.data.payChapterNum || 0;

        bookCover = firstBatchData.data.cover || firstBatchData.data.bookCover || firstBatchData.data.coverWap || "";

        console.log(`📖 Judul: ${bookName} | Total Eps: ${totalChapters}`);
        if (firstBatchData.data.chapterList) result.push(...firstBatchData.data.chapterList);

        let currentIdx = 6;
        let retryLoopCount = 0;

        while (currentIdx <= totalChapters) {
          const batchData = await fetchBatch(currentIdx, bookId);
          const items = batchData?.data?.chapterList || [];

          if (items.length > 0) {
            result.push(...items);
            currentIdx += 5;
            retryLoopCount = 0;
          } else {
            retryLoopCount++;
            if (retryLoopCount >= 3) {
              currentIdx += 5;
              retryLoopCount = 0;
            } else {
              await delay(4000);
            }
          }
          await delay(800);
        }
      }

      const uniqueMap = new Map();
      result.forEach(item => uniqueMap.set(item.chapterId, item));
      const finalResult = Array.from(uniqueMap.values())
        .sort((a, b) => (a.chapterIndex || 0) - (b.chapterIndex || 0))
        .map(ch => {
          let cdn = ch.cdnList?.find(c => c.isDefault === 1) || ch.cdnList?.[0];
          let qualities = [];
          if (cdn?.videoPathList) {
            qualities = cdn.videoPathList.map(v => ({
              resolution: `${v.quality}p`,
              quality: v.quality,
              url: v.videoPath,
              isDefault: v.isDefault === 1
            }));
            qualities.sort((a, b) => b.quality - a.quality);
          } else {
            if (cdn?.videoPath) {
              qualities.push({
                resolution: "Unknown",
                quality: 0,
                url: cdn.videoPath,
                isDefault: true
              });
            }
          }

          let finalCover = ch.chapterImg || ch.cover || ch.coverWap || bookCover || "";
          let idxCode = ch.indexCode || String(ch.chapterIndex).padStart(3, '0');
          return {
            chapterId: ch.chapterId,
            indexCode: idxCode,
            chapterIndex: ch.chapterIndex,
            chapterName: ch.chapterName,
            duration: ch.duration || 0,
            cover: finalCover,
            qualities: qualities
          };
        });

      console.log(`\n==================================================`);
      console.log(`✅ SELESAI. Output Bersih: ${finalResult.length} Episode`);
      console.log(`==================================================\n`);
      return finalResult;
    } catch (error) {
      console.error("Critical Error dalam batchDownload:", error);
      return [];
    }
  }

  async getDramaList(pageNo = 1, pageSize = 10) {
    const data = await this.request(
      "/drama-box/he001/classify",
      {
        typeList: (pageNo == 1)
          ? []
          : [
            { type: 1, value: "" },
            { type: 2, value: "" },
            { type: 3, value: "" },
            { type: 4, value: "" },
            { type: 5, value: "" }
          ],
        showLabels: false,
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString()
      },
      false,
      "POST"
    );

    const rawList = data?.data?.classifyBookList?.records || [];
    const isMore = data?.data?.classifyBookList?.isMore || 0;

    const list = rawList.flatMap(item => {
      if (item.cardType === 3 && item.tagCardVo?.tagBooks) {
        return item.tagCardVo.tagBooks;
      }
      return [item];
    });

    const uniqueList = list.filter(
      (v, i, arr) => arr.findIndex(b => b.bookId === v.bookId) === i
    );

    const result = uniqueList.map(book => ({
      id: book.bookId,
      name: book.bookName,
      cover: book.coverWap,
      chapterCount: book.chapterCount,
      introduction: book.introduction,
      tags: book.tagV3s,
      playCount: book.playCount,
      cornerName: book.corner?.name || null,
      cornerColor: book.corner?.color || null
    }));

    return { isMore: isMore == 1, book: result };
  }

  async getDramaDub(pageNo = 1, pageSize = 10) {
    const typeList = [
      { type: 1, value: "" },
      { type: 2, value: "1" },
      { type: 3, value: "" },
      { type: 4, value: "" },
      { type: 5, value: "2" }
    ];

    const data = await this.request(
      "/drama-box/he001/classify",
      {
        typeList: typeList,
        showLabels: false,
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString()
      },
      false,
      "POST"
    );

    const rawList = data?.data?.classifyBookList?.records || [];
    const isMore = data?.data?.classifyBookList?.isMore || 0;

    const list = rawList.flatMap(item => {
      if (item.cardType === 3 && item.tagCardVo?.tagBooks) {
        return item.tagCardVo.tagBooks;
      }
      return [item];
    });

    const uniqueList = list.filter(
      (v, i, arr) => arr.findIndex(b => b.bookId === v.bookId) === i
    );

    const result = uniqueList.map(book => ({
      id: book.bookId,
      name: book.bookName,
      cover: book.coverWap,
      chapterCount: book.chapterCount,
      introduction: book.introduction,
      tags: book.tagV3s,
      playCount: book.playCount,
      cornerName: book.corner?.name || null,
      cornerColor: book.corner?.color || null
    }));

    return { isMore: isMore == 1, book: result };
  }

  async getDramaCustom(pageNo = 1, pageSize = 10, options = {}) {
    const {
      region = "",
      format = "",
      status = "",
      genre = "",
      sort = "1"
    } = options;

    const typeList = [
      { type: 1, value: region },
      { type: 2, value: format },
      { type: 3, value: status },
      { type: 4, value: genre },
      { type: 5, value: sort }
    ];

    const data = await this.request(
      "/drama-box/he001/classify",
      {
        typeList: typeList,
        showLabels: false,
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString()
      },
      false,
      "POST"
    );

    const rawList = data?.data?.classifyBookList?.records || [];
    const isMore = data?.data?.classifyBookList?.isMore || 0;

    const list = rawList.flatMap(item => {
      if (item.cardType === 3 && item.tagCardVo?.tagBooks) {
        return item.tagCardVo.tagBooks;
      }
      return [item];
    });

    const uniqueList = list.filter(
      (v, i, arr) => arr.findIndex(b => b.bookId === v.bookId) === i
    );

    const result = uniqueList.map(book => ({
      id: book.bookId,
      name: book.bookName,
      cover: book.coverWap || book.cover,
      chapterCount: book.chapterCount,
      introduction: book.introduction,
      tags: book.tagV3s,
      playCount: book.playCount,
      cornerName: book.corner?.name || null,
      cornerColor: book.corner?.color || null
    }));

    return { isMore: isMore == 1, book: result };
  }

  async getLatest(pageNo = 1) {
    const payload = {
      newChannelStyle: 1,
      isNeedRank: 1,
      pageNo: pageNo,
      index: 1,
      channelId: 43
    };

    const data = await this.request("/drama-box/he001/theater", payload);
    const records = data?.data?.newTheaterList?.records || [];
    return records.map(item => ({
      bookId: String(item.bookId),
      bookName: item.bookName,
      cover: item.coverWap || item.cover,
      introduction: item.introduction,
      score: item.score,
      chapterCount: item.chapterCount,
      playCount: item.playCount
    }));
  }

  async getDramaPopular(pageNo = 1, pageSize = 10) {
    const data = await this.request(
      "/drama-box/he001/classify",
      {
        typeList: (pageNo == 1)
          ? []
          : [
            { type: 1, value: "" },
            { type: 2, value: "" },
            { type: 3, value: "" },
            { type: 4, value: "" },
            { type: 5, value: "1" }
          ],
        showLabels: false,
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString()
      },
      false,
      "POST"
    );

    const rawList = data?.data?.classifyBookList?.records || [];
    const isMore = data?.data?.classifyBookList?.isMore || 0;

    const list = rawList.flatMap(item => {
      if (item.cardType === 3 && item.tagCardVo?.tagBooks) {
        return item.tagCardVo.tagBooks;
      }
      return [item];
    });

    const uniqueList = list.filter(
      (v, i, arr) => arr.findIndex(b => b.bookId === v.bookId) === i
    );

    const result = uniqueList.map(book => ({
      id: book.bookId,
      name: book.bookName,
      cover: book.coverWap,
      chapterCount: book.chapterCount,
      introduction: book.introduction,
      tags: book.tagV3s,
      playCount: book.playCount,
      cornerName: book.corner?.name || null,
      cornerColor: book.corner?.color || null
    }));

    return { isMore: isMore == 1, book: result };
  }

  async getCategories(pageNo = 1, pageSize = 30) {
    const data = await this.request("/webfic/home/browse", {
      typeTwoId: 0,
      pageNo,
      pageSize
    }, true);
    return data?.data?.types || [];
  }

  async getBookFromCategories(typeTwoId = 0, pageNo = 1, pageSize = 10) {
    const data = await this.request("/webfic/home/browse", {
      typeTwoId,
      pageNo,
      pageSize
    }, true);
    return data?.data || [];
  }

  async getRecommendedBooks() {
    const data = await this.request("/drama-box/he001/recommendBook", {
      isNeedRank: 1,
      newChannelStyle: 1,
      specialColumnId: 0,
      pageNo: 1,
      channelId: 43
    });

    const rawList = data?.data?.recommendList?.records || [];
    const list = rawList.flatMap(item => {
      if (item.cardType === 3 && item.tagCardVo?.tagBooks) {
        return item.tagCardVo.tagBooks;
      }
      return [item];
    });

    const uniqueList = list.filter(
      (v, i, arr) => arr.findIndex(b => b.bookId === v.bookId) === i
    );

    return uniqueList;
  }


  async rsearchDrama(keyword, pageNo = 3) {
    const data = await this.request("/drama-box/search/suggest", {
      keyword,
      pageNo
    });
    let result = data?.data?.suggestList || [];
    result = result.map(item => {
      return {
        bookId: item.bookId,
        bookName: item.bookName.replace(/\s+/g, '-'),
        cover: item.cover,
      };
    });
    return result;
  }

  async searchDramaIndex() {
    const data = await this.request("/drama-box/search/index");
    return data?.data?.hotVideoList || [];
  }

  async searchDrama(keyword, pageNo = 1, pageSize = 20) {
    const data = await this.request("/drama-box/search/search", {
      searchSource: '搜索按钮',
      pageNo,
      pageSize,
      from: 'search_sug',
      keyword
    });
    let result = data?.data?.searchList || [];
    const isMore = data?.data?.isMore;
    result = result.map(book => {
      return {
        id: book.bookId,
        name: book.bookName,
        cover: book.cover,
        introduction: book.introduction,
        tags: book.tagNames,
        playCount: book.playCount,
      };
    });
    return { isMore: isMore == 1, book: result };
  }

  async getRandomDrama(count = 1) {
    const sources = [
      'foryou',
      'recommended',
      'latest',
      'vip',
      'dub',
      'list',
      'custom',
      'hot_search'
    ];

    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    console.log(`[RandomDrama] Mengambil ${count} drama dari sumber: ${randomSource.toUpperCase()}`);
    let rawList = [];
    try {
      switch (randomSource) {
        case 'foryou': {
          const res = await this.foryou(1, 20);
          rawList = res.list || [];
          break;
        }
        case 'recommended': {
          rawList = await this.getRecommendedBooks();
          break;
        }
        case 'latest': {
          rawList = await this.getLatest(1);
          break;
        }
        case 'dub': {
          const res = await this.getDramaDub(1, 30);
          rawList = res.book || [];
          break;
        }
        case 'list': {
          const res = await this.getDramaList(1, 30);
          rawList = res.book || [];
          break;
        }
        case 'custom': {
          const res = await this.getDramaCustom(1, 30);
          rawList = res.book || [];
          break;
        }
        case 'hot_search': {
          rawList = await this.searchDramaIndex();
          break;
        }
      }
      let normalizedList = rawList.map(item => ({
        bookId: String(item.bookId || item.id),
        bookName: item.bookName || item.name || "Unknown Title",
        cover: item.coverWap || item.cover || "",
        introduction: item.introduction || "",
        chapterCount: item.chapterCount || 0,
      }));

      normalizedList = normalizedList.filter(item => item.bookId && item.bookName);

      if (normalizedList.length === 0) {
        throw new Error(`Sumber ${randomSource} tidak mengembalikan data.`);
      }
      for (let i = normalizedList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [normalizedList[i], normalizedList[j]] = [normalizedList[j], normalizedList[i]];
      }
      return normalizedList.slice(0, count);

    } catch (error) {
      console.error(`[RandomDrama] Error pada sumber ${randomSource}:`, error.message);
      if (randomSource !== 'recommended') {
        console.log("[RandomDrama] Mencoba fallback ke Recommended...");
        const fallbackList = await this.getRecommendedBooks();
        return fallbackList.slice(0, count).map(item => ({
          bookId: String(item.bookId),
          bookName: item.bookName,
          cover: item.coverWap || item.cover,
        }));
      }
      return [];
    }
  }

}
