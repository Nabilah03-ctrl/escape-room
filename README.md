# TIBA+ meN- — Versi GitHub Pages

Permainan enam bilik, 24 cabaran imbuhan meN- untuk Bahasa Melayu Tahun 2.
Dihoskan sebagai laman **statik**, dengan model tangan dan WASM disimpan secara setempat di `vendor/` dan `models/`.

## Cara menerbitkan (GitHub Pages)

1. Cipta repository **Public** bernama `tiba-men-enam-pintu` melalui https://github.com/new.
2. **Ekstrak ZIP** yang disediakan. Muat naik **semua kandungan folder** ini (bukan fail ZIP), ke akar repository. `index.html` mestilah di aras yang sama dengan `styles.css`. Gunakan `Add file` → `Upload files`; seret kandungan folder termasuk subfolder `vendor`, `models`, dan `legacy`, kemudian `Commit changes`.
3. `Settings` → `Pages` → `Build and deployment`: pilih `Deploy from a branch`, `main`, `/(root)` dan klik `Save`.
4. Lihat alamat di `Settings` → `Pages` selepas deployment berjaya: `https://NAMA-PENGGUNA.github.io/tiba-men-enam-pintu/`. Gantikan NAMA-PENGGUNA dengan username sebenar.

**Jangan** menggunakan `dist` berlapis dalam repository untuk cara ini: `index.html` telah dipindahkan ke akar. Fail `.nojekyll` sengaja disertakan. Tiada `npm install`, Node.js atau sistem backend diperlukan pada GitHub Pages.

## Ujian selepas terbit

- Buka permainan dalam Chrome/Edge versi terkini; cuba butang, input nama/kelas dan permulaan misi.
- Cuba pilihan tetikus terlebih dahulu.
- Cuba kamera pada laman HTTPS dan benarkan akses. MediaPipe HandLandmarker memuatkan model `models/hand_landmarker.task` serta WASM dari `vendor/mediapipe/wasm`. Uji dengan kamera sebenar di peranti sasaran.
- Jika ada 404, periksa bahawa `index.html`, `tracking-worker.js`, folder `models` dan folder `vendor` semuanya dimuat naik.

## Privasi dan rekod

Nama, kelas, kemajuan dan masa disimpan menggunakan `localStorage` pada browser dan origin yang sama. Tiada pangkalan data awan. Dashboard guru hanya boleh melihat rekod pada browser/peranti yang sama. Eksport CSV atau cetak rekod jika perlu. Kamera tidak dihantar ke pelayan aplikasi oleh kod ini. Jangan masukkan API key ke dalam fail frontend.

## Kandungan

- `index.html`, `*.js`, `styles.css`: aplikasi
- `models/`, `vendor/mediapipe/`: model dan modul pengesanan tangan, termasuk lesen MediaPipe
- `legacy/`: versi asal
- `panduan/`: panduan guru, murid dan atribusi pihak ketiga
- `bahan-cetak/`: PDF bahan maujud

Panduan rasmi: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
