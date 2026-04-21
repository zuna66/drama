# Drama API + Web

Proyek ini terdiri dari 2 bagian:

| Bagian | Folder | Port Lokal | Vercel |
|--------|--------|------------|--------|
| API (Express) | `/` (root) | `3000` | Deploy sebagai proyek 1 |
| Website (Next.js) | `/web` | `3001` | Deploy sebagai proyek 2 |

---

## Menjalankan Lokal

### 1. API
```bash
# Di root folder
cp .env.example .env
# Isi DOBDA_API_KEY di .env
npm install
npm run dev
# Berjalan di http://localhost:3000
```

### 2. Website
```bash
# Di folder web/
cd web
# .env.local sudah ada, defaultnya http://localhost:3000
npm install
npm run dev
# Berjalan di http://localhost:3001
```

---

## Deploy ke Vercel

### Proyek 1 — API
1. Import repo ke Vercel
2. **Root Directory**: `/` (root, biarkan kosong)
3. **Framework**: Other
4. **Environment Variables**:
   - `DOBDA_API_KEY` = isi sesuai kebutuhan
   - `PUBLIC_URL` = URL vercel proyek ini (setelah deploy)

### Proyek 2 — Website
1. Import repo yang **sama** ke Vercel (proyek baru)
2. **Root Directory**: `web`
3. **Framework**: Next.js (auto-detect)
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE` = URL API dari Proyek 1 (contoh: `https://drama-mauve.vercel.app`)

---

## Sumber Drama

- DramaBox (`/api/...`)
- DramaBox V2 (`/api/dramaboxv2/...`)
- NetShort (`/api/netshort/...`)
- Melolo (`/api/melolo/...`)
- DramaDash (`/api/dramadash/...`)
- Dramawave (`/api/dramawave/...`)
- Flickreel (`/api/flickreel/...`)
- GoodShort (`/api/goodshort/...`)
- Dobda (`/api/v1/...`)

---

Created by [Sankanime](https://sankavollerei.com/)
