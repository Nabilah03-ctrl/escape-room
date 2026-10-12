# Cara dapatkan link permainan melalui GitHub Pages

1. Buka **https://github.com/new** → namakan repository `tiba-men-enam-pintu` → **Public** → **Create repository**.
2. Ekstrak `tiba-men-github-pages-siap.zip` dan buka folder yang diekstrak.
3. Di repository GitHub, klik **Add file → Upload files** (atau **uploading an existing file** bagi repository kosong).
4. Seret **semua fail dan folder di dalam folder ekstrak**, bukan folder induk dan bukan fail ZIP. Pastikan `index.html` berada di akar repo, `vendor/mediapipe/` dan `models/` lengkap. Klik **Commit changes**.
5. Klik **Settings → Pages → Build and deployment**. Pilih **Deploy from a branch** → branch **main** → folder **/(root)** → **Save**.
6. Selepas penerbitan berjaya, klik **Visit site**. URL lazim: `https://USERNAME.github.io/tiba-men-enam-pintu/`.
7. Uji tetikus, nama/kelas, misi dan akses kamera di browser moden. Jika kamera tidak hidup, semak kebenaran kamera dan lihat ralat pada **Developer Tools → Console**.

**Perhatian:** Hosting GitHub Pages tidak mengumpulkan rekod semua komputer. Rekod permainan pada browser masing-masing sahaja. Jangan berkongsi data sebenar murid dalam repository awam.
