const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

async function call(path, { revalidate = 60 } = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}`, raw: txt };
    }
    const json = await res.json();
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function getCategories() {
  const r = await call('/api/categories');
  if (!r.ok || !r.json?.success) return [];
  return r.json.data || [];
}

export async function getCategoryDramas(id, page = 1, size = 20) {
  const r = await call(`/api/category/${id}?page=${page}&size=${size}`);
  const d = r.ok && r.json?.success ? r.json.data : null;
  return {
    records: d?.bookList || d?.records || [],
    total: d?.total || 0,
    pages: d?.pages || 0,
    types: d?.types || [],
  };
}

export async function search(keyword, page = 1, lang = 'in') {
  const r = await call(
    `/api/search?keyword=${encodeURIComponent(keyword)}&page=${page}&lang=${lang}`,
    { revalidate: 30 }
  );
  const d = r.ok && r.json?.success ? r.json.data : null;
  if (d) {
    return {
      records: d.bookList || d.records || d.suggestList || [],
      total: d.total || 0,
    };
  }
  // Fallback: filter dari kategori-kategori top
  const cats = await getCategories();
  const sample = await Promise.all(
    cats.slice(0, 10).map((c) => getCategoryDramas(c.id, 1, 30).then((r) => r.records))
  );
  const pool = sample.flat();
  const seen = new Set();
  const k = keyword.toLowerCase();
  const filtered = pool.filter((b) => {
    const id = b.bookId || b.id;
    if (seen.has(id)) return false;
    seen.add(id);
    const t = (b.bookName || b.judul || '').toLowerCase();
    const intro = (b.introduction || '').toLowerCase();
    return t.includes(k) || intro.includes(k);
  });
  return { records: filtered, total: filtered.length, fallback: true };
}

export async function getDetail(bookId, lang = 'in') {
  const r = await call(`/api/detail/${bookId}?lang=${lang}`);
  if (r.ok && r.json?.success) return r.json.data || null;

  // Fallback 1: Dramabox V2 scraper
  const v2 = await call(`/api/dramaboxv2/detail?bookId=${bookId}`);
  if (v2.ok && v2.json?.status === 'success' && v2.json.judul) {
    return {
      bookId: v2.json.bookId,
      bookName: v2.json.judul,
      cover: v2.json.cover,
      introduction: v2.json.deskripsi,
      chapterCount: parseInt(String(v2.json.total_episode).replace(/\D/g, '')) || v2.json.jumlah_episode_tersedia,
      _episodes: v2.json.episodes || [],
    };
  }

  // Fallback 2: scan categories untuk cari book ini
  const cats = await getCategories();
  for (const c of cats.slice(0, 30)) {
    const r = await getCategoryDramas(c.id, 1, 30);
    const found = r.records.find((b) => String(b.bookId) === String(bookId));
    if (found) return found;
  }
  return null;
}

export async function getChapters(bookId, lang = 'in') {
  const r = await call(`/api/chapters/${bookId}?lang=${lang}`);
  if (r.ok && r.json?.success) return r.json.data || [];

  // Fallback: build dari detail._episodes (dramaboxv2) atau infer dari chapterCount
  const detail = await getDetail(bookId, lang);
  if (detail?._episodes?.length) {
    return detail._episodes.map((e) => ({
      index: e.episode_index,
      chapterIndex: e.episode_index,
      isLocked: e.is_locked,
    }));
  }
  const total = detail?.chapterCount || detail?.chapters || 0;
  if (total > 0) {
    return Array.from({ length: total }, (_, i) => ({ index: i, chapterIndex: i }));
  }
  return [];
}

export async function getStream(bookId, episode, lang = 'in') {
  const r = await call(
    `/api/stream?bookId=${bookId}&episode=${episode}&lang=${lang}`,
    { revalidate: 0 }
  );
  if (r.ok && r.json && (r.json.success !== false)) return r.json;

  // Fallback: dramaboxv2 stream
  const v2 = await call(`/api/dramaboxv2/stream?bookId=${bookId}&episode=${episode}&lang=${lang}`, { revalidate: 0 });
  if (v2.ok) return v2.json;
  return null;
}

export async function getLatest(page = 1, lang = 'in') {
  const r = await call(`/api/latest?page=${page}&lang=${lang}`);
  if (!r.ok || !r.json?.success) return null;
  return r.json.data || null;
}

export async function getPopular(page = 1, lang = 'in') {
  const r = await call(`/api/popular?page=${page}&lang=${lang}`);
  if (!r.ok || !r.json?.success) return null;
  return r.json.data || null;
}

export async function getHome(page = 1, size = 12, lang = 'in') {
  const r = await call(`/api/home?page=${page}&size=${size}&lang=${lang}`);
  if (!r.ok || !r.json?.success) return null;
  return r.json.data || null;
}

export function normalizeDrama(d) {
  if (!d) return null;
  return {
    bookId: d.bookId || d.id,
    title: d.bookName || d.judul || d.name || 'Tanpa judul',
    cover: cleanCover(d.cover || d.coverWap),
    rating: d.ratings || d.rating,
    chapters: d.chapterCount || d.total_episode,
    intro: d.introduction || d.deskripsi,
    tags: d.labels || d.tags || (d.tagNames || []),
    views: d.viewCountDisplay,
    status: d.status || d.lastUpdateTimeDisplay,
    genres: d.typeTwoNames || (d.typeTwoList || []).map((t) => t.name),
  };
}

function cleanCover(url) {
  if (!url) return null;
  return String(url).split('@')[0];
}
