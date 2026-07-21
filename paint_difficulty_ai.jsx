import { useState } from "react";

// ============================================================
// 塗装難色データベース（57年の現場知識を凝縮）
// ============================================================
const PAINT_DATABASE = {
  // === 超難色（キャンディ・3ステージ系）===
  "46V": {
    maker: "マツダ", name: "ソウルレッドクリスタルメタリック",
    level: "超難色", levelColor: "#c0392b",
    surcharge: "50〜80%割増",
    type: "カラークリヤー系（3コート）",
    warnings: [
      "色付きクリヤーの塗り回数で濃度が変わる。2回と3回で別物になる",
      "正面・左右は合っても上下方向（透かし）で合わないケースが頻発",
      "ボカシ不可。必ずブロック塗装で対応",
      "旧型41Vと別の専用塗料が必要。流用不可"
    ],
    procedure: "カラーベース → カラークリヤー × 3回 → クリヤー",
    pigmentCost: "高（色付きクリヤー専用品）",
    note: "板金職人難易度ランキング全国1位"
  },
  "41V": {
    maker: "マツダ", name: "ソウルレッドプレミアムメタリック",
    level: "超難色", levelColor: "#c0392b",
    surcharge: "40〜70%割増",
    type: "カラークリヤー系（3コート）",
    warnings: [
      "現行46Vと専用塗料が異なる。混用厳禁",
      "キャンディ系の中では比較的単純だが依然として高難度",
      "調色が迷宮入りしやすい。試し吹き必須"
    ],
    procedure: "カラーベース → カラークリヤー → クリヤー",
    pigmentCost: "高",
    note: "旧ソウルレッド。現行46Vより若干易しいが要注意"
  },
  "46G": {
    maker: "マツダ", name: "マシーングレープレミアムメタリック",
    level: "超難色", levelColor: "#c0392b",
    surcharge: "50〜80%割増",
    type: "特殊メタリック（3ステージ）",
    warnings: [
      "見た目メタリックだが実はパールと同じ3ステージ構造",
      "メタリックベースを300〜400%希釈して3〜4回極薄塗りが必須",
      "通常塗装の倍以上の時間がかかる",
      "隣接パネルとのテスト塗装（捨て吹き）を必ず先行実施すること",
      "ムラが出やすく、一発勝負は大惨事になるリスクあり"
    ],
    procedure: "カラーベース → 超希釈メタリックベース ×3〜4回 → クリヤー",
    pigmentCost: "高",
    note: "ソウルレッドと並ぶ最高難度。初めて塗る場合はリアドアなど小パネルで免疫をつけてから"
  },
  "51K": {
    maker: "マツダ", name: "スノーフレイクホワイトパールマイカ",
    level: "難色", levelColor: "#e67e22",
    surcharge: "20〜30%割増",
    type: "3コートパール",
    warnings: [
      "3コートパールのため調色が複雑",
      "透かし方向での色ズレに注意"
    ],
    procedure: "カラーベース → パールベース → クリヤー",
    pigmentCost: "中〜高",
    note: "マツダのホワイトパール系"
  },
  "QAB": {
    maker: "日産/スズキ共通", name: "ブリリアントホワイトパール（3P）",
    level: "難色", levelColor: "#e67e22",
    surcharge: "20〜40%割増",
    type: "3コートパール",
    warnings: [
      "GT-R等に採用。3コートのため工程が多い",
      "パール層の塗り量で白さが変わる。均一塗布が命",
      "隣接パネルとの色調整で透かし方向に注意"
    ],
    procedure: "ホワイトベース → パールベース → クリヤー",
    pigmentCost: "中〜高",
    note: "GT-Rのアイデンティティカラー。日産・スズキ共通コード"
  },
  "KAB": {
    maker: "日産", name: "ブリリアントホワイトパール（旧型）",
    level: "難色", levelColor: "#e67e22",
    surcharge: "20〜35%割増",
    type: "3コートパール",
    warnings: [
      "QABの旧型。現行QABとは調色データが異なる",
      "旧型車の場合は年式を確認してコードを区別すること"
    ],
    procedure: "ホワイトベース → パールベース → クリヤー",
    pigmentCost: "中〜高",
    note: "旧型GT-R等。現行QABと混同しないよう注意"
  },
  "070": {
    maker: "トヨタ/スバル/ダイハツ共通", name: "ホワイトパールクリスタルシャイン",
    level: "難色", levelColor: "#e67e22",
    surcharge: "15〜25%割増",
    type: "3コートパール",
    warnings: [
      "採用車種が非常に多く慣れやすいが油断は禁物",
      "パール層の膜厚管理が重要。薄すぎると黄色みが出る",
      "バンパーとボディで色ズレが出やすい"
    ],
    procedure: "ホワイトベース → パールベース → クリヤー",
    pigmentCost: "中",
    note: "国産最多採用3コートパール。ボリューム価格だが技術は要する"
  },
  "3U5": {
    maker: "トヨタ/レクサス", name: "ルビーフレアパールメタリック",
    level: "難色", levelColor: "#e67e22",
    surcharge: "30〜50%割増",
    type: "カラークリヤー系（キャンディ赤系）",
    warnings: [
      "キャンディ赤系。塗り回数で色が変わる",
      "マツダ41Vに近い構造。ボカシ不可",
      "特別色のため塗料コストが高い"
    ],
    procedure: "カラーベース → カラークリヤー → クリヤー",
    pigmentCost: "高",
    note: "ハリアー等採用。トヨタ系キャンディ赤の代表格"
  },
  "083": {
    maker: "トヨタ/レクサス", name: "ホワイトノーヴァガラスフレーク",
    level: "超難色", levelColor: "#c0392b",
    surcharge: "40〜60%割増",
    type: "ガラスフレーク系（3コート）",
    warnings: [
      "ガラスフレーク（ガラス微粒子）使用で調色が極めて複雑",
      "アルミフレークと異なる反射特性があり通常調色では再現困難",
      "専用塗料の入手コストが高く塗料単価が高額",
      "レクサス専用色。調色データが少なく経験者以外は外注推奨"
    ],
    procedure: "ベースコート → ガラスフレークパール → クリヤー",
    pigmentCost: "非常に高（ガラスフレーク原料）",
    note: "レクサスFスポーツ専用。市販補修塗料は3コートセットで高額"
  },
  "8X8": {
    maker: "トヨタ/レクサス", name: "グラファイトブラックガラスフレーク",
    level: "超難色", levelColor: "#c0392b",
    surcharge: "40〜60%割増",
    type: "ガラスフレーク系（ブラック）",
    warnings: [
      "ガラスフレーク黒系。漆黒に微細な輝きがあり調色が難しい",
      "パール粒子の向きが仕上がりに大きく影響する",
      "研磨でフレークが露出するとツヤが崩れる"
    ],
    procedure: "ダークベース → ガラスフレーク → クリヤー",
    pigmentCost: "非常に高",
    note: "レクサス専用ガラスフレークブラック"
  },
  // === メタリック黒ずみ要注意色 ===
  "X11": {
    maker: "ダイハツ/トヨタ共通", name: "シャンパンゴールドメタリック",
    level: "注意色（黒ずみ）", levelColor: "#8e44ad",
    surcharge: "10〜20%割増",
    type: "メタリック（ベージュ・ゴールド系）",
    warnings: [
      "【黒ずみ注意】アルミ粒子の向きが乱れるとボカシ際が黒暗くなる",
      "ベージュ・ゴールド系は黒ずみが目立ちやすい色域",
      "ガン距離・吐出量を一定に保ちアルミ粒子の寝かし方を統一すること",
      "ウェット気味に塗りすぎると粒子が沈んで黒ずむ"
    ],
    procedure: "メタリックベース → クリヤー",
    pigmentCost: "低〜中",
    note: "ムーヴ・タント等に多い。ボカシ際の黒ずみが頻発する代表色"
  },
  "T29": {
    maker: "ダイハツ", name: "ライトローズマイカメタリックII",
    level: "注意色（黒ずみ）", levelColor: "#8e44ad",
    surcharge: "10〜20%割増",
    type: "マイカメタリック（ピンク・ベージュ系）",
    warnings: [
      "【黒ずみ注意】マイカ（雲母）粒子の量・深度で見え方が変わる",
      "ピンク系は透かし方向での色ズレが特に顕著",
      "ボカシ際は十分広くとること"
    ],
    procedure: "マイカメタリックベース → クリヤー",
    pigmentCost: "中",
    note: "ダイハツ系ピンク・ベージュマイカ。軽自動車で多数採用"
  },
  "T27": {
    maker: "ダイハツ", name: "パウダリーベージュメタリック",
    level: "注意色（黒ずみ）", levelColor: "#8e44ad",
    surcharge: "10〜20%割増",
    type: "メタリック（ベージュ系）",
    warnings: [
      "【黒ずみ注意】ソフトなベージュのため際の色変化が目立ちやすい",
      "エアブラシ圧が高すぎると粒子が起きて青白く見える",
      "反対に低圧・近距離すぎると粒子が寝て黒ずむ"
    ],
    procedure: "メタリックベース → クリヤー",
    pigmentCost: "低〜中",
    note: "タント・キャンバス等。軟調ベージュ系のボカシ際に要注意"
  },
  "T28": {
    maker: "ダイハツ/トヨタ共通", name: "トープグレーメタリック",
    level: "注意色（黒ずみ）", levelColor: "#8e44ad",
    surcharge: "10〜20%割増",
    type: "メタリック（グレー系）",
    warnings: [
      "【黒ずみ注意】グレー系は黒ずみが最も確認しやすい色域",
      "ボカシ際に濃淡差が出やすい。フェザーエッジを丁寧に"
    ],
    procedure: "メタリックベース → クリヤー",
    pigmentCost: "低〜中",
    note: "グレー系メタリックの黒ずみ典型例"
  },
  "S28": {
    maker: "ダイハツ", name: "フレッシュグリーンメタリック",
    level: "注意色", levelColor: "#8e44ad",
    surcharge: "10〜15%割増",
    type: "メタリック",
    warnings: [
      "グリーン系は調色で赤・青バランスが崩れると全く違う色になる",
      "ボカシ際の透かし変化に注意"
    ],
    procedure: "メタリックベース → クリヤー",
    pigmentCost: "低〜中",
    note: "ダイハツ軽のグリーン系。調色精度が問われる"
  },
  // === 高価顔料系 ===
  "ZVR": {
    maker: "スズキ", name: "スチールシルバーメタリック",
    level: "注意色（黒ずみ）", levelColor: "#8e44ad",
    surcharge: "10〜20%割増",
    type: "メタリック",
    warnings: [
      "【黒ずみ注意】シルバー系は最もボカシ際の黒ずみが確認しやすい",
      "アルミ粒子の向きが不揃いになると黒っぽく沈んで見える",
      "透かし角度（15°・45°）での確認を必ず行うこと"
    ],
    procedure: "シルバーメタリックベース → クリヤー",
    pigmentCost: "低〜中",
    note: "スズキ系シルバー。黒ずみの教科書的な代表色"
  },
  "D4S": {
    maker: "スバル", name: "アイスシルバーメタリック",
    level: "注意色（黒ずみ）", levelColor: "#8e44ad",
    surcharge: "10〜20%割増",
    type: "メタリック",
    warnings: [
      "【黒ずみ注意】青白い輝きが特徴で粒子の向きに非常に敏感",
      "ガン角度を一定に保ちドライ気味に仕上げることで黒ずみを防ぐ"
    ],
    procedure: "シルバーメタリックベース → クリヤー",
    pigmentCost: "中",
    note: "スバル系アイスシルバー。レガシィ・フォレスター等"
  },
  "61K": {
    maker: "スバル", name: "クリスタルホワイトパール",
    level: "難色", levelColor: "#e67e22",
    surcharge: "15〜25%割増",
    type: "3コートパール",
    warnings: [
      "スバルのホワイトパール代表色。3コートのため工程が多い",
      "パール層の均一塗布が重要"
    ],
    procedure: "ホワイトベース → パールベース → クリヤー",
    pigmentCost: "中",
    note: "インプレッサ・XV・フォレスター等に多数採用"
  },
  "NH731P": {
    maker: "ホンダ", name: "クリスタルブラックパール",
    level: "注意色", levelColor: "#8e44ad",
    surcharge: "10〜20%割増",
    type: "ブラックパール",
    warnings: [
      "ブラック系パールは傷・磨きムラが最も目立つ",
      "ボカシ際の研磨でパール粒子が露出しやすい",
      "高品質仕上げには全パネル磨き込みを推奨"
    ],
    procedure: "ブラックベース → パール → クリヤー",
    pigmentCost: "中",
    note: "ホンダ最多採用黒パール。ステップワゴン・ヴェゼル等"
  }
};

const LEVEL_ORDER = { "超難色": 0, "難色": 1, "注意色（黒ずみ）": 2, "注意色": 3 };

// ============================================================
// コンポーネント
// ============================================================
export default function PaintDifficultyAI() {
  const [inputCode, setInputCode] = useState("");
  const [result, setResult] = useState(null);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState("all");
  const [view, setView] = useState("search"); // search | list | ai

  // コード検索
  const handleSearch = () => {
    const code = inputCode.trim().toUpperCase();
    const found = PAINT_DATABASE[code];
    setResult(found ? { code, ...found } : { code, notFound: true });
    setAiAdvice("");
  };

  // AI詳細アドバイス
  const handleAIAdvice = async (paintInfo) => {
    setAiLoading(true);
    setAiAdvice("");
    setView("ai");
    try {
      const prompt = `あなたはフォーラムオート（静岡県袋井市）の57年の経験を持つベテラン板金塗装職人AIアシスタントです。
以下のカラーについて、見積り担当者・塗装職人向けに実践的なアドバイスを日本語で出力してください。

【カラー情報】
メーカー：${paintInfo.maker}
カラーコード：${paintInfo.code}
色名：${paintInfo.name}
難易度：${paintInfo.level}
塗装工程：${paintInfo.procedure}
主な注意点：${paintInfo.warnings.join("、")}

以下の4項目をそれぞれ見出し付きで200字以内でまとめてください：
1. 見積り時のポイント（割増理由の説明方法）
2. 塗装前の準備・確認事項
3. 施工中の最大注意点
4. 保険会社・お客様への説明トーク例（1〜2文）`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "取得できませんでした";
      setAiAdvice(text);
    } catch (e) {
      setAiAdvice("AIアドバイスの取得に失敗しました。");
    }
    setAiLoading(false);
  };

  const filteredDB = Object.entries(PAINT_DATABASE)
    .filter(([, v]) => filterLevel === "all" || v.level.includes(filterLevel))
    .sort(([, a], [, b]) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));

  const getLevelBadge = (level, color) => (
    <span style={{
      background: color, color: "#fff", borderRadius: 6,
      padding: "3px 10px", fontSize: 12, fontWeight: "bold", whiteSpace: "nowrap"
    }}>{level}</span>
  );

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* ヘッダー */}
      <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", borderBottom: "2px solid #c9a227", padding: "16px 20px" }}>
        <div style={{ fontSize: 20, fontWeight: "bold", color: "#c9a227" }}>🎨 塗装難色・注意情報 AIアシスト</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>フォーラムオート｜見積り・施工前チェック専用ツール</div>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", borderBottom: "1px solid #334155", background: "#1e293b" }}>
        {[["search","🔍 コード検索"],["list","📋 難色一覧"],["ai","🤖 AIアドバイス"]].map(([k,label]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: 1, padding: "12px 8px", background: view === k ? "#0f172a" : "transparent",
            border: "none", borderBottom: view === k ? "3px solid #c9a227" : "3px solid transparent",
            color: view === k ? "#c9a227" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: "bold"
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 32px" }}>

        {/* === 検索ビュー === */}
        {view === "search" && (
          <div>
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>カラーコードを入力（例：46V、070、QAB）</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="カラーコード入力"
                  style={{
                    flex: 1, padding: "12px 14px", borderRadius: 8, border: "1px solid #334155",
                    background: "#0f172a", color: "#e2e8f0", fontSize: 15
                  }}
                />
                <button onClick={handleSearch} style={{
                  background: "#c9a227", color: "#000", border: "none", borderRadius: 8,
                  padding: "12px 20px", fontWeight: "bold", cursor: "pointer", fontSize: 14
                }}>検索</button>
              </div>
            </div>

            {result && !result.notFound && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 16, border: `2px solid ${result.levelColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>コード</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: "#c9a227" }}>{result.code}</div>
                  </div>
                  {getLevelBadge(result.level, result.levelColor)}
                </div>
                <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{result.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>{result.maker} ／ {result.type}</div>

                <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#c9a227", fontWeight: "bold", marginBottom: 4 }}>💴 割増目安</div>
                  <div style={{ fontSize: 15, fontWeight: "bold" }}>{result.surcharge}</div>
                </div>

                <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#e74c3c", fontWeight: "bold", marginBottom: 6 }}>⚠️ 塗装注意事項</div>
                  {result.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid #1e293b", display: "flex", gap: 6 }}>
                      <span style={{ color: "#e74c3c", flexShrink: 0 }}>▶</span><span>{w}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div style={{ background: "#0f172a", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>塗装工程</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{result.procedure}</div>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>顔料コスト</div>
                    <div style={{ fontSize: 12, fontWeight: "bold", marginTop: 4, color: result.pigmentCost.includes("高") ? "#e74c3c" : "#e2e8f0" }}>{result.pigmentCost}</div>
                  </div>
                </div>

                {result.note && (
                  <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>補足</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>{result.note}</div>
                  </div>
                )}

                <button onClick={() => handleAIAdvice(result)} style={{
                  width: "100%", background: "linear-gradient(135deg,#1e3a5f,#0f172a)",
                  border: "1px solid #c9a227", color: "#c9a227", borderRadius: 8,
                  padding: "12px", fontWeight: "bold", cursor: "pointer", fontSize: 14
                }}>🤖 AIが詳細アドバイスを生成する</button>
              </div>
            )}

            {result && result.notFound && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ color: "#94a3b8", fontSize: 14 }}>「{result.code}」はデータベースに未登録です</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
                  一覧タブで全登録色を確認するか、<br/>AIアドバイスタブで自由入力相談ができます
                </div>
              </div>
            )}

            {!result && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, color: "#c9a227", fontWeight: "bold", marginBottom: 10 }}>よく使う難色（タップで即検索）</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(PAINT_DATABASE).slice(0, 8).map(([code, info]) => (
                    <button key={code} onClick={() => { setInputCode(code); setResult({ code, ...info }); }} style={{
                      background: "#0f172a", border: `1px solid ${info.levelColor}`, color: "#e2e8f0",
                      borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12
                    }}>
                      <span style={{ color: info.levelColor, fontWeight: "bold" }}>{code}</span>
                      <span style={{ color: "#64748b", marginLeft: 4 }}>{info.name.substring(0, 8)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === 一覧ビュー === */}
        {view === "list" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {[["all","全て"],["超難色","🔴超難色"],["難色","🟠難色"],["黒ずみ","🟣黒ずみ注意"]].map(([k,l]) => (
                <button key={k} onClick={() => setFilterLevel(k)} style={{
                  padding: "6px 12px", borderRadius: 6, border: "1px solid #334155",
                  background: filterLevel === k ? "#c9a227" : "#1e293b",
                  color: filterLevel === k ? "#000" : "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: "bold"
                }}>{l}</button>
              ))}
            </div>

            {filteredDB.map(([code, info]) => (
              <div key={code} onClick={() => { setInputCode(code); setResult({ code, ...info }); setView("search"); }}
                style={{
                  background: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 8,
                  borderLeft: `4px solid ${info.levelColor}`, cursor: "pointer"
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#c9a227", fontWeight: "bold", fontSize: 15 }}>{code}</span>
                    <span style={{ color: "#e2e8f0", marginLeft: 8, fontSize: 13 }}>{info.name}</span>
                  </div>
                  {getLevelBadge(info.level, info.levelColor)}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{info.maker} ／ 割増：{info.surcharge}</div>
              </div>
            ))}
          </div>
        )}

        {/* === AIアドバイスビュー === */}
        {view === "ai" && (
          <div>
            {aiLoading && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 30, textAlign: "center" }}>
                <div style={{ fontSize: 32 }}>⚙️</div>
                <div style={{ color: "#c9a227", marginTop: 8 }}>AIが詳細アドバイスを生成中...</div>
              </div>
            )}
            {aiAdvice && !aiLoading && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, color: "#c9a227", fontWeight: "bold", marginBottom: 12 }}>🤖 AI詳細アドバイス</div>
                <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#e2e8f0" }}>{aiAdvice}</div>
              </div>
            )}
            {!aiAdvice && !aiLoading && (
              <div style={{ background: "#1e293b", borderRadius: 12, padding: 30, textAlign: "center" }}>
                <div style={{ fontSize: 32 }}>🤖</div>
                <div style={{ color: "#94a3b8", marginTop: 8, fontSize: 14 }}>
                  検索タブでカラーを検索し<br/>「AIが詳細アドバイスを生成する」ボタンを押してください
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
