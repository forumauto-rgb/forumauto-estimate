# フォーラムオート 見積システム — Claude 作業メモ

## 商品化チェックリスト（将来対応）

- Supabase の RLS は現在、全テーブルで「anon キー保持者は誰でも読み書き削除可」の方式（2026/7/10 に customers・vehicles へ "Allow anon delete" を追加済み）。
- 自社利用の現状では問題ないが、商品として他社に配布する段階では、認証付きの権限設計（Supabase Auth + ユーザー別 RLS）への見直しが必須。
- anon キーが HTML ソースに埋め込まれている点も同時に見直し対象。
- index.html の顧客・車両マスター(cMaster/vMaster)は `syncMasterToCloud()` で「ローカル全件を upsert で丸ごと再送信」する方式のため、削除後に他タブ/他端末の古いキャッシュが再送信すると削除済みレコードが復活する不具合がある（2026/7/17 発見・応急対策済み、詳細は Claude memory `project_master_delete_revival_bug`）。根治には全件アップサートではなく差分のみ送信する方式への変更が必要。変更規模が大きいため商品化前に着手する。

## 既存の重要ルール（確認）

- 保護対象関数（変更禁止）: `checkPaintDifficulty`, `checkPanelMaterial`, `checkPanelMaterialAI`, `registerPanelMaterial`
- 修正は1つずつ、変更前に grep 確認、変更後に node --check、コミット・デプロイまで実施し日本語で報告
