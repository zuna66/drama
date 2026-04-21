const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

async function fetchJson(path, { revalidate = 120 } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Normalize cover URLs that point to localhost:3000 -> use NEXT_PUBLIC_API_BASE
function fixCover(url) {
  if (!url) return null;
  return String(url).split('@')[0].replace('http://localhost:3000', API_BASE);
}

// Each source returns:
//   home()       -> [drama]
//   detail(id)   -> { drama, episodes }
//   stream(id, ep) -> { videoUrl, m3u8, mp4, poster, eps, currentEp }
//   search(q)    -> [drama]
//
// Drama shape: { src, id, title, cover, description?, episodes?, rating?, views?, status?, genres? }
// Episode shape: { no, videoUrl?, m3u8?, mp4?, isLocked?, duration?, cover? }

export const SOURCES = {
  dramabox: {
    id: 'dramabox',
    name: 'DramaBox',
    short: 'DB',
    accent: '#ff2d55',
    logo: 'https://www.google.com/s2/favicons?domain=dramabox.com&sz=64',
    note: 'IP server bisa kena 403',
    async home() {
      // dramabox endpoints often blocked -- pull from category instead
      const cats = await fetchJson('/api/categories');
      if (!cats?.success) return [];
      const top = (cats.data || []).slice(0, 6);
      const lists = await Promise.all(
        top.map((c) => fetchJson(`/api/category/${c.id}?page=1&size=10`))
      );
      const seen = new Set();
      const items = [];
      for (const l of lists) {
        const arr = l?.data?.bookList || [];
        for (const b of arr) {
          if (seen.has(b.bookId)) continue;
          seen.add(b.bookId);
          const cornerName = b.cornerInfo?.name || b.corner?.name || '';
          const isVip = /anggota|member|vip|bayar/i.test(cornerName);
          items.push({
            src: 'dramabox',
            id: b.bookId,
            title: b.bookName,
            cover: fixCover(b.cover),
            description: b.introduction,
            episodes: b.chapterCount,
            rating: b.ratings,
            views: b.viewCountDisplay,
            status: b.lastUpdateTimeDisplay,
            genres: b.typeTwoNames || (b.typeTwoList || []).map((t) => t.name),
            vip: isVip,
          });
        }
      }
      return items.slice(0, 24);
    },
    async detail(id) {
      const [v2, chaptersRes] = await Promise.all([
        fetchJson(`/api/detail/${id}/v2`),
        fetchJson(`/api/chapters/${id}`),
      ]);
      const book = v2?.data || null;
      const chapters = chaptersRes?.data?.chapterList || chaptersRes?.data || [];
      if (!book && !chapters.length) {
        // last-resort scan
        const cats = await fetchJson('/api/categories');
        for (const cat of (cats?.data || []).slice(0, 30)) {
          const r2 = await fetchJson(`/api/category/${cat.id}?page=1&size=30`);
          const found = (r2?.data?.bookList || []).find((b) => String(b.bookId) === String(id));
          if (found) {
            return {
              drama: {
                src: 'dramabox', id, title: found.bookName, cover: fixCover(found.cover),
                description: found.introduction, episodes: found.chapterCount,
                genres: found.typeTwoNames || (found.typeTwoList || []).map((t) => t.name),
              },
              episodes: Array.from({ length: found.chapterCount || 0 }, (_, i) => ({ no: i + 1 })),
            };
          }
        }
        return null;
      }
      const totalFromBook = parseInt(String(book?.total_episode || '').replace(/\D/g, ''), 10) || 0;
      const total = totalFromBook || chapters.length || 0;
      const episodes = chapters.length
        ? chapters.map((e) => ({ no: parseInt(e.index ?? e.chapterIndex ?? 0) + 1, isLocked: e.is_locked || e.isLocked }))
        : Array.from({ length: total }, (_, i) => ({ no: i + 1 }));
      const genres = book?.genre
        ? String(book.genre).split(/[,，]/).map((g) => g.trim()).filter(Boolean)
        : [];
      return {
        drama: {
          src: 'dramabox', id,
          title: book?.judul || book?.bookName || `Drama ${id}`,
          cover: fixCover(book?.cover),
          description: book?.deskripsi || book?.introduction,
          episodes: total,
          views: book?.views,
          genres,
        },
        episodes,
      };
    },
    async stream(id, ep) {
      const r = await fetchJson(`/api/stream?bookId=${id}&episode=${ep}`, { revalidate: 0 });
      if (!r) return null;
      const ch = r.data?.chapter || r.data;
      if (!ch) return null;
      return {
        videoUrl: ch?.video?.m3u8 || ch?.video?.mp4 || ch?.mp4 || ch?.m3u8Url || null,
        poster: fixCover(ch?.cover),
        eps: r.data?.allEps,
        currentEp: ep,
      };
    },
    async search(q) {
      const r = await fetchJson(`/api/search?keyword=${encodeURIComponent(q)}&page=1`);
      const arr = r?.data?.bookList || [];
      return arr.map((b) => ({
        src: 'dramabox', id: b.bookId, title: b.bookName, cover: fixCover(b.cover),
        episodes: b.chapterCount, rating: b.ratings,
      }));
    },
  },

  melolo: {
    id: 'melolo',
    name: 'Melolo',
    short: 'ML',
    accent: '#ff8a3d',
    logo: 'https://www.google.com/s2/favicons?domain=melolo.com&sz=64',
    async home() {
      const [latest, trending] = await Promise.all([
        fetchJson('/api/melolo/latest'),
        fetchJson('/api/melolo/trending'),
      ]);
      const out = [];
      const seen = new Set();
      for (const list of [latest, trending]) {
        for (const r of (list?.results || [])) {
          if (seen.has(r.id)) continue;
          seen.add(r.id);
          out.push({
            src: 'melolo', id: r.id, title: r.title, cover: fixCover(r.cover),
            description: r.synopsis, episodes: r.total_episodes || r.episodes,
          });
        }
      }
      return out;
    },
    async detail(id) {
      const r = await fetchJson(`/api/melolo/detail?id=${id}`);
      if (!r?.data) return null;
      const d = r.data;
      const eps = (d.episodes || []).map((e) => ({
        no: e.index || e.episode_no || e.episode,
        vid: e.video_id || e.vid,
        cover: fixCover(e.cover),
        duration: e.duration,
      }));
      return {
        drama: {
          src: 'melolo', id, title: d.title, cover: fixCover(d.cover),
          description: d.synopsis, episodes: eps.length || d.total_episodes,
          status: d.status,
        },
        episodes: eps,
      };
    },
    async stream(id, ep) {
      const detail = await this.detail(id);
      const target = detail?.episodes?.find((e) => Number(e.no) === Number(ep));
      if (!target?.vid) return null;
      const r = await fetchJson(`/api/melolo/watch?vid=${target.vid}&sid=${id}`, { revalidate: 0 });
      const streams = r?.data?.streams || [];
      if (!streams.length) return null;
      const parseRes = (s) => {
        const m = String(s?.resolution || '').match(/(\d+)\s*[x*]\s*(\d+)/i);
        if (m) return parseInt(m[2], 10) || parseInt(m[1], 10) || 0;
        const q = String(s?.quality || '').match(/(\d+)/);
        return q ? parseInt(q[1], 10) : 0;
      };
      const ranked = [...streams].sort((a, b) => parseRes(b) - parseRes(a));
      const best = ranked.find((s) => s.url || s.src) || streams[0];
      const url = best?.url || best?.src;
      if (!url) return null;
      return {
        videoUrl: url,
        poster: target.cover || detail.drama.cover,
        eps: detail.episodes.length,
        currentEp: ep,
      };
    },
    async search(q) {
      const r = await fetchJson(`/api/melolo/search?q=${encodeURIComponent(q)}`);
      const arr = r?.results || r?.data || [];
      return arr.map((x) => ({
        src: 'melolo', id: x.id, title: x.title, cover: fixCover(x.cover),
        description: x.synopsis,
      }));
    },
  },

  dramawave: {
    id: 'dramawave',
    name: 'Dramawave',
    short: 'DW',
    accent: '#3da9ff',
    logo: 'https://www.google.com/s2/favicons?domain=mydramawave.com&sz=64',
    async home() {
      const r = await fetchJson('/api/dramawave/hot-list');
      const arr = r?.data?.items || r?.data || [];
      return arr.map((x) => ({
        src: 'dramawave', id: x.id, title: x.title, cover: fixCover(x.cover),
        description: x.desc, episodes: x.total_episodes || x.episodes,
      }));
    },
    async detail(id) {
      const r = await fetchJson(`/api/dramawave/detail/${id}`);
      const d = r?.data;
      if (!d) return null;
      const eps = (d.episodes || []).map((e) => ({
        no: e.index ?? e.no ?? 1,
        episodeId: e.id,
        videoUrl: e.video_h264 || e.video_h265 || e.url || e.videoUrl,
        isLocked: e.is_locked,
        duration: e.duration,
        cover: e.cover,
      }));
      return {
        drama: {
          src: 'dramawave', id, title: d.title, cover: fixCover(d.cover),
          description: d.desc, episodes: eps.length || d.total_episodes,
          genres: d.tags,
        },
        episodes: eps,
      };
    },
    async stream(id, ep) {
      const detail = await this.detail(id);
      const target = detail?.episodes?.find((e) => Number(e.no) === Number(ep));
      if (target?.videoUrl) {
        return {
          videoUrl: target.videoUrl,
          poster: target.cover || detail.drama.cover,
          eps: detail.episodes.length,
          currentEp: ep,
        };
      }
      return null;
    },
    async search(q) {
      const r = await fetchJson(`/api/dramawave/search?q=${encodeURIComponent(q)}`);
      const arr = r?.data?.items || r?.data || [];
      return arr.map((x) => ({
        src: 'dramawave', id: x.id, title: x.title, cover: fixCover(x.cover),
        description: x.desc,
      }));
    },
  },

  dramadash: {
    id: 'dramadash',
    name: 'Dramadash',
    short: 'DD',
    accent: '#a855f7',
    logo: 'https://www.google.com/s2/favicons?domain=dramadash.app&sz=64',
    async home() {
      const r = await fetchJson('/api/dramadash/home');
      const banner = r?.data?.banner || [];
      const sections = r?.data?.sections || [];
      const all = [...banner, ...sections.flatMap((s) => s.list || s.items || [])];
      const seen = new Set();
      const out = [];
      for (const x of all) {
        const id = x.id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({
          src: 'dramadash', id, title: x.name || x.title,
          cover: fixCover(x.poster || x.cover), description: x.desc || x.description,
          views: x.viewCount, genres: x.genres || x.tags,
        });
      }
      return out;
    },
    async detail(id) {
      const r = await fetchJson(`/api/dramadash/detail/${id}`);
      const d = r?.data;
      if (!d) return null;
      const epsRaw = r.episodes || d.episodes || [];
      const eps = epsRaw.map((e) => ({
        no: (e.episodeNumber ?? e.episode ?? 0) + (epsRaw[0]?.episodeNumber === 0 ? 1 : 0),
        videoUrl: e.videoUrl,
        isLocked: e.isLocked,
        duration: e.duration,
      }));
      return {
        drama: {
          src: 'dramadash', id, title: d.name, cover: fixCover(d.poster),
          description: d.description, episodes: eps.length || d.total_episodes,
          genres: d.genres,
        },
        episodes: eps,
      };
    },
    async stream(id, ep) {
      const detail = await this.detail(id);
      const target = detail?.episodes?.find((e) => Number(e.no) === Number(ep));
      if (target?.videoUrl) return { videoUrl: target.videoUrl, poster: detail.drama.cover, eps: detail.episodes.length, currentEp: ep };
      const r = await fetchJson(`/api/dramadash/watch?id=${id}&e=${ep}`, { revalidate: 0 });
      if (r?.data?.videoUrl) return { videoUrl: r.data.videoUrl, poster: detail?.drama?.cover, eps: detail?.episodes?.length, currentEp: ep };
      return null;
    },
    async search(q) {
      const r = await fetchJson(`/api/dramadash/search?q=${encodeURIComponent(q)}`);
      const arr = r?.data?.list || r?.data || [];
      return arr.map((x) => ({
        src: 'dramadash', id: x.id, title: x.name || x.title, cover: fixCover(x.poster || x.cover),
        description: x.description,
      }));
    },
  },

  netshort: {
    id: 'netshort',
    name: 'NetShort',
    short: 'NS',
    accent: '#22c55e',
    logo: 'https://www.google.com/s2/favicons?domain=netshort.com&sz=64',
    async home() {
      const r = await fetchJson('/api/netshort/discover?page=1&limit=20');
      const arr = r?.data?.dataList || [];
      return arr.map((x) => ({
        src: 'netshort', id: x.shortPlayId, title: x.shortPlayName,
        cover: fixCover(x.shortPlayCover), episodes: x.episodeAllNum,
        rating: x.score, genres: x.tags,
      }));
    },
    async detail(id) {
      const r = await fetchJson(`/api/netshort/detail/${id}`);
      const d = r?.data;
      if (!d) return null;
      const eps = (d.result || []).map((e) => ({
        no: e.episodeNo || e.episode,
        videoUrl: e.videoUrl,
        cover: e.cover,
      }));
      return {
        drama: {
          src: 'netshort', id, title: d.name, cover: fixCover(eps[0]?.cover),
          description: d.description, episodes: eps.length || d.maxEps,
        },
        episodes: eps,
      };
    },
    async stream(id, ep) {
      const r = await fetchJson(`/api/netshort/watch/${id}/ep/${ep}`, { revalidate: 0 });
      const d = r?.data;
      if (!d) return null;
      const v = d.videoUrl || {};
      let url;
      if (typeof v === 'string') {
        url = v;
      } else {
        const ladder = ['1080p', '720p', '540p', '480p', '360p', '240p'];
        url = ladder.map((k) => v[k]).find(Boolean) || Object.values(v).find(Boolean);
      }
      return {
        videoUrl: url, poster: fixCover(d.cover),
        eps: d.maxEps, currentEp: ep, subtitle: d.subtitle,
      };
    },
    async search(q) {
      const r = await fetchJson(`/api/netshort/search?keyword=${encodeURIComponent(q)}`);
      const arr = r?.data?.dataList || r?.data || [];
      return arr.map((x) => ({
        src: 'netshort', id: x.shortPlayId, title: x.shortPlayName,
        cover: fixCover(x.shortPlayCover),
      }));
    },
  },

  goodshort: {
    id: 'goodshort',
    name: 'GoodShort',
    short: 'GS',
    accent: '#f97316',
    logo: 'https://www.google.com/s2/favicons?domain=goodshort.com&sz=64',
    async home() {
      const r = await fetchJson('/api/goodshort/home');
      const arr = r?.data || [];
      return arr.map((x) => ({
        src: 'goodshort', id: x.id, title: x.title, cover: fixCover(x.cover),
      }));
    },
    async detail(id) {
      const r = await fetchJson(`/api/goodshort/detail/${encodeURIComponent(id)}`);
      const d = r?.data;
      if (!d) return null;
      const title = String(d.title || '').replace(/\s*(Drama\s*&amp;\s*Movie|Drama\s*&\s*Movie).*$/i, '').trim() || id;
      const eps = (d.episodes || []).map((e) => ({
        no: e.no,
        chapterId: e.chapterId,
        resource: e.resource,
      }));
      return {
        drama: {
          src: 'goodshort', id, title, cover: fixCover(d.cover),
          description: d.description, episodes: eps.length,
        },
        episodes: eps,
      };
    },
    async stream(id, ep) {
      const r = await fetchJson(`/api/goodshort/watch/${encodeURIComponent(id)}/${ep}`, { revalidate: 0 });
      const d = r?.data;
      if (!d?.stream) return null;
      return {
        videoUrl: d.stream.m3u8,
        poster: fixCover(d.stream.cover || d.detail?.cover),
        eps: d.detail?.episodes?.length,
        currentEp: ep,
      };
    },
    async search(q) {
      const r = await fetchJson(`/api/goodshort/search?q=${encodeURIComponent(q)}`);
      const arr = r?.data || [];
      return arr.map((x) => ({
        src: 'goodshort', id: x.id, title: x.title, cover: fixCover(x.cover),
      }));
    },
  },
};

function makeDobdaSource({ platform, name, short, accent, logoDomain }) {
  return {
    id: platform,
    name,
    short,
    accent,
    logo: `https://www.google.com/s2/favicons?domain=${logoDomain}&sz=64`,
    provider: 'dobda',
    platform,
    async home() {
      const [banner, discover] = await Promise.all([
        fetchJson(`/api/v1/banner/${platform}`),
        fetchJson(`/api/v1/discover/${platform}?page=1`),
      ]);
      const mapItem = (x) => ({
        src: this.id,
        id: x.id,
        title: x.title,
        cover: fixCover(x.cover),
        description: x.synopsis,
        episodes: x.total_chapters || x.total_episodes || x.chapters,
        views: x.views,
        genres: x.genres || x.tags,
      });
      const seen = new Set();
      const merged = [];
      for (const item of [...(banner?.data || []), ...(discover?.data || [])]) {
        const it = mapItem(item);
        if (!it.id || seen.has(it.id)) continue;
        seen.add(it.id);
        merged.push(it);
      }
      return merged.slice(0, 30);
    },
    async detail(id) {
      const r = await fetchJson(`/api/v1/detail/${platform}/${encodeURIComponent(id)}`);
      const d = r?.data;
      if (!d) return null;
      const chapters = d.chapters || [];
      const episodes = chapters.map((c, i) => {
        const no = Number(c.index ?? c.episode ?? i + 1);
        return {
          no: Number.isFinite(no) && no > 0 ? no : i + 1,
          chapterId: c.id ?? c.chapterId,
          isLocked: c.free === false || c.is_free === false || c.isLocked === true,
          duration: c.duration,
          title: c.title,
        };
      });
      return {
        drama: {
          src: this.id,
          id,
          title: d.title,
          cover: fixCover(d.cover),
          description: d.synopsis,
          episodes: episodes.length || d.total_episodes || d.total_chapters,
          status: d.status,
          views: d.views,
          genres: d.genres || d.tags,
        },
        episodes,
      };
    },
    async stream(id, ep) {
      const detail = await this.detail(id);
      const target = detail?.episodes?.find((e) => Number(e.no) === Number(ep));
      if (target?.chapterId === undefined || target?.chapterId === null) return null;
      const r = await fetchJson(
        `/api/v1/video/${platform}/${encodeURIComponent(id)}/${encodeURIComponent(target.chapterId)}`,
        { revalidate: 0 },
      );
      const d = r?.data;
      const streams = d?.streams || [];
      if (!streams.length) return null;
      const parseH = (s) => {
        const m = String(s?.resolution || '').match(/(\d+)\s*[x*]\s*(\d+)/i);
        if (m) return Math.max(parseInt(m[1], 10) || 0, parseInt(m[2], 10) || 0);
        const q = String(s?.quality || '').match(/(\d+)/);
        return q ? parseInt(q[1], 10) : 0;
      };
      const best = [...streams].sort((a, b) => parseH(b) - parseH(a))[0];
      const subtitles = d?.subtitles || d?.subtitle || [];
      const preferred = Array.isArray(subtitles)
        ? (subtitles.find((s) => /^id/i.test(s.language || s.lang || '')) || subtitles[0])
        : null;
      const toH264 = (u) => (typeof u === 'string' ? u.replace(/\/h265-/i, '/h264-').replace(/h265\./gi, 'h264.').replace(/_h265(\.m3u8|\.mp4)/gi, '_h264$1') : u);
      return {
        videoUrl: toH264(best?.url) || null,
        poster: fixCover(detail.drama.cover),
        eps: d?.total_episodes || detail.episodes.length,
        currentEp: ep,
        subtitle: preferred?.url || null,
      };
    },
    async search(q) {
      const r = await fetchJson(`/api/v1/search/${platform}?q=${encodeURIComponent(q)}`);
      const arr = r?.data || [];
      return arr.map((x) => ({
        src: this.id,
        id: x.id,
        title: x.title,
        cover: fixCover(x.cover),
        description: x.synopsis,
      }));
    },
  };
}

const DOBDA_PLATFORMS = [
  { platform: 'reelshort',  name: 'ReelShort',  short: 'RS', accent: '#ef4444', logoDomain: 'reelshort.com' },
  { platform: 'shortmax',   name: 'ShortMax',   short: 'SM', accent: '#0ea5e9', logoDomain: 'shortmax.tv' },
  { platform: 'flickreels', name: 'Flickreels', short: 'FR', accent: '#ec4899', logoDomain: 'flickreels.com' },
  { platform: 'freereels',  name: 'FreeReels',  short: 'FE', accent: '#14b8a6', logoDomain: 'free-reels.com' },
  { platform: 'meloshort',  name: 'MeloShort',  short: 'MS', accent: '#8b5cf6', logoDomain: 'meloshort.com' },
  { platform: 'flextv',     name: 'FlexTV',     short: 'FT', accent: '#eab308', logoDomain: 'flextv.cc' },
  { platform: 'dramarush',  name: 'DramaRush',  short: 'DR', accent: '#06b6d4', logoDomain: 'dramarush.net' },
  { platform: 'rapidtv',    name: 'RapidTV',    short: 'RT', accent: '#f59e0b', logoDomain: 'rapidtv.com' },
  { platform: 'stardusttv', name: 'StardustTV', short: 'ST', accent: '#6366f1', logoDomain: 'stardusttv.net' },
  { platform: 'dramanova',  name: 'DramaNova',  short: 'DN', accent: '#10b981', logoDomain: 'dramanova.com' },
  { platform: 'fundrama',   name: 'FunDrama',   short: 'FD', accent: '#84cc16', logoDomain: 'pointsculture.com' },
  { platform: 'starshort',  name: 'StarShort',  short: 'SS', accent: '#f43f5e', logoDomain: 'starshort.tv' },
  { platform: 'dramapops',  name: 'DramaPops',  short: 'DP', accent: '#d946ef', logoDomain: 'dramapops.co' },
  { platform: 'snackshort', name: 'SnackShort', short: 'SN', accent: '#fb923c', logoDomain: 'snackshort.tv' },
  { platform: 'reelife',    name: 'Reelife',    short: 'RL', accent: '#22d3ee', logoDomain: 'dramahue.com' },
  { platform: 'dramabite',  name: 'DramaBite',  short: 'DB', accent: '#a855f7', logoDomain: 'dramabite.media' },
  { platform: 'sodareels',  name: 'SodaReels',  short: 'SR', accent: '#38bdf8', logoDomain: 'sodareels.com' },
  { platform: 'bilitv',     name: 'BiliTV',     short: 'BT', accent: '#00a1d6', logoDomain: 'bilitv.com' },
  { platform: 'idrama',     name: 'iDrama',     short: 'ID', accent: '#e11d48', logoDomain: 'idrama.video' },
];

for (const p of DOBDA_PLATFORMS) {
  const src = makeDobdaSource(p);
  SOURCES[src.id] = src;
}

export const SOURCE_LIST = Object.values(SOURCES);
export function getSource(id) { return SOURCES[id] || SOURCES.melolo; }
