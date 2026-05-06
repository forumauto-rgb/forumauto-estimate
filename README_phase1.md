# ForumAuto AI Platform

**有限会社フォーラムオート** — 外車・高級車専門 鈑金塗装修理  
静岡県袋井市下山梨545 / TEL: 0538-49-0632 / 創業57年

---

## システム概要

高級車・外車オーナー向けのAI受付・修理相談・Shorts自動生成プラットフォーム。  
GitHub Pages + Supabase + Edge Functions による完全サーバーレス構成。

---

## リポジトリ構成（2026-05-06 Phase 1 整理後）

```
forumauto-estimate/
│
├── 【HTMLページ群 - ルートに配置】
│
├── ダッシュボード.html           ← メインダッシュボード（全ページのホーム）
├── forum_auto_agents.html        ← AI受付HP（外車・高級車向け・3キャラクター）
├── index.html                    ← 見積ツール v83（板金塗装修理見積）
├── live.html                     ← Gemini音声接続（リアルタイム音声AI）
├── shorts_dashboard.html         ← Shorts確認・承認ダッシュボード
├── forum_auto_reception.html     ← 受付・レッカー・レンタカー管理
├── customer.html                 ← 顧客管理
├── dashboard_tv.html             ← TV用ダッシュボード（工場モニター）
├── forum_auto_3dscan.html        ← 3Dスキャン管理
├── forumauto_top.html            ← 顧客向けHP
├── kosu_master.html              ← 工数マスタ管理
├── photo_upload.html             ← 写真アップロード（QR対応）
├── レンタル費用.html             ← レンタカー費用・稼働分析
├── セールスダッシュボード.html   ← 売上・粗利分析
├── ステータス.html               ← 修理ステータス管理
├── テレビガイド.html             ← TV表示ガイド
│
├── 【画像ファイル】
├── reiko.jpg                     ← AIキャラクター：麗子（保険・法務担当）
├── aika.jpg                      ← AIキャラクター：愛華（受付担当）
├── mako.jpg                      ← AIキャラクター：真子（技術・塗装担当）
│
├── services/                     ← JSサービスモジュール（Phase 1で整理）
│   ├── voiceService.js           ← 音声処理（ElevenLabs/speechSynthesis切替）
│   ├── avatarService.js          ← 口パク・感情表現・アバター制御
│   ├── aiService.js              ← AI呼び出し抽象化（Claude/GPT/Gemini切替）
│   └── textProcessor.js         ← テキスト整形・読み仮名辞書・感情検出
│
├── scripts/                      ← 自動化スクリプト
│   └── watch_nas.py             ← NAS監視（新動画検出→Shortsパイプライン起動）
│
└── docs/                         ← ドキュメント
    ├── README.md                 ← このファイル（AI Platform設計書）
    └── README_SHORTS.md         ← Shortsパイプライン設計・セットアップ手順
```

---

## Supabase 構成（Edge Functions）

```
Supabase Project: uhppgdwbyrijnqpvusxw
│
├── Edge Functions/
│   ├── ai-proxy          ← Claude/Gemini/OpenAI呼び出し（APIキーはSecrets）
│   ├── voice-proxy       ← ElevenLabs音声合成（APIキーはSecrets）
│   ├── shorts-pipeline   ← AI解析・ナレーション生成・FFmpeg指示
│   └── youtube-proxy     ← YouTube Shorts投稿（OAuth設定後に有効化）
│
├── Database/
│   └── shorts_queue      ← Shorts処理キューテーブル
│
└── Secrets/
    ├── CLAUDE_API_KEY        ✅ 設定済み
    ├── ELEVENLABS_API_KEY    ⏳ ElevenLabs設定後
    ├── VOICE_ID_REIKO        ⏳ ElevenLabs設定後
    ├── VOICE_ID_AIKA         ⏳ ElevenLabs設定後
    ├── VOICE_ID_MAKO         ⏳ ElevenLabs設定後
    └── YOUTUBE_REFRESH_TOKEN ⏳ YouTube OAuth設定後
```

---

## 現在未使用のJSファイル

以下の4ファイルは `services/` に整理済みですが、
現時点では **どのHTMLからも `<script src>` で読み込まれていません。**

| ファイル | 状態 | 理由 |
|---|---|---|
| `services/voiceService.js` | **未使用（将来用）** | `forum_auto_agents.html` に同等ロジックをインライン統合済み |
| `services/avatarService.js` | **未使用（将来用）** | 同上 |
| `services/aiService.js` | **未使用（将来用）** | 同上 |
| `services/textProcessor.js` | **未使用（将来用）** | 同上 |

### なぜインライン統合なのか
現在の `forum_auto_agents.html` は、GitHub Pagesでの単一ファイル配信を前提に
全ロジックをHTML内の `<script>` タグに統合しています。
Phase 2以降でHTMLをサブフォルダに移動する際に、外部JSとして分離する予定です。

---

## 今後利用予定のサービス・機能

### 音声（voiceService.js）
| 機能 | 状態 | 必要な設定 |
|---|---|---|
| ElevenLabs高品質音声 | ⏳ 準備中 | ElevenLabsアカウント・Voice ID作成 |
| キャラ別音声（麗子・愛華・真子） | ⏳ 準備中 | VOICE_ID_* を Secrets に登録 |
| Web Speech API フォールバック | ✅ 動作中 | 設定不要（現在この方式で動作） |

### アバター（avatarService.js）
| 機能 | 状態 | 必要な設定 |
|---|---|---|
| CSS口パク（写真ベース） | ✅ 動作中 | 設定不要 |
| Live2D アバター | ⏳ Phase 4以降 | Live2D Cubism SDK導入 |
| Three.js 3Dアバター | ⏳ Phase 4以降 | GLTFモデル作成 |

### Shorts自動生成パイプライン
| 機能 | 状態 | 必要な設定 |
|---|---|---|
| NAS監視（watch_nas.py） | ⏳ NAS設定後 | UGOS Task Scheduler登録 |
| AI解析・ナレーション生成 | ✅ Edge Function稼働中 | CLAUDE_API_KEY設定済み |
| ElevenLabsナレーション音声 | ⏳ ElevenLabs設定後 | ELEVENLABS_API_KEY登録 |
| FFmpegぼかし処理 | ⏳ NAS設定後 | NASにFFmpegインストール |
| Shorts確認ダッシュボード | ✅ 稼働中 | 設定不要 |
| YouTube自動投稿 | ⏳ OAuth設定後 | youtube-proxyデプロイ |

### AI機能
| 機能 | 状態 | 備考 |
|---|---|---|
| Claude AIチャット | ✅ 稼働中 | ai-proxy経由 |
| 見積AIアシスト | ✅ 稼働中 | index.html内 |
| 保険交渉AIサポート | ✅ 稼働中 | index.html内 |
| 写真解析AI | ✅ 稼働中 | index.html内 |
| Gemini切替 | ⏳ 将来 | GEMINI_API_KEY設定で切替可能 |

---

## 移行ロードマップ

| Phase | 内容 | 状態 |
|---|---|---|
| Phase 1 | JSファイルを services/ に整理 | ✅ 完了 |
| Phase 2 | shorts_dashboard / live / forum_auto_agents をサブフォルダへ | ⏳ 次回 |
| Phase 3 | index.html（見積ツール）をサブフォルダへ | ⏳ 後日 |
| Phase 4 | Live2D / Three.js アバター導入 | ⏳ 将来 |
| Phase 5 | SaaS化（他店舗への提供） | ⏳ 将来 |

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | HTML / CSS / JavaScript（バニラ）|
| ホスティング | GitHub Pages |
| バックエンド | Supabase（PostgreSQL + Edge Functions）|
| AI | Claude（Anthropic）/ Gemini（Google）|
| 音声合成 | ElevenLabs（設定後）/ Web Speech API（現在）|
| 動画処理 | FFmpeg（NAS側）|
| NAS | UGREEN NASync DXP4800 Plus |

---

## AIへの注意事項（Claude / Codex / ChatGPT 向け）

このリポジトリを解析するAIへ：

1. **`services/` の4つのJSファイルは現在未使用**です。
   HTMLを修正する際も `<script src="services/voiceService.js">` を自動追加しないでください。

2. **`ダッシュボード.html` は全ページのホーム**です。
   このファイルへのリンクを変更・削除しないでください。

3. **Supabase の anon key はフロントに置いてOK**です。
   課金APIキー（Claude・ElevenLabs・YouTube）はすべてEdge Function側のSecretsで管理しています。

4. **GitHub Pages は `main` ブランチのルートを公開**しています。
   サブフォルダへHTMLを移動する場合は、必ず内部リンクの更新も同時に行ってください。

5. **コード変更は必ずfeatureブランチで**行い、mainには直接コミットしないでください。
