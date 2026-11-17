# FCFS Learning Simulator v2

Media pembelajaran interaktif algoritma First Come First Served (FCFS), Kelompok 5, Sistem Operasi.

## Teknologi
- React + Vite + TypeScript
- Motion.dev (`motion`) untuk animasi React, antrean, transisi konten, dan feedback visual.
- Anime.js (`animejs`) untuk animasi angka metrik ketika hasil simulasi tampil.
- shadcn/ui Charts pattern dengan Recharts untuk diagram Gantt. Komponen ChartContainer dan ChartTooltip disediakan di `src/components/ui/chart.tsx`.
- Tailwind CSS v4 untuk fondasi styling, dengan CSS komponen khusus.

## Cara menjalankan
Pastikan Node.js 20.19+ atau 22.12+ dan npm sudah terpasang.

```bash
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite, biasanya http://localhost:5173.

## Build produksi
```bash
npm run build
npm run preview
```

## Fitur
- Materi ringkas FCFS, FIFO, non-preemptive, dan rumus.
- Input Arrival Time dan Burst Time secara manual.
- Tambah dan hapus proses.
- Simulasi data contoh CJR: P1(AT 0, BT 3), P2(AT 0, BT 2), P3(AT 2, BT 4), P4(AT 10, BT 3), P5(AT 12, BT 2).
- Diagram Gantt berdasarkan timeline dengan Recharts.
- Visualisasi ready queue, CPU, dan proses selesai menggunakan Motion.dev.
- Animasi angka hasil menggunakan Anime.js.
- Perhitungan CT, TAT, WT, RT, rata-rata WT/TAT, CPU Utilization, dan Throughput.
- Penjelasan urutan kejadian dan kuis pemahaman.

## Aturan
- Proses diurutkan berdasarkan Arrival Time.
- Jika Arrival Time sama, urutan input menjadi penentu.
- FCFS bersifat non-preemptive.
- Jika belum ada proses yang datang, CPU berada dalam kondisi idle.

## Catatan
Komponen chart mengikuti pola API shadcn/ui Charts dan menggunakan Recharts sebagai mesin chart. Komponen tersebut berada di `src/components/ui/chart.tsx`, sedangkan implementasi diagram Gantt ada di `src/components/GanttChart.tsx`.


## Pembaruan antarmuka v4
- Ukuran font dan jarak antarelemen diperbesar agar lebih mudah dibaca.
- Kartu materi, panel simulator, metrik, dan hasil perhitungan disusun ulang dengan ukuran yang lebih seimbang.
- Layout menyesuaikan desktop, tablet, dan ponsel.
- Tombol Jalankan Simulasi menghitung data lalu menggulir otomatis ke bagian Hasil Simulasi.
- Menu Latihan membuka kuis FCFS berisi 8 soal pilihan ganda, pembahasan per jawaban, progres, nilai akhir, dan fitur mengulang latihan.

Jalankan dengan:
```bash
npm install
npm run dev
```


## Pembaruan v5: navigasi per halaman dan latihan berbasis kasus
- Beranda, Materi, Simulator, Hasil, dan Latihan Soal kini tampil sebagai halaman terpisah melalui navigasi.
- Tombol Mulai Simulasi membuka halaman simulator.
- Tombol Jalankan Simulasi memproses data dan berpindah ke halaman Hasil.
- Latihan soal menggunakan lima studi kasus dengan tabel Arrival Time dan Burst Time. Peserta menganalisis data, memilih jawaban, lalu membaca pembahasan dan nilai akhir.

## Pembaruan v6
- Bagian "Urutan kejadian" di halaman hasil dihapus agar hasil lebih ringkas.
- Tipografi diganti menjadi Outfit untuk teks isi dan Space Grotesk untuk judul agar tampil lebih berkarakter dan tetap mudah dibaca.
