-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 15 Des 2025 pada 04.10
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `capstone_team`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_docs`
--

CREATE TABLE `capstone_docs` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `order_idx` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_docs`
--

INSERT INTO `capstone_docs` (`id`, `batch_id`, `title`, `url`, `order_idx`) VALUES
(5, 'BATCH2025', 'Capstone Playbook', 'https://docs.google.com/document/d/1z-HCRlfXRUPcoajplkAfQYCilrSVKvUnWsFR1iWpRSw/edit?tab=t.0#heading=h.prr63i3mvc13', 1),
(6, 'BATCH2025', 'Daftar Use-Case Capstone', 'https://docs.google.com/document/d/1eLAy7YapeT6jSzQ5D4LnK6dF5Wn_vIlPaap_8mrXRAY/edit?tab=t.sz6jqfw4pqyd#heading=h.v7gz6yhxhk72', 2);

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_groups`
--

CREATE TABLE `capstone_groups` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `use_case_id` int(11) DEFAULT NULL,
  `group_name` varchar(255) DEFAULT NULL,
  `creator_user_id` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft' COMMENT 'draft, ready, approved, rejected, rejected_reselecting',
  `created_at` timestamp NULL DEFAULT NULL,
  `locked_at` timestamp NULL DEFAULT NULL,
  `rejected_use_case_ids` text DEFAULT NULL COMMENT 'CSV of rejected use case IDs'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_groups`
--

INSERT INTO `capstone_groups` (`id`, `batch_id`, `use_case_id`, `group_name`, `creator_user_id`, `status`, `created_at`, `locked_at`, `rejected_use_case_ids`) VALUES
(21, 'BATCH2025', 12, 'Tim Gen Z', '254b88283cb14143', 'approved', '2025-12-14 06:55:06', '2025-12-15 02:50:01', NULL),
(22, 'BATCH2025', 15, 'Team fufufafa', '9384f4bdca34abdc', 'draft', '2025-12-14 17:53:01', NULL, NULL),
(23, 'BATCH2025', 16, 'team cihuy', '99efd7fc1d04f0fb', 'approved', '2025-12-15 02:40:55', '2025-12-15 02:41:02', NULL),
(24, 'BATCH2025', 16, 'team ahoy', 'c42dc3f294929b1a', 'approved', '2025-12-15 02:41:44', '2025-12-15 02:42:08', NULL),
(25, 'BATCH2025', 15, 'team cihuahua', 'c440ae03e58e9b5f', 'draft', '2025-12-15 02:58:51', NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_group_invitations`
--

CREATE TABLE `capstone_group_invitations` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `inviter_user_id` varchar(50) NOT NULL,
  `invitee_user_id` varchar(50) NOT NULL,
  `token` varchar(100) DEFAULT NULL,
  `state` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `acted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_group_invitations`
--

INSERT INTO `capstone_group_invitations` (`id`, `group_id`, `inviter_user_id`, `invitee_user_id`, `token`, `state`, `created_at`, `acted_at`) VALUES
(20, 21, '254b88283cb14143', 'cee9180ec0acef34', NULL, 'accepted', '2025-12-14 06:55:20', '2025-12-14 06:55:30'),
(21, 21, '254b88283cb14143', '3eac3c8c31f370cc', NULL, 'accepted', '2025-12-14 06:56:01', '2025-12-14 06:56:45'),
(22, 21, '254b88283cb14143', '404abad15829a07e', NULL, 'accepted', '2025-12-14 06:56:12', '2025-12-14 06:56:27'),
(23, 21, '254b88283cb14143', '40d002f096815efa', NULL, 'accepted', '2025-12-14 06:57:05', '2025-12-14 06:57:33');

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_group_members`
--

CREATE TABLE `capstone_group_members` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'member',
  `state` varchar(50) NOT NULL DEFAULT 'accepted',
  `joined_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_group_members`
--

INSERT INTO `capstone_group_members` (`id`, `group_id`, `user_id`, `role`, `state`, `joined_at`) VALUES
(53, 21, '254b88283cb14143', 'leader', 'accepted', '2025-12-14 06:55:06'),
(54, 21, 'cee9180ec0acef34', 'member', 'accepted', '2025-12-14 06:55:30'),
(55, 21, '404abad15829a07e', 'member', 'accepted', '2025-12-14 06:56:27'),
(58, 22, '9384f4bdca34abdc', 'leader', 'accepted', '2025-12-14 17:53:01'),
(59, 23, '99efd7fc1d04f0fb', 'leader', 'accepted', '2025-12-15 02:40:55'),
(60, 24, 'c42dc3f294929b1a', 'leader', 'accepted', '2025-12-15 02:41:44'),
(61, 21, 'b7f877c53cbd4cd5', 'member', 'accepted', NULL),
(62, 21, 'cafaa8aae78a520d', 'member', 'accepted', NULL),
(63, 25, 'c440ae03e58e9b5f', 'leader', 'accepted', '2025-12-15 02:58:51');

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_group_rejection_history`
--

CREATE TABLE `capstone_group_rejection_history` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `use_case_id` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT current_timestamp(),
  `rejected_by` varchar(50) DEFAULT NULL COMMENT 'Admin user ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_group_rules_backup`
--

CREATE TABLE `capstone_group_rules_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `batch_id` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_required` tinyint(1) DEFAULT 1,
  `criteria` varchar(100) NOT NULL,
  `user_attribute` varchar(100) DEFAULT NULL,
  `attribute_value` varchar(255) DEFAULT NULL,
  `operator` varchar(50) NOT NULL,
  `value` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_group_rules_backup`
--

INSERT INTO `capstone_group_rules_backup` (`id`, `batch_id`, `is_active`, `is_required`, `criteria`, `user_attribute`, `attribute_value`, `operator`, `value`, `created_at`) VALUES
(2, 'asah-batch-1', 1, 1, 'GROUP_SIZE', NULL, NULL, 'EQUAL_TO', '3', '2025-11-08 14:55:38');

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_information`
--

CREATE TABLE `capstone_information` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_information`
--

INSERT INTO `capstone_information` (`id`, `batch_id`, `title`, `content`, `created_at`, `updated_at`) VALUES
(6, 'BATCH2025', '🔥Progress Update – Capstone Project Asah 2025', 'Halo Peserta Asah 2025  @Cohort ,\n\nKami ingin memberikan apresiasi sebesar-besarnya kepada 386 tim Capstone yang telah mengumpulkan dokumen Project Plan tepat waktu!  🙌✨\n\nKalian telah menunjukkan komitmen, disiplin, dan semangat kolaborasi yang luar biasa dalam menyiapkan fondasi proyek kalian. 💪\n \n💡 What’s Next?\nProject Plan kalian sedang dalam proses penilaian oleh asesor. Sambil menunggu hasil penilaian, kalian sudah bisa mulai mengimplementasikan rencana proyeknya dengan menggunakan template Project Brief yang telah disediakan.\nJangan lupa melakukan pertemuan internal dan pengisian checkpoint. \n\nTerus jaga semangat dan kekompakan tim, karena perjalanan Capstone kalian baru saja dimulai!🚀.\nGood Luck, team. 💪\n \nSalam hangat,\n**Tim Asah dari Dicoding**', '2025-11-28 08:17:15', '2025-11-28 08:17:15');

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_rules`
--

CREATE TABLE `capstone_rules` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `rule_type` enum('GROUP_SIZE','MAX_SAME_UNIVERSITY','REQUIRED_LEARNING_PATHS') NOT NULL,
  `rule_value` text NOT NULL COMMENT 'Value bisa berupa: angka (5) atau comma-separated (ML, FE, BE)',
  `description` varchar(500) DEFAULT NULL COMMENT 'Deskripsi untuk ditampilkan ke user',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_rules`
--

INSERT INTO `capstone_rules` (`id`, `batch_id`, `rule_type`, `rule_value`, `description`, `created_at`) VALUES
(34, 'BATCH2025', 'GROUP_SIZE', '5', '', '2025-11-28 08:12:40'),
(35, 'BATCH2025', 'MAX_SAME_UNIVERSITY', '3', '', '2025-11-28 08:12:59'),
(36, 'BATCH2025', 'REQUIRED_LEARNING_PATHS', 'Machine Learning', '', '2025-11-28 08:13:11'),
(37, 'BATCH2025', 'REQUIRED_LEARNING_PATHS', 'Mobile Development', '', '2025-11-28 08:13:26'),
(38, 'BATCH2025', 'GROUP_SIZE', '1', '', '2025-12-03 05:18:26'),
(39, 'BATCH2025', 'MAX_SAME_UNIVERSITY', '1', '', '2025-12-08 07:19:05'),
(40, 'BATCH2025', 'GROUP_SIZE', '6', '', '2025-12-08 07:21:01'),
(41, 'BATCH2025', 'REQUIRED_LEARNING_PATHS', 'Cloud Computing', '', '2025-12-08 07:21:29');

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_timeline`
--

CREATE TABLE `capstone_timeline` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_at` date DEFAULT NULL,
  `end_at` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `order_idx` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_timeline`
--

INSERT INTO `capstone_timeline` (`id`, `batch_id`, `title`, `start_at`, `end_at`, `description`, `order_idx`) VALUES
(3, 'BATCH2025', 'Registrasi Grup Capstone', '2025-11-28', '2025-11-29', 'Peserta melakukan registrasi grup capstone melalui Academic Program Dashboard', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_use_cases`
--

CREATE TABLE `capstone_use_cases` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Nama project/use case',
  `company` varchar(255) DEFAULT NULL COMMENT 'Nama perusahaan/client',
  `description` text DEFAULT NULL COMMENT 'Deskripsi lengkap project',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Apakah use case ini aktif/bisa dipilih',
  `display_order` int(11) DEFAULT 0 COMMENT 'Urutan tampil (ASC)',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_use_cases`
--

INSERT INTO `capstone_use_cases` (`id`, `batch_id`, `name`, `company`, `description`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES
(12, 'BATCH2025', '[DC-09] Enhancing Academic Dashboard with Capstone Feature', 'Dicoding Indonesia', 'Program intensif Dicoding menjadikan Capstone Project sebagai syarat utama kelulusan siswa. Aktivitas ini mencakup pembentukan tim, perencanaan, pembagian tugas, bimbingan, pengumpulan hasil, hingga evaluasi. Namun, seluruh proses tersebut masih dilakukan melalui platform terpisah seperti formulir, email, spreadsheet, dan chat, yang menyebabkan koordinasi tidak efisien, data sulit dilacak, serta dokumentasi progres dan umpan balik tidak terorganisir.\nPermasalahan utama terletak pada belum adanya sistem terintegrasi dalam Academic Dashboard Dicoding yang mampu menampung seluruh aktivitas Capstone Project. Akibatnya, siswa kesulitan memantau progres dan menerima feedback secara terarah, sementara tim program menghadapi beban tinggi dalam validasi dan monitoring data sehingga menurunkan efisiensi, transparansi, dan kualitas pembelajaran di program intensif.\nTim mengusulkan pengembangan Capstone Project yang terintegrasi di dalam Academic Dashboard. Sistem ini akan menyediakan alur pengajuan proyek terstruktur dengan validasi otomatis, pemantauan progres real-time, smart document management, serta fitur 360-Degree Feedback agar komunikasi bimbingan terdokumentasi dan mudah ditinjau kembali. Selain itu, akan ditambahkan fitur registrasi dan manajemen tim untuk membantu peserta membentuk tim proyek yang kompeten sesuai kebutuhan Capstone.\n', 1, 1, '2025-11-28 08:12:14', '2025-12-08 06:53:15'),
(13, 'BATCH2025', '[AC-06] Customer Segmentation for Personalized Retail Marketing', 'Accenture', 'Latar Belakang Masalah\n\nPerusahaan ritel online seringkali menjalankan kampanye promosi yang sama ke seluruh\npelanggan tanpa membedakan perilaku pembelian. Akibatnya, banyak promosi yang tidak\nefektif, biaya pemasaran meningkat, dan tingkat engagement pelanggan rendah. Dengan\nmenggunakan data transaksi, perusahaan dapat membangun segmen pelanggan\nberdasarkan nilai dan perilaku belanja, lalu merancang strategi pemasaran yang lebih\npersonal.\n\nRuang Lingkup Proyek & Tujuan\n1. Analisis data transaksi pelanggan menggunakan Online Retail Dataset (UCI) dari\nKaggle.\n2. Membangun model RFM (Recency, Frequency, Monetary) dan melakukan\nclustering (contohnya: K-Means).\n3. Menghasilkan segmentasi pelanggan (contohnya: \"Loyalists,\" \"At Risk,\" \"Big\nSpenders“).\n4. Memberikan rekomendasi strategi pemasaran untuk tiap segmen.\n\nIndikator keberhasilan\nSegmentasi yang dapat diinterpretasikan dengan jelaws, disertai visualisasi dan insight\nbisnis.\n\nHasil yang Diharapkan\n\n1. Notebook analisis RFM & clustering.\n2. Visualisasi segmen pelanggan & persona singkat.\n3. Insight pemasaran: strategi berbeda untuk tiap segmen.\n\nDokumen atau Referensi Tambahan\n\n1. Artikel tentang RFM segmentation:\nhttps://www.braze.com/resources/articles/rfm-segmentation', 1, 2, '2025-12-03 05:18:17', '2025-12-08 06:54:42'),
(14, 'BATCH2025', '[DC-02] LearnCheck! Formative Assessment Powered with AI', 'Dicoding Indonesia', 'Latar Belakang Masalah\n\nSaat ini Dicoding belum memiliki fitur formative assessment yang dapat memberikan feedback langsung kepada siswa untuk membantu proses pembelajaran. Akibatnya,\npeserta belajar cenderung hanya membaca materi atau menyelesaikan submission tanpa\nmengetahui sejauh mana pemahaman mereka terhadap konten yang sudah dipelajari.\n\nPadahal, formative assessment berperan penting sebagai alat diagnosis dini dalam proses\nbelajar: membantu mendeteksi kesulitan siswa, memberikan ruang refleksi, serta\nmemastikan fondasi pengetahuan cukup kuat sebelum melanjutkan ke topik berikutnya.\n\nTanpa formative assessment yang baik, risiko yang muncul adalah siswa melompat ke\nmateri lebih kompleks dengan pemahaman yang lemah, sehingga berpengaruh pada efektivitas pembelajaran.\n\nMelalui capstone ini, Dicoding mengusulkan solusi LearnCheck!, yaitu fitur formative\nassessment berbasis Al yang mampu menghasilkan soal otomatis dari konten submodul.', 1, 3, '2025-12-08 06:49:21', '2025-12-08 06:49:21'),
(15, 'BATCH2025', '[AC-01] Telco - Product Recommendation Offer based on Customer Behaviour', 'Accenture', 'Latar Belakang Masalah\n\nSekarang ini ada ribuan varian product yang ditawarkan oleh penyedia jasa layanan\ntelekomunikasi, mulai dari paket Telepon, SMS, Data, VOD, dan lain-lain. Dengan\nbanyaknya product tersebut, timbul masalah bagi kedua sisi, baik dari sisi Penyedia\nLayanan, maupun dari sisi Pengguna Layanan. Oleh karena itu, dibutuhkan suatu\nmekanisme untuk bisa merekomendasikan produk yang cocok berdasarkan kebiasaan\ndari pengguna tersebut, sehingga product yang ditawarkan bisa lebih tepat sasaran.\n\nRuang Lingkup Proyek & Tujuan\n\nCakupan proyek ini Adalah membuat algoritma machine learning yang dapat digunakan\nuntuk menghasilkan rekomendasi produk yang seakurat mungkin, yang sesuai dengan\nkebiasaan pengguna. Indikator keberhasilan dari proyek ini adalah Tingkat akurasi dari\nalgoritma machine learning yang dibuat >= 90%\n\nHasil yang Diharapkan\n\nAlgoritma machine learning yang dibuat mampu mengeluarkan rekomendasi produk yang\nsesuai dengan behaviour pengguna tersebut.', 1, 4, '2025-12-08 06:50:56', '2025-12-08 06:50:56'),
(16, 'BATCH2025', '[AC-08] Digitalisasi Pembuatan Berita Acara', 'Accenture', 'Latar Belakang Masalah\n\nseluruh aktivitas yang dijalankan oleh perusahaan tersebut. Setiap rekanan terikat dalam\nkontrak dan apabila tanggung jawab dari rekanan tersebut telah terpenuhi, perusahaan\nakan membayarkan kewajiban terhadap rekanan sesuai kontrak. Proses pembayaran\nmembutuhkan beberapa dokumen yang menjadi landasan bahwa pekerjaan rekanan telah\ndiselesaikan, salah satunya ialah Berita Acara.\n\nBerita Acara merupakan dokumen tertulis yang menyatakan suatu pekerjaan telah selesai\ndiperiksa, diterima atau sudah dibayarkan. Dokumen ini akan diperiksa oleh kedua pihak\ndalam beberapa tahapan dan akan ditandatangani kedua pihak setelah semua isi\ndokumen sudah sesuai dengan fakta di lapangan. Berita Acara yang telah dibuat akan\ndilampirkan sebagai administrasi proses pembayaran.\n\nSeluruh rekanan perusahaan tersebar di berbagai wiliayah di Indonesia sehingga proses\npembuatan Berita Acara membutuhkan waktu yang cukup panjang hingga beberapa\nminggu atau lebih karena keterbatasan jarak dan banyaknya pihak yang terlibat. Status\npersetujuan Berita Acara pun menjadi sulit untuk diketahui karena tidak ada sistem yang\nmampu memberikan transparansi proses kepada seluruh pihak yang terlibat secara real-\ntime.\n\nDigitalisasi proses pembuatan Berita Acara diharapkan mampu membuat alur pembuatan\nBerita Acara menjadi lebih efektif, efisien dan transparan kepada semua pihak yang terlibat.', 1, 5, '2025-12-08 06:51:53', '2025-12-08 06:51:53'),
(17, 'BATCH2025', '[[DC-07] Student Distraction-Free Learning (Focus Mode)', 'Dicoding Indonesia', 'Latar Belakang Masalah\n\nSalah satu tantangan utama yang dihadapi siswa dalam proses pembelajaran daring\nadalah kesulitan untuk menjaga fokus. Terdapat berbagai gangguan yang sering ditemui\ndalam lingkungan digital.\n\n· Adanya notifikasi perangkat aplikasi lain yang muncul saat sedang belajar.\n· Dorongan untuk membuka media sosial.\n. Terlalu lama menatap layar tanpa jeda yang membuat otak sulit mempertahankan\nfokus.\n· Hingga rasa terdistraksi oleh banyaknya materi yang tersedia dalam satu waktu.\n\nHal tersebut menyebabkan siswa tidak dapat memanfaatkan waktu belajar secara optimal,\nsehingga progres belajar menjadi lambat, materi sulit dipahami secara mendalam, serta\nmotivasi siswa dalam belajar menjadi berkurang.\n\nSebagai platform pembelajaran daring, Dicoding tidak hanya menyediakan materi belajar\nyang komprehensif, tetapi juga menghadirkan fitur yang membantu siswa membangun\nkebiasaan belajar yang terarah, fokus, dan minim distraksi.', 1, 6, '2025-12-08 06:52:34', '2025-12-08 06:52:34');

-- --------------------------------------------------------

--
-- Struktur dari tabel `capstone_use_case_rules`
--

CREATE TABLE `capstone_use_case_rules` (
  `id` int(11) NOT NULL,
  `use_case_id` int(11) NOT NULL,
  `rule_id` int(11) NOT NULL,
  `is_required` tinyint(1) DEFAULT 1 COMMENT 'Apakah rule ini wajib dipenuhi'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `capstone_use_case_rules`
--

INSERT INTO `capstone_use_case_rules` (`id`, `use_case_id`, `rule_id`, `is_required`) VALUES
(26, 13, 38, 1),
(27, 13, 36, 1),
(31, 14, 34, 1),
(32, 14, 37, 1),
(36, 17, 41, 1),
(37, 17, 39, 1),
(38, 17, 40, 1),
(39, 12, 34, 1),
(40, 12, 35, 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `checkin_periods`
--

CREATE TABLE `checkin_periods` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `period_name` varchar(255) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `checkin_periods`
--

INSERT INTO `checkin_periods` (`id`, `batch_id`, `period_name`, `start_date`, `end_date`, `description`, `is_active`, `created_at`) VALUES
(8, 'BATCH2025', 'Pengisian Worksheet minggu ke-3', '2025-12-07 16:00:00', '2025-12-16 16:00:00', 'Kamu diwajibkan untuk submit semua laporan yang sudah dibuat bersama Tim', 1, '2025-12-08 07:30:52'),
(9, 'BATCH2025', 'Pengisian Worksheet minggu ke-4', '2025-12-08 01:06:00', '2025-12-16 01:06:00', 'Describe what students should submit during this period ...', 1, '2025-12-08 08:07:23');

-- --------------------------------------------------------

--
-- Struktur dari tabel `feedback_360`
--

CREATE TABLE `feedback_360` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `reviewer_id` varchar(50) NOT NULL COMMENT 'User yang memberikan penilaian',
  `reviewee_id` varchar(50) NOT NULL COMMENT 'User yang dinilai',
  `group_id` int(11) NOT NULL,
  `is_active` enum('Aktif','Tidak Aktif') NOT NULL,
  `contribution_level` enum('Memberikan kontribusi signifikan','Memberikan kontribusi, tetapi sedang sakit/dalam keadaan darurat','Memberikan kontribusi, tetapi tidak signifikan','Tidak memberikan kontribusi sama sekali') NOT NULL,
  `reason` text NOT NULL,
  `submitted_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `feedback_360_periods`
--

CREATE TABLE `feedback_360_periods` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `period_name` varchar(255) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `registration_periods`
--

CREATE TABLE `registration_periods` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `open_date` datetime NOT NULL,
  `close_date` datetime NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `registration_periods`
--

INSERT INTO `registration_periods` (`id`, `batch_id`, `open_date`, `close_date`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(7, 'BATCH2025', '2025-12-08 15:37:00', '2025-12-15 15:37:00', 1, 'USR-1762487586841-XX8518AX4', '2025-12-14 08:37:48', '2025-12-14 08:40:37');

-- --------------------------------------------------------

--
-- Struktur dari tabel `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `system_settings`
--

INSERT INTO `system_settings` (`id`, `batch_id`, `setting_key`, `setting_value`, `updated_at`, `updated_by`) VALUES
(1, 'BATCH2025', 'group_registration_open', 'true', '2025-11-18 04:55:49', 'USR-1762487586841-XX8518AX4');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `batch_id` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `learning_path` varchar(255) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'STUDENT',
  `university` varchar(255) DEFAULT NULL,
  `learning_group` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `batch_id`, `email`, `password`, `name`, `learning_path`, `role`, `university`, `learning_group`, `created_at`, `updated_at`) VALUES
('254b88283cb14143', 'BATCH2025', 'yuni.shara@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Yuni Shara', 'Cloud Computing', 'STUDENT', 'Universitas Kristen Indonesia', '', '2025-12-14 01:25:58', '2025-12-14 05:36:39'),
('3eac3c8c31f370cc', 'BATCH2025', 'putra.mahendra@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Putra Mahendra', 'Machine Learning', 'STUDENT', 'Telkom University', 'Group D', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('404abad15829a07e', 'BATCH2025', 'ahmad.rizki@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Ahmad Rizki', 'Frontend Development', 'STUDENT', 'Universitas Indonesia', 'Group A', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('40d002f096815efa', 'BATCH2025', 'joko.widodo@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Joko Widodo', 'Backend Development', 'STUDENT', 'Institut Teknologi Sepuluh Nopember', 'Group B', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('4235333649fe3379', 'BATCH2025', 'fauzi.rahman@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Fauzi Rahman', 'Backend Development', 'STUDENT', 'Universitas Airlangga', 'Group B', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('6096f3404f281bdb', 'BATCH2025', 'sarah.putri@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Sarah Putri', 'Machine Learning', 'STUDENT', 'Universitas Pelita Harapan', 'Group D', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('61b8e8386d52d317', 'BATCH2025', 'gita.savitri@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Gita Savitri', 'Backend Development', 'STUDENT', 'Universitas Padjadjaran', 'Group B', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('9384f4bdca34abdc', 'BATCH2025', 'wulan.sari@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Wulan Sari', 'Cloud Computing', 'STUDENT', 'Universitas Tarumanagara', 'Group E', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('970a1912e9ab6caf', 'BATCH2025', 'taufik.hidayat@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Taufik Hidayat', 'Machine Learning', 'STUDENT', 'Universitas Trisakti', 'Group D', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('99efd7fc1d04f0fb', 'BATCH2025', 'vino.bastian@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Vino Bastian', 'Cloud Computing', 'STUDENT', 'Universitas Mercu Buana', 'Group E', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('a5724cc940612280', 'BATCH2025', 'maya.anggraini@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Maya Anggraini', 'Mobile Development', 'STUDENT', 'Universitas Lampung', 'Group C', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('a92755b266f1a3b6', 'BATCH2025', 'olivia.chandra@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Olivia Chandra', 'Mobile Development', 'STUDENT', 'Universitas Surabaya', 'Group C', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('ae630412bcdec552', 'BATCH2025', 'hendra.gunawan@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Hendra Gunawan', 'Backend Development', 'STUDENT', 'Universitas Hasanuddin', 'Group B', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('b7f877c53cbd4cd5', 'BATCH2025', 'siti.nur@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Siti Nurhaliza', 'Frontend Development', 'STUDENT', 'Universitas Gadjah Mada', 'Group A', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('c42dc3f294929b1a', 'BATCH2025', 'eko.prasetyo@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Eko Prasetyo', 'Frontend Development', 'STUDENT', 'Universitas Diponegoro', 'Group A', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('c440ae03e58e9b5f', 'BATCH2025', 'qori.amalia@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Qori Amalia', 'Machine Learning', 'STUDENT', 'Universitas Bina Nusantara', 'Group D', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('c56bbbbb5b26e0a8', 'BATCH2025', 'xavier.pratama@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Xavier Pratama', 'Cloud Computing', 'STUDENT', 'Universitas Atma Jaya', 'Group E', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('cafaa8aae78a520d', 'BATCH2025', 'lukman.hakim@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Lukman Hakim', 'Mobile Development', 'STUDENT', 'Universitas Riau', 'Group C', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('ccfc1644d41ade36', 'BATCH2025', 'indah.permata@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Indah Permata', 'Backend Development', 'STUDENT', 'Universitas Sebelas Maret', 'Group B', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('cee9180ec0acef34', 'BATCH2025', 'budi.santoso@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Budi Santoso', 'Frontend Development', 'STUDENT', 'Institut Teknologi Bandung', 'Group A', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('d2aafe66d6755376', 'BATCH2025', 'kartika.sari@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Kartika Sari', 'Mobile Development', 'STUDENT', 'Universitas Andalas', 'Group C', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('d4b6a4fb7b1c09a7', 'BATCH2025', 'dewi.lestari@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Dewi Lestari', 'Frontend Development', 'STUDENT', 'Universitas Brawijaya', 'Group A', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('ed08dbbbe3a81526', 'BATCH2025', 'rizal.fakhri@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Rizal Fakhri', 'Machine Learning', 'STUDENT', 'Universitas Multimedia Nusantara', 'Group D', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('ef56f00d110131a4', 'BATCH2025', 'ulfa.rahmawati@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Ulfa Rahmawati', 'Cloud Computing', 'STUDENT', 'Universitas Gunadarma', 'Group E', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('f2c69e07f08bb5e0', 'BATCH2025', 'nanda.pratama@student.com', '$2b$10$x.2Cqc7m.xFUh61OY7aGoO.HDL.3DYFvaZ2AluzKUsGnxH1Z6spoK', 'Nanda Pratama', 'Mobile Development', 'STUDENT', 'Universitas Jember', 'Group C', '2025-12-14 01:25:58', '2025-12-14 01:39:58'),
('USR-1762487586841-XX8518AX4', 'BATCH2025', 'admin@gmail.com', '$2a$10$vWUJ2Qea.6f0RCle5jUL3uVnEXhGZxglL0CtmSgiogNfN0XkBdCfW', 'Admin ganteng', 'Machine Learning', 'ADMIN', 'dwadad', 'dwadawd', '2025-11-07 03:53:06', '2025-12-08 13:37:41'),
('USR-1765532881802-VO3RZ2VQM', 'BATCH2025', 'budi.santoso@student.id', '$2a$10$lpD7YIQSZ9pB59kVSp3UxO3EM/xV7KSVFXW9RdhzXGCGRwPRhj1P.', 'Budi Santoso', 'Front-End Web Development', 'STUDENT', 'Universitas Indonesia', NULL, '2025-12-12 09:48:02', '2025-12-13 03:36:28'),
('USR-1765532881907-L5LGUIQKI', 'BATCH2025', 'siti.rahmawati@student.id', '$2a$10$OQ1QfZmEI3jFBN1SIvVEQO0o0wyGdHiIhx.VGWjwErOULSieqZEcO', 'Siti Rahmawati', 'Back-End Development', 'STUDENT', 'Institut Teknologi Bandung', NULL, '2025-12-12 09:48:02', '2025-12-13 03:36:59'),
('USR-1765532882001-93ISZQ8QH', 'BATCH2025', 'ahmad.fauzi@student.id', '$2a$10$FHk4DMvUURcQkuhlhgSIQeENWaFefsJA4k4pYxoKbig8ObXuMrRsC', 'Ahmad Fauzi', 'Multi-Platform App Development', 'STUDENT', 'Universitas Gadjah Mada', NULL, '2025-12-12 09:48:02', '2025-12-13 03:37:11'),
('USR-1765532882096-0WFV6KL5B', 'BATCH2025', 'dewi.lestari@student.id', '$2a$10$qJWdFmDeKxTTp2LfdO7OBOp8M5ShGizh/fzyrsMUOJee2YhuWJQ1C', 'Dewi Lestari', 'Machine Learning', 'STUDENT', 'Institut Teknologi Sepuluh Nopember', NULL, '2025-12-12 09:48:02', '2025-12-13 03:37:22'),
('USR-1765532882184-WCGP1ZUWU', 'BATCH2025', 'rendra.pratama@student.id', '$2a$10$WBl7jnaAAAEz40qMFvRcIO53M1Vd0GolYnEEujhJ8Te1mbjnzvCcO', 'Rendra Pratama', 'Front-End Web Development', 'STUDENT', 'Universitas Brawijaya', NULL, '2025-12-12 09:48:02', '2025-12-13 03:37:32');

-- --------------------------------------------------------

--
-- Struktur dari tabel `worksheets`
--

CREATE TABLE `worksheets` (
  `id` int(11) NOT NULL,
  `checkin_period_id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `group_id` int(11) NOT NULL,
  `activity_description` text NOT NULL,
  `proof_file` varchar(500) DEFAULT NULL,
  `submission_date` datetime NOT NULL,
  `validation_status` enum('pending','completed','completed_late','not_completed') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `worksheets`
--

INSERT INTO `worksheets` (`id`, `checkin_period_id`, `user_id`, `group_id`, `activity_description`, `proof_file`, `submission_date`, `validation_status`, `admin_notes`, `created_at`, `updated_at`) VALUES
(10, 9, '254b88283cb14143', 21, 'hai im a student', 'https://initest', '2025-12-14 15:28:18', 'completed', 'good but not good', '2025-12-14 08:28:18', '2025-12-14 08:29:12'),
(11, 8, '254b88283cb14143', 21, ';lkdladla;dsl ', 'https://asdas', '2025-12-15 09:02:35', 'completed', 'Batch approved', '2025-12-15 02:02:35', '2025-12-15 02:14:15'),
(12, 9, '404abad15829a07e', 21, 'sdadkaslkdlaskd', 'https:///ashgsdg', '2025-12-15 09:04:18', 'completed', 'Batch approved', '2025-12-15 02:04:18', '2025-12-15 02:05:00'),
(13, 8, '404abad15829a07e', 21, 'hjjhjjhjh', 'https://asgdashgdah', '2025-12-15 09:04:27', 'completed', 'Batch approved', '2025-12-15 02:04:27', '2025-12-15 02:14:15');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `capstone_docs`
--
ALTER TABLE `capstone_docs`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `capstone_groups`
--
ALTER TABLE `capstone_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `creator_user_id` (`creator_user_id`),
  ADD KEY `idx_groups_batch_id` (`batch_id`),
  ADD KEY `idx_use_case` (`use_case_id`);

--
-- Indeks untuk tabel `capstone_group_invitations`
--
ALTER TABLE `capstone_group_invitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inviter_user_id` (`inviter_user_id`),
  ADD KEY `idx_invitations_group_id` (`group_id`),
  ADD KEY `idx_invitations_invitee_user_id` (`invitee_user_id`);

--
-- Indeks untuk tabel `capstone_group_members`
--
ALTER TABLE `capstone_group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_per_group` (`user_id`,`group_id`),
  ADD KEY `idx_group_members_group_id` (`group_id`),
  ADD KEY `idx_group_members_user_id` (`user_id`);

--
-- Indeks untuk tabel `capstone_group_rejection_history`
--
ALTER TABLE `capstone_group_rejection_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `use_case_id` (`use_case_id`),
  ADD KEY `idx_group` (`group_id`);

--
-- Indeks untuk tabel `capstone_information`
--
ALTER TABLE `capstone_information`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `capstone_rules`
--
ALTER TABLE `capstone_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch_type` (`batch_id`,`rule_type`);

--
-- Indeks untuk tabel `capstone_timeline`
--
ALTER TABLE `capstone_timeline`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `capstone_use_cases`
--
ALTER TABLE `capstone_use_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch_active` (`batch_id`,`is_active`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Indeks untuk tabel `capstone_use_case_rules`
--
ALTER TABLE `capstone_use_case_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usecase_rule` (`use_case_id`,`rule_id`),
  ADD KEY `idx_use_case` (`use_case_id`),
  ADD KEY `idx_rule` (`rule_id`);

--
-- Indeks untuk tabel `checkin_periods`
--
ALTER TABLE `checkin_periods`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `feedback_360`
--
ALTER TABLE `feedback_360`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_reviewer_reviewee` (`reviewer_id`,`reviewee_id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `idx_batch_group` (`batch_id`,`group_id`),
  ADD KEY `idx_reviewer` (`reviewer_id`),
  ADD KEY `idx_reviewee` (`reviewee_id`);

--
-- Indeks untuk tabel `feedback_360_periods`
--
ALTER TABLE `feedback_360_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_batch_active` (`batch_id`,`is_active`);

--
-- Indeks untuk tabel `registration_periods`
--
ALTER TABLE `registration_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_batch_active` (`batch_id`,`is_active`);

--
-- Indeks untuk tabel `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_batch_setting` (`batch_id`,`setting_key`),
  ADD KEY `idx_batch_setting` (`batch_id`,`setting_key`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_batch_id` (`batch_id`);

--
-- Indeks untuk tabel `worksheets`
--
ALTER TABLE `worksheets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `idx_worksheets_user_id` (`user_id`),
  ADD KEY `idx_worksheets_period_id` (`checkin_period_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `capstone_docs`
--
ALTER TABLE `capstone_docs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `capstone_groups`
--
ALTER TABLE `capstone_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT untuk tabel `capstone_group_invitations`
--
ALTER TABLE `capstone_group_invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT untuk tabel `capstone_group_members`
--
ALTER TABLE `capstone_group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT untuk tabel `capstone_group_rejection_history`
--
ALTER TABLE `capstone_group_rejection_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `capstone_information`
--
ALTER TABLE `capstone_information`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `capstone_rules`
--
ALTER TABLE `capstone_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT untuk tabel `capstone_timeline`
--
ALTER TABLE `capstone_timeline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `capstone_use_cases`
--
ALTER TABLE `capstone_use_cases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `capstone_use_case_rules`
--
ALTER TABLE `capstone_use_case_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT untuk tabel `checkin_periods`
--
ALTER TABLE `checkin_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `feedback_360`
--
ALTER TABLE `feedback_360`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `feedback_360_periods`
--
ALTER TABLE `feedback_360_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `registration_periods`
--
ALTER TABLE `registration_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `worksheets`
--
ALTER TABLE `worksheets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `capstone_groups`
--
ALTER TABLE `capstone_groups`
  ADD CONSTRAINT `capstone_groups_ibfk_1` FOREIGN KEY (`creator_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `capstone_groups_ibfk_2` FOREIGN KEY (`use_case_id`) REFERENCES `capstone_use_cases` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `capstone_group_invitations`
--
ALTER TABLE `capstone_group_invitations`
  ADD CONSTRAINT `capstone_group_invitations_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `capstone_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `capstone_group_invitations_ibfk_2` FOREIGN KEY (`inviter_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `capstone_group_invitations_ibfk_3` FOREIGN KEY (`invitee_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `capstone_group_members`
--
ALTER TABLE `capstone_group_members`
  ADD CONSTRAINT `capstone_group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `capstone_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `capstone_group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `capstone_group_rejection_history`
--
ALTER TABLE `capstone_group_rejection_history`
  ADD CONSTRAINT `capstone_group_rejection_history_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `capstone_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `capstone_group_rejection_history_ibfk_2` FOREIGN KEY (`use_case_id`) REFERENCES `capstone_use_cases` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `capstone_use_case_rules`
--
ALTER TABLE `capstone_use_case_rules`
  ADD CONSTRAINT `capstone_use_case_rules_ibfk_1` FOREIGN KEY (`use_case_id`) REFERENCES `capstone_use_cases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `capstone_use_case_rules_ibfk_2` FOREIGN KEY (`rule_id`) REFERENCES `capstone_rules` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `feedback_360`
--
ALTER TABLE `feedback_360`
  ADD CONSTRAINT `feedback_360_ibfk_1` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_360_ibfk_2` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_360_ibfk_3` FOREIGN KEY (`group_id`) REFERENCES `capstone_groups` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `feedback_360_periods`
--
ALTER TABLE `feedback_360_periods`
  ADD CONSTRAINT `feedback_360_periods_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `registration_periods`
--
ALTER TABLE `registration_periods`
  ADD CONSTRAINT `registration_periods_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `worksheets`
--
ALTER TABLE `worksheets`
  ADD CONSTRAINT `worksheets_ibfk_1` FOREIGN KEY (`checkin_period_id`) REFERENCES `checkin_periods` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `worksheets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `worksheets_ibfk_3` FOREIGN KEY (`group_id`) REFERENCES `capstone_groups` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
