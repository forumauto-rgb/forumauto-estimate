# ForumAuto AI Platform — 整理計画書

作成日: 2026-05-06  
対象: forumauto-rgb/forumauto-estimate（GitHub Pages）

---

## 現状の問題点

| 問題 | 詳細 |
|---|---|
| フラット構造 | 全ファイルがルートに混在（21ファイル） |
| 命名の不統一 | `forum_auto_agents.html` `ダッシュボード.html` 等が混在 |
| 役割が不明 | ファイル名だけでは何をするファイルか分かりにくい |
| 重複ファイル | `_bk` ファイルが散在 |
| JS分離不完全 | サービス層JSがルートに混在 |

---

## 新フォルダ構成（目標）

```
forumauto-estimate/（GitHub Pages ルート）
│
├── index.html                    ← ダッシュボード.html（エントリーポイント維持）
│
├── pages/
│   ├── reception/
│   │   └── index.html            ← forum_auto_agents.html
│   ├── estimate/
│   │   └── index.html            ← index.html（見積ツール）※後回し
│   ├── live/
│   │   └── index.html            ← live.html
│   └── shorts/
│       └── index.html            ← shorts_dashboard.html
│
├── services/
│   ├── aiService.js
│   ├── voiceService.js
│   ├── avatarService.js
│   └── textProcessor.js
│
├── assets/
│   ├── images/
│   │   ├── reiko.jpg
│   │   ├── aika.jpg
│   │   └── mako.jpg
│   └── bgm/
│
├── edge-functions/               ← Supabase Edge Function ソース管理用
│   ├── ai-proxy/
│   │   └── index.ts
│   ├── voice-proxy/
│   │   └── index.ts
│   ├── shorts-pipeline/
│   │   └── index.ts
│   └── youtube-proxy/
│       └── index.ts
│
├── db/
│   └── supabase_setup.sql
│
├── scripts/
│   └── watch_nas.py
│
├── archive/                      ← 旧ファイル退避（削除せず保管）
│   ├── forum_auto_agents_bk.html
│   └── shorts_dashboard_bk.html
│
└── docs/
    ├── README.md
    └── README_SHORTS.md
```

---

## ファイル新旧対応表

### HTMLファイル

| 旧パス（現在） | 新パス（移行後） | 優先度 | 注意事項 |
|---|---|---|---|
| `ダッシュボード.html` | `index.html`（またはそのまま） | 🔴 最重要 | 全ファイルのホームリンクがここを指す |
| `forum_auto_agents.html` | `pages/reception/index.html` | 🟡 中 | 画像パス `reiko.jpg` 等を `../../assets/images/` に変更 |
| `index.html`（見積） | `pages/estimate/index.html` | 🔴 最重要 | リンクが多いため**Phase 3以降** |
| `live.html` | `pages/live/index.html` | 🟢 低 | `ダッシュボード.html` への戻りリンクあり |
| `shorts_dashboard.html` | `pages/shorts/index.html` | 🟢 低 | フルURL参照のため影響小 |
| `dashboard_tv.html` | `pages/dashboard/tv.html` | 🟢 低 | |
| `forum_auto_reception.html` | `pages/reception/reception.html` | 🟢 低 | |
| `customer.html` | `pages/customer/index.html` | 🟢 低 | |
| `kosu_master.html` | `pages/master/kosu.html` | 🟢 低 | |
| `photo_upload.html` | `pages/photo/index.html` | 🟢 低 | |
| `レンタル費用.html` | `pages/rental/index.html` | 🟢 低 | |
| `セールスダッシュボード.html` | `pages/sales/index.html` | 🟢 低 | |
| `ステータス.html` | `pages/status/index.html` | 🟢 低 | |
| `テレビガイド.html` | `pages/guide/index.html` | 🟢 低 | |
| `forum_auto_3dscan.html` | `pages/scan/index.html` | 🟢 低 | |
| `forumauto_top.html` | `pages/top/index.html` | 🟢 低 | 顧客向けHP |
| `forum_auto_agents.html` | `pages/agents/index.html` | 🟢 低 | |

### JSファイル

| 旧パス | 新パス | 変更内容 |
|---|---|---|
| `voiceService.js` | `services/voiceService.js` | パスのみ変更 |
| `avatarService.js` | `services/avatarService.js` | パスのみ変更 |
| `aiService.js` | `services/aiService.js` | パスのみ変更 |
| `textProcessor.js` | `services/textProcessor.js` | パスのみ変更 |

### Edge Functions / その他

| 旧パス | 新パス |
|---|---|
| `voice-proxy_index.ts` | `edge-functions/voice-proxy/index.ts` |
| `shorts-pipeline_index.ts` | `edge-functions/shorts-pipeline/index.ts` |
| `youtube-proxy_index.ts` | `edge-functions/youtube-proxy/index.ts` |
| `supabase_setup.sql` | `db/supabase_setup.sql` |
| `watch_nas.py` | `scripts/watch_nas.py` |
| `README.md` | `docs/README.md` |
| `README_SHORTS.md` | `docs/README_SHORTS.md` |

### アーカイブ（削除せず退避）

| ファイル | 退避先 |
|---|---|
| `forum_auto_agents_bk.html` | `archive/` |
| `shorts_dashboard_bk.html` | `archive/` |

---

## 移行フェーズ計画

### Phase 1（今すぐ・リスクゼロ）
**コードを一切変更せず、フォルダ構造だけ整える**

対象：
- `services/` フォルダ作成 → JS4ファイルを移動
- `edge-functions/` フォルダ作成 → TSファイルを移動
- `db/` フォルダ作成 → SQLファイルを移動
- `scripts/` フォルダ作成 → `watch_nas.py` を移動
- `docs/` フォルダ作成 → READMEを移動
- `archive/` フォルダ作成 → `_bk` ファイルを移動

**影響：** GitHub Pagesの表示に一切影響しない（HTMLファイルはそのまま）

---

### Phase 2（慎重に・1ファイルずつテスト）
**動作確認が容易な単独ページから移行**

対象（この順番で）：
1. `shorts_dashboard.html` → `pages/shorts/index.html`
   - 内部リンク：フルURL参照のため影響ほぼなし
   - 変更：`ダッシュボード.html` へのリンクをフルURLに変更
   
2. `live.html` → `pages/live/index.html`
   - 変更：戻りリンク `ダッシュボード.html` → フルURL

3. `forum_auto_agents.html` → `pages/reception/index.html`
   - 変更：画像パス `reiko.jpg` → `../../assets/images/reiko.jpg`
   - 変更：JSパス → `../../services/voiceService.js` 等

各ファイル移行後に必ずGitHub Pagesで動作確認してから次へ進む。

---

### Phase 3（慎重に・最後）
**見積ツール（index.html）の移行**

`index.html` は 6,900行・最も複雑なため最後に実施。
内部リンク `index_top.html` への参照を修正。

---

## 確認チェックリスト（各Phase後に実施）

| 確認項目 | 方法 |
|---|---|
| GitHub Pagesで表示されるか | ブラウザで実際にアクセス |
| 画像が表示されるか | 開発者ツール → Networkタブでエラー確認 |
| 内部リンクが機能するか | 各ボタン・リンクをクリック |
| Supabase接続が動くか | AI応答・データ取得を確認 |
| 音声・口パクが動くか | forum_auto_agents.html で動作確認 |
| Shorts管理が動くか | shorts_dashboard.html で動作確認 |

---

## リスク評価

| リスク | 対象 | 対策 |
|---|---|---|
| 🔴 画像パス破損 | jpg ファイル | 移行時に相対パスを必ず更新 |
| 🔴 内部リンク切れ | `ダッシュボード.html` 参照箇所 | フルURLに変更 |
| 🟡 JS読み込み失敗 | voiceService.js 等 | `<script src>` のパスを更新 |
| 🟢 Edge Function URL | Supabase URL | コード内に直書きのため変更なし |
| 🟢 Supabase anon key | 全HTML | コード内に直書きのため変更なし |

---

## 今すぐ実施しない理由（後回し判断）

- `index.html`（見積ツール）は6,900行・内部参照が複雑なため、**十分なテスト時間が確保できるまで移行しない**
- `ダッシュボード.html` は全ファイルのホームであり、**パス変更の影響が最大**のため最後
- 現時点でGitHub Pagesは正常動作しているため、**無理に急がない**

---

## 推奨実施順

```
今すぐ（Phase 1）:  services/ edge-functions/ db/ scripts/ docs/ archive/ の作成
                    → HTMLは一切触らない・ゼロリスク

次回（Phase 2）:   shorts_dashboard → live → forum_auto_agents の順に1つずつ
                    → 各移行後にブラウザで動作確認

後日（Phase 3）:   index.html（見積ツール）最後
```
