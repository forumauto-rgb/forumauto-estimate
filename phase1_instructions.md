# Phase 1 実施手順書

実施日: 2026-05-06  
ブランチ: `refactor-folder-structure`  
担当: 仁志さん（GitHub WebUI操作）

---

## 事前確認結果（重要）

調査の結果、**voiceService.js / avatarService.js / aiService.js / textProcessor.js は、
現在どのHTMLからも `<script src>` で読み込まれていません。**

理由: `forum_auto_agents.html` は全ロジックをインライン（HTML内の `<script>` タグ）に
統合済みのため、外部JSファイルは「将来の分離用」として用意されたものです。

**→ JSファイルを services/ に移動しても、import/script src の修正は不要です。**

---

## Phase 1 でやること（HTMLは一切触らない）

```
移動するもの:
  voiceService.js    → services/voiceService.js
  avatarService.js   → services/avatarService.js
  aiService.js       → services/aiService.js
  textProcessor.js   → services/textProcessor.js
  README.md          → docs/README.md
  README_SHORTS.md   → docs/README_SHORTS.md
  watch_nas.py       → scripts/watch_nas.py

追加するもの:
  docs/README.md に現在の構成図を追記

変更しないもの（全HTMLファイル・全画像・ダッシュボード）:
  一切変更なし
```

---

## GitHub WebUI での操作手順

### ① ブランチを作成

1. `https://github.com/forumauto-rgb/forumauto-estimate` を開く
2. 左上の **「main ▼」** をクリック
3. テキストボックスに `refactor-folder-structure` と入力
4. **「Create branch: refactor-folder-structure from main」** をクリック

---

### ② JSファイルを services/ に移動

**1ファイルずつ以下の手順を繰り返す（4回）:**

`voiceService.js` の移動手順：
1. `refactor-folder-structure` ブランチになっていることを確認
2. `voiceService.js` をクリックして開く
3. 右上の **鉛筆アイコン（Edit）** をクリック
4. ファイル名の欄（上部の `voiceService.js` と表示されている部分）をクリック
5. 先頭に `services/` と入力 → `services/voiceService.js` になる
6. 下部の **「Commit changes」** をクリック
7. コミットメッセージ: `move voiceService.js to services/`
8. **「Commit directly to refactor-folder-structure branch」** を選択して確定

同様に残り3ファイルも移動：
- `avatarService.js` → `services/avatarService.js`
- `aiService.js` → `services/aiService.js`
- `textProcessor.js` → `services/textProcessor.js`

---

### ③ ドキュメントを docs/ に移動

同様の手順で：
- `README.md` → `docs/README.md`
- `README_SHORTS.md` → `docs/README_SHORTS.md`

コミットメッセージ: `move docs to docs/`

---

### ④ スクリプトを scripts/ に移動

- `watch_nas.py` → `scripts/watch_nas.py`

コミットメッセージ: `move watch_nas.py to scripts/`

---

### ⑤ docs/README.md に構成図を追記

`docs/README.md` を開いて編集モードにし、
先頭に以下を追加してコミット：

```markdown
## 現在のリポジトリ構成（2026-05-06 Phase 1 整理後）

forumauto-estimate/
├── index.html                    ← 見積ツール v83
├── ダッシュボード.html           ← メインダッシュボード（全ファイルのホーム）
├── forum_auto_agents.html        ← AI受付HP（外車・高級車向け）
├── live.html                     ← Gemini音声接続
├── shorts_dashboard.html         ← Shorts確認・承認ダッシュボード
├── forum_auto_reception.html     ← 受付システム
├── customer.html                 ← 顧客管理
├── dashboard_tv.html             ← TV用ダッシュボード
├── forum_auto_3dscan.html        ← 3Dスキャン
├── forumauto_top.html            ← 顧客向けHP
├── kosu_master.html              ← 工数マスタ
├── photo_upload.html             ← 写真アップロード
├── レンタル費用.html             ← レンタカー管理
├── セールスダッシュボード.html   ← 売上分析
├── ステータス.html               ← ステータス管理
├── テレビガイド.html             ← テレビガイド
├── reiko.jpg / aika.jpg / mako.jpg  ← AIキャラクター画像
│
├── services/                     ← JSサービスモジュール（Phase 1で整理）
│   ├── voiceService.js           ← 音声処理（ElevenLabs/speechSynthesis）
│   ├── avatarService.js          ← 口パク・アバター制御
│   ├── aiService.js              ← AI呼び出し抽象化
│   └── textProcessor.js         ← テキスト整形・読み仮名辞書
│
├── scripts/                      ← 自動化スクリプト
│   └── watch_nas.py             ← NAS監視スクリプト
│
├── docs/                         ← ドキュメント
│   ├── README.md                 ← このファイル（AI Platform設計書）
│   └── README_SHORTS.md         ← Shortsパイプライン手順書
│
└── edge-functions/（Supabase管理）
    ├── ai-proxy                  ← Claude/Gemini/OpenAI呼び出し
    ├── voice-proxy               ← ElevenLabs音声合成
    ├── shorts-pipeline           ← AI解析・ナレーション生成
    └── youtube-proxy             ← YouTube Shorts自動投稿（未設定）
```

---

### ⑥ GitHub Pages で動作確認

以下URLにアクセスして表示を確認：

```
https://forumauto-rgb.github.io/forumauto-estimate/
https://forumauto-rgb.github.io/forumauto-estimate/forum_auto_agents.html
https://forumauto-rgb.github.io/forumauto-estimate/ダッシュボード.html
```

**確認ポイント：**
- [ ] ダッシュボードが表示される
- [ ] AI受付ページが表示される
- [ ] キャラクター画像（麗子・愛華・真子）が表示される
- [ ] AI応答が動く（Supabase接続確認）
- [ ] 音声が動く

---

### ⑦ main にマージ

動作確認OKなら：
1. GitHubの `refactor-folder-structure` ブランチのページを開く
2. **「Compare & pull request」** をクリック
3. タイトル: `Phase 1: JSファイルをservices/に整理`
4. **「Create pull request」** → **「Merge pull request」**

---

## 変更ファイル一覧（Phase 1 完了後）

### 移動（削除+追加）
| 操作 | 旧パス | 新パス |
|---|---|---|
| 移動 | `voiceService.js` | `services/voiceService.js` |
| 移動 | `avatarService.js` | `services/avatarService.js` |
| 移動 | `aiService.js` | `services/aiService.js` |
| 移動 | `textProcessor.js` | `services/textProcessor.js` |
| 移動 | `README.md` | `docs/README.md` |
| 移動 | `README_SHORTS.md` | `docs/README_SHORTS.md` |
| 移動 | `watch_nas.py` | `scripts/watch_nas.py` |

### 更新
| 操作 | ファイル | 内容 |
|---|---|---|
| 更新 | `docs/README.md` | 現在の構成図を追記 |

### 変更なし（全HTMLファイル）
| ファイル | 理由 |
|---|---|
| `ダッシュボード.html` | HTMLは Phase 2以降 |
| `forum_auto_agents.html` | HTMLは Phase 2以降 |
| `index.html` | HTMLは Phase 3以降 |
| `live.html` | HTMLは Phase 2以降 |
| `shorts_dashboard.html` | HTMLは Phase 2以降 |
| その他全HTML | HTMLは Phase 2以降 |
| `reiko.jpg` / `aika.jpg` / `mako.jpg` | 画像はルートのまま |

---

## 動作比較記録

### Phase 1 実施前
- GitHub Pages: 正常動作
- AI受付（forum_auto_agents.html）: 動作中
- 見積ツール（index.html）: 動作中
- Shorts管理（shorts_dashboard.html）: 動作中

### Phase 1 実施後（確認予定）
- [ ] GitHub Pages: 変化なし（HTMLを触っていないため）
- [ ] AI受付: 変化なし
- [ ] 見積ツール: 変化なし
- [ ] Shorts管理: 変化なし

### 影響ゼロの根拠
JSファイル（voiceService.js等）は現在どのHTMLからも
`<script src>` で参照されていないことを調査で確認済み。
移動しても既存の動作に影響しない。

---

## 注意事項

- **必ず `refactor-folder-structure` ブランチで作業する**
- **main には直接コミットしない**
- 動作確認後に Pull Request → Merge の手順を踏む
