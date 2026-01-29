# 🎓 Acadion Team - Academic Dashboard

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Team ID](https://img.shields.io/badge/Team_ID-A25--CS244-blue)

**Case:** [DC-09] Enhancing Academic Dashboard with Capstone Project Features
**Program:** Asah by Dicoding 2025 with Accenture

---

## 📖 Tentang Proyek

> **Academic Dashboard** adalah aplikasi web untuk mengelola seluruh aktivitas Capstone Project, mulai dari pembentukan tim, validasi komposisi tim berdasarkan rules yang dikonfigurasi, submission worksheet progress, hingga penilaian 360 feedback antar anggota tim.

---

## 🛠️ Tech Stack

Berikut teknologi yang kami digunakan dalam pengembangan backend ini:

| Kategori       | Teknologi         | Deskripsi                                       |
| :------------- | :---------------- | :---------------------------------------------- |
| **Runtime**    | Node.js 20.x      | JavaScript runtime environment                  |
| **Framework**  | Express.js 4.18   | Web framework untuk Node.js                     |
| **Database**   | MySQL 8.0         | Relational database management system           |
| **Auth**       | JWT & bcryptjs    | Authentication & Password Hashing               |
| **Upload**     | Multer            | Middleware untuk handling `multipart/form-data` |
| **Validation** | express-validator | Validasi input request                          |
| **Export**     | ExcelJS           | Library untuk export data ke Excel              |
| **Security**   | CORS              | Handling Cross-Origin Resource Sharing          |

---

## 📂 Struktur Folder

```
backend/
├── config/               # Konfigurasi Database & Environment
├── controllers/          # Logika Bisnis (Admin, Auth, Group, dll)
├── middleware/           # Auth & Role Middleware
├── routes/               # Definisi API Routes
├── utils/                # Helper functions & Validation Engines
├── .env.example          # Template Environment Variables
├── capstone_team.sql     # File Import Database
├── server.js             # Entry point aplikasi
└── package.json          # Dependencies project
```

---

## 🚀 Petunjuk Setup Environment
Ikuti langkah-langkah berikut untuk menjalankan aplikasi backend di komputer lokal Anda.

### 1. Prasyarat
Pastikan Anda sudah menginstall:
Node.js v20.x atau lebih tinggi
MySQL v8.0 atau lebih tinggi
Git & Code Editor (VS Code disarankan)

### 2. Setup Backend
```bash
# 1. Clone Repository
git clone [https://github.com/rafiyamanaka/acadion-backend.git](https://github.com/rafiyamanaka/acadion-backend.git)
cd backend

# 2. Install Dependencies
npm install

# 3. Setup Database
A. Masuk ke MySQL
mysql -u root -p

B. Buat Database & Import Jalankan perintah SQL berikut di dalam MySQL:
CREATE DATABASE capstone_team;
EXIT;

Kemudian import file SQL dari terminal (pastikan berada di folder project):
mysql -u root -p capstone_team < capstone_team.sql

C. Verifikasi (Opsional)
USE capstone_team;
SHOW TABLES;

# 4. Konfigurasi Environment Variables
Duplikasi file .env.example menjadi .env:
cp .env.example .env

Kemudian buka file .env dan sesuaikan isinya dengan konfigurasi lokal Anda:
## Server Configuration
PORT=3000
NODE_ENV=development

## Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_mysql_anda  <-- Ganti ini dengan password MySQL Anda
DB_NAME=capstone_team

## JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

## CORS Configuration
CLIENT_URL=http://localhost:3000

# 5. Menjalankan Aplikasi
Mode Development (dengan Nodemon):
npm run dev
```

Output yang diharapkan:
🚀 Server running on port 3000
📡 API available at http://localhost:3000/api
🏥 Health check: http://localhost:3000/api/health

---

## 👥 Tim Pengembang Acadion (A25-CS244)

| Student ID   | Nama Anggota                      | Role                        |
|:-------------|:----------------------------------|:----------------------------|
| F005D5Y1314  | **Muuhammad Lutfi**               | Frontend & Back-End (FEBE)  |
| F604D5X1096  | **Mella Aprilya Asih**            | Frontend & Back-End (FEBE)  |
| F113D5X1460  | **Natasya Ruilla Fatkhiyati**     | Frontend & Back-End (FEBE)  |
| F120D5Y1352  | **Muhammad Ralfi**                | Frontend & Back-End (FEBE)  |
| F002D5Y0093  | **Ahmad Haffiz Fildzah**          | Frontend & Back-End (FEBE)  |
