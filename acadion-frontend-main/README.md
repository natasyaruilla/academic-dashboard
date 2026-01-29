# 🎓 Acadion Team - Academic Dashboard

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Team ID](https://img.shields.io/badge/Team_ID-A25--CS244-blue)

**Case:** [DC-09] Enhancing Academic Dashboard with Capstone Project Features
**Program:** Asah by Dicoding 2025 with Accenture

## 📖 Tentang Proyek

> **Academic Dashboard** adalah antarmuka pengguna (UI) modern yang mengelola seluruh aktivitas Capstone Project. Dibangun untuk memudahkan mahasiswa dan admin dalam pembentukan tim, validasi aturan (rules), submission worksheet, hingga penilaian 360 feedback.

---

## 🛠️ Tech Stack

Frontend ini dibangun menggunakan teknologi modern yang cepat dan responsif:

| Kategori        | Teknologi             | Deskripsi                              |
| :-------------- | :-------------------- | :------------------------------------- |
| **Framework**   | React 18.2            | Library UI dengan Hooks                |
| **Build Tool**  | Vite 5.0              | Build tool generasi baru               |
| **Styling**     | Tailwind CSS 3.3      | Utility-first CSS framework            |
| **Routing**     | React Router DOM 6.20 | Manajemen navigasi halaman             |
| **HTTP Client** | Axios 1.6             | Melakukan request ke Backend API       |
| **Icons**       | Lucide React          | Koleksi ikon yang ringan dan konsisten |
| **State**       | Context API           | Global state management (AuthContext)  |
| **Utils**       | Date API              | Native JS Date handling                |

---

## 📂 Struktur Folder

```
frontend/
├── public/
│   └── downloads/        # File statis (Manual Books PDF)
├── src/
│   ├── components/       # Komponen UI yang dapat digunakan kembali
│   │   ├── common/       # Header, Sidebar, Footer, LoadingSpinner
│   │   └── student/      # Komponen spesifik Student
│   ├── contexts/         # React Context (Auth State)
│   ├── hooks/            # Custom Hooks (useAuth)
│   ├── pages/            # Halaman Utama Aplikasi
│   │   ├── admin/        # Dashboard & Fitur Admin
│   │   ├── student/      # Dashboard & Fitur Student
│   │   ├── Login.jsx     # Halaman Login
│   │   └── Register.jsx  # Halaman Register
│   ├── services/         # Konfigurasi API (Axios Instance)
│   ├── utils/            # Helper functions & Constants
│   ├── styles/           # Global CSS
│   ├── App.jsx           # Root Component & Routing
│   └── main.jsx          # Entry Point React
├── .env.example          # Template Environment Variables
├── postcss.config.js     # Konfigurasi PostCSS
├── tailwind.config.js    # Konfigurasi Tema Tailwind
└── vite.config.js        # Konfigurasi Vite
```

---

## 🚀 Petunjuk Setup Environment
Ikuti langkah-langkah berikut untuk menjalankan frontend di komputer lokal Anda.

### 1. Prasyarat
Pastikan Anda sudah menginstall:
Node.js v20.x atau lebih tinggi
npm v10.x
Git & Code Editor
Backend API harus sudah berjalan (Lihat README pada folder backend)

### 2. Setup Frontend
```bash
# 1. Clone Repository
git clone [https://github.com/rafiyamanaka/acadion-frontend.git](https://github.com/rafiyamanaka/acadion-frontend.git)
cd frontend

# 2. Install Dependencies
npm install

# 3. Konfigurasi Environment Variables
Duplikasi file .env.example menjadi .env:
cp .env.example .env

Buka file .env dan pastikan URL mengarah ke backend Anda:
# URL Backend API (Pastikan port sesuai dengan backend yang running)
VITE_API_URL=http://localhost:3000/api

# 4. Menjalankan Aplikasi (Development)
npm run dev
```

Output yang diharapkan:
VITE v5.0.8  ready in 320 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose

Aplikasi akan otomatis:
Berjalan di http://localhost:5173
Melakukan Auto-reload saat ada perubahan kode

---

## 👥 Tim Pengembang Acadion (A25-CS244)

| Student ID   | Nama Anggota                      | Role                        |
|:-------------|:----------------------------------|:----------------------------|
| F005D5Y1314  | **Muuhammad Lutfi**               | Frontend & Back-End (FEBE)  |
| F604D5X1096  | **Mella Aprilya Asih**            | Frontend & Back-End (FEBE)  |
| F113D5X1460  | **Natasya Ruilla Fatkhiyati**     | Frontend & Back-End (FEBE)  |
| F120D5Y1352  | **Muhammad Ralfi**                | Frontend & Back-End (FEBE)  |
| F002D5Y0093  | **Ahmad Haffiz Fildzah**          | Frontend & Back-End (FEBE)  |
