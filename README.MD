# Koeta Frontend

Frontend aplikasi **KoetaLeaderboard** yang menyediakan antarmuka pengguna untuk mengakses fitur pemantauan, pengelolaan data, autentikasi, dan pemeringkatan dalam sistem.

## Fitur

* Antarmuka pengguna berbasis web
* Autentikasi pengguna
* Integrasi dengan backend melalui *REST API*
* Pengelolaan data berdasarkan hak akses pengguna
* Tampilan pemantauan dan pemeringkatan
* *Responsive user interface*

## Teknologi

* Next.js
* React
* JavaScript / TypeScript
* Node.js
* npm

## Struktur Direktori

```text
koeta-frontend/
├── public/
├── src/
├── package.json
├── .env.example
└── README.md
```

## Persyaratan

Pastikan perangkat telah memiliki:

* Node.js versi LTS
* npm
* Git
* Repository backend Koeta

## Instalasi

### 1. Clone Repository Frontend

```bash
git clone https://github.com/nashedalii/koeta-frontend
cd koeta-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Jika tersedia file `.env.example`, salin menjadi `.env`.

```bash
cp .env.example .env
```

Kemudian sesuaikan konfigurasi yang diperlukan.

Contoh:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Nilai tersebut digunakan untuk menghubungkan frontend dengan backend Koeta.

## Integrasi dengan Backend

Frontend Koeta menggunakan backend sebagai penyedia *REST API*. Oleh karena itu, repository backend juga harus di-*clone* dan dijalankan agar seluruh fitur aplikasi dapat digunakan.

Clone repository backend:

```bash
git clone https://github.com/nashedalii/koeta-backend
cd koeta-backend
npm install
```

Kemudian jalankan backend:

```bash
npm run dev
```

Backend secara default berjalan pada:

```text
http://localhost:3000
```

Setelah backend berjalan, kembali ke direktori frontend dan jalankan:

```bash
npm run dev
```

Frontend kemudian dapat diakses melalui alamat yang ditampilkan oleh Next.js, umumnya:

```text
http://localhost:3001
```

Pastikan `NEXT_PUBLIC_API_URL` pada frontend mengarah ke alamat backend yang sedang berjalan.

## Menjalankan Project

### Development

```bash
npm run dev
```

### Build Production

```bash
npm run build
```

### Menjalankan Production Build

```bash
npm start
```

## Scripts

```bash
npm run dev      # Menjalankan development server
npm run build    # Membuat production build
npm start        # Menjalankan production server
```

## Repository Terkait

Backend aplikasi Koeta tersedia pada repository terpisah dan diperlukan agar frontend dapat berkomunikasi dengan API.

Clone repository backend:

```bash
git clone https://github.com/nashedalii/koeta-backend
```

Setelah kedua repository tersedia, jalankan backend dan frontend secara bersamaan pada terminal yang berbeda.

```text
koeta-backend  → Backend API
koeta-frontend → Web Application
```

## Catatan

* Gunakan versi Node.js yang sesuai dengan konfigurasi project.
* Jangan memasukkan file `.env` ke repository.
* Gunakan `.env.example` sebagai referensi konfigurasi environment.
* Pastikan backend berjalan sebelum menggunakan fitur frontend yang membutuhkan API.
