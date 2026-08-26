# Lensa

Platform esai analitis tentang karakter fiksi. Orang menulis argumen, menandai
tiap klaim sebagai **Textual / Interpretive / Speculative**, dan menulis
counterpoint terhadap esai orang lain.

Next.js (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres, magic link).
Server Components secara default; Client Component hanya di tempat yang benar-benar
butuh state.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi URL dan anon key dari Supabase
npm run dev
```

Migrasi dijalankan berurutan sesuai nama file, sekali saja, terhadap project
Supabase yang kosong:

```bash
for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

Tiap migrasi dibungkus transaksi, jadi kegagalan di tengah tidak meninggalkan
skema separuh jadi. `0001_init` memasang tabel, RLS, dan trigger yang membuat
baris `profiles` begitu ada user baru di `auth.users`. `0002_claims` memindahkan
klaim ke tempatnya: sitasi menunjuk satu chapter dan boleh lebih dari satu per
blok, counterpoint menjawab satu paragraf lewat tabelnya sendiri dengan dua
jawaban steelman, contest adalah satu pembaca menandai satu blok, dan taksonomi
lensa jadi tabel yang bisa dibaca.

`seed.sql` mengisi tiga penulis, empat karakter, enam esai terbit dengan campuran
tipe klaim, dua di antaranya counterpoint yang sudah lewat steelman gate, plus
blok yang dikontes, blok Textual tanpa sitasi, posisi baca, dan ledger klaimnya.

Tipe TypeScript dibangkitkan dari skema. Setelah mengubah migrasi:

```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts
```

Di Supabase dashboard, Authentication → Providers, nyalakan **Email** (magic
link). Google opsional — tombolnya sudah ada di `/signin`.

```bash
npm test
```

Sepuluh assertion terhadap aturan yang tidak boleh salah: tesis satu kalimat,
deskripsi karakter dua kalimat, demosi klaim Textual yang belum bersumber, dan
penomoran paragraf yang melewati heading.

## Peta rute

| Rute | Isi |
| --- | --- |
| `/` | Feed, filter lensa lewat `?lens=` |
| `/lenses` · `/rules` | Enam lensa; aturan menulis |
| `/characters` · `/characters/new` | Indeks karakter; form tambah karakter |
| `/c/[slug]` · `/c/[slug]/claims` | Halaman karakter; claim ledger |
| `/w/[slug]` · `/works` | Halaman karya; indeks karya |
| `/e/[slug]` | Reader — badge margin, sitasi, spoiler gate, revisi |
| `/u/[handle]` | Profil penulis |
| `/search?q=` | Hasil pencarian: Characters, Works, Essays, Writers |
| `/signin` · `/auth/callback` · `/welcome` | Magic link; onboarding tiga langkah |
| `/write` · `/write/[id]` | Pilih karakter; editor |
| `/counterpoint/new/[essayId]` | Steelman gate, langkah satu |
| `/me` · `/settings` | Draft, terbit, respons; akun dan posisi baca |
| `/design/states` | Seluruh inventaris komponen, semua state, dua tema |

## Component library

`src/components/kit`. Setiap komponen bertipe, menerima `className`, dan tidak
menulis satu warna pun — kelas yang dipakainya ada di `src/app/globals.css`,
satu-satunya file yang boleh memuat hex.

```
Button (primary · secondary) · TextButton · DestructiveAction
TextInput · CounterTextarea · Select · SearchField
LensChip · ClaimBadge · CitationChip · SpoilerBlock
Avatar · Divider · MetadataLabel · Pagination · Toast
ChecklistItem · LensPickerRow · SelfAuditRow
```

State yang berlaku: default, hover, focus visible, active, disabled, loading.
Field menambah **accepted** (underline moss 2px) dan **rejected** (underline
oxblood 2px plus satu baris small caps yang menyebut alasannya).

Hover, focus, dan active bisa dirender statis lewat prop `force`. Aturan CSS-nya
menyebut pseudo-class dan `[data-force]` dalam satu rule yang sama, jadi spesimen
di `/design/states` tidak bisa menyimpang dari komponen aslinya.

Dua hal yang dijamin di level kelas, bukan di level komponen — jadi tetap berlaku
untuk markup lama yang belum memakai kit:

- Setiap text button dapat target 44px dari `.text-btn::after { inset: -12px -8px }`.
- Setiap kontrol yang sedang diam — input, textarea, select, search field,
  checkbox belum dicentang, chip belum dipilih, secondary button — memakai
  `--edge`. `--rule` hanya untuk divider, border kartu dan toast, pemisah baris,
  dan kontrol disabled.


## Constraint desain

Semua token ada di [`src/app/globals.css`](src/app/globals.css). Yang di bawah ini
bukan preferensi — kalau salah satu dilanggar, tampilannya berhenti jadi Lensa.

- **Tidak ada shadow.** `box-shadow` dan `text-shadow` di-reset ke `none !important`
  pada `*`. Kedalaman dibawa hairline (`--rule`) dan raised ground (`--raised`).
- **Radius 2px untuk kontrol, 0 untuk kartu.** Semua skala radius Tailwind —
  termasuk `--radius-full` — dipetakan ke 2px, jadi `rounded-full` tidak bisa
  menghasilkan pill. Avatar kotak.
- **Measure badan esai tidak pernah lewat 680px.** Kelebihan viewport jadi margin.
  Page container maksimal 1080px lalu center.
- **Loading itu state statis.** `.loading` = opacity turun plus label small caps.
  Tidak ada spinner, tidak ada skeleton shimmer.
- **Literata** untuk badan esai, judul, dan nilai form. **Inter** untuk UI, label
  metadata, dan tombol. Label metadata selalu Inter 500 12px uppercase `.08em`
  (`.meta`).
- **Tinggi kontrol 44px.** Text button dapat target sentuh 44px lewat
  `::after { inset: -12px -8px }`, bukan lewat padding yang menggeser layout.

### Aturan token

| Token | Dipakai untuk |
| --- | --- |
| `--rule` | Divider, border kartu, border toast, pemisah baris, kontrol disabled |
| `--edge` | Batas kontrol interaktif saat rest: underline input/textarea/select, border secondary button, search field, lens chip unselected, checkbox unchecked |
| `--focus` | Focus ring 2px solid, offset 2px, di semua elemen interaktif. Tidak pernah dihapus |
| `--accent` | Empat hal saja: klaim contested, error, aksi destruktif, sitasi belum ada. Bukan focus ring, bukan wordmark |

### Claim badge

Textual moss `border-left: 3px solid` · Interpretive ochre `2px solid` ·
Speculative violet `2px dashed`. Label, tint, dan berat border semuanya berbeda —
warna tidak pernah jadi satu-satunya pembeda.

### Breakpoints

640 / 1024 / 1280, terpasang sebagai `sm` / `md` / `lg` di `@theme`.

- Di bawah 1024: badge margin jadi label inline di atas paragraf, rail kiri jadi
  drawer 200px, citation drawer jadi bottom sheet.
- 1024 ke atas: badge kembali ke margin — kolom 132px, gutter 32px — dan rail
  permanen dengan label selalu terpasang.
- 1280 ke atas: citation drawer duduk di samping measure, bukan menimpa.

## Keputusan yang perlu diketahui

- **Enforcement sitasi adalah peringatan, bukan blocker.** Checklist pra-terbit
  menghitung klaim Textual yang belum bersumber dan menampilkannya dalam oxblood,
  tapi tetap mengizinkan publish. Klaim itu terbit dengan badge Interpretive dan
  dashed underline sampai disumberkan (`effectiveClaimKind` di `src/lib/types.ts`).
- **Steelman gate hanya berlaku untuk counterpoint.** Itu satu-satunya hal yang
  benar-benar memblokir publish, dan tidak menyentuh esai biasa.
- **Tidak ada konten yang dihasilkan mesin.** Tidak ada asisten di editor, tidak
  ada saran lensa, tidak ada deteksi spekulasi otomatis. Penggantinya manual:
  checklist yang ditandai penulis sendiri, definisi lensa yang ditulis lengkap di
  tempat memilih, dan self audit yang menelanjangi format jadi kolom claim type.
- **Kolapsnya rail dan tema disimpan di cookie**, dibaca server, dibalik lewat
  Server Action. Tidak ada client store untuk chrome.
- **Filter dan sort lewat `searchParams`**, bukan state — feed, ledger, dan roster
  karya tetap jalan tanpa JavaScript dan tetap bisa di-share sebagai URL.
- **Hapus akun butuh service-role key** yang belum ada di sini, jadi `/settings`
  mengarahkan ke permintaan lewat email, bukan tombol satu klik. Export sudah
  jalan penuh di `/api/export`.
