/**
 * ForumAuto AI Platform - textProcessor.js
 * 役割: AI出力テキストを「自然な読み上げ用テキスト」に整形する
 *       ・専門用語の読み仮名変換
 *       ・感情マーカー付与
 *       ・「間（ポーズ）」の自動挿入
 *       ・ElevenLabs SSML / speechSynthesis 両対応の出力
 */

// ============================================================
// 自動車板金・保険業界 日本語読み仮名辞書
// ============================================================
const READING_DICT = [
  // 板金塗装・修理用語
  { pattern: /板金/g,         reading: 'ばんきん' },
  { pattern: /塗装/g,         reading: 'とそう' },
  { pattern: /エーミング/g,   reading: 'えーみんぐ' },
  { pattern: /損保/g,         reading: 'そんぽ' },
  { pattern: /自賠責/g,       reading: 'じばいせき' },
  { pattern: /任意保険/g,     reading: 'にんいほけん' },
  { pattern: /過失相殺/g,     reading: 'かしつそうさい' },
  { pattern: /示談/g,         reading: 'じだん' },
  { pattern: /物損/g,         reading: 'ぶっそん' },
  { pattern: /人身/g,         reading: 'じんしん' },
  { pattern: /留置権/g,       reading: 'りゅうちけん' },
  { pattern: /鈑金/g,         reading: 'ばんきん' },
  { pattern: /フェンダー/g,   reading: 'ふぇんだー' },
  { pattern: /バンパー/g,     reading: 'ばんぱー' },
  { pattern: /ボンネット/g,   reading: 'ぼんねっと' },
  { pattern: /ドアパネル/g,   reading: 'どあぱねる' },
  { pattern: /サイドミラー/g, reading: 'さいどみらー' },
  { pattern: /全損/g,         reading: 'ぜんそん' },
  { pattern: /分損/g,         reading: 'ぶんそん' },
  { pattern: /査定/g,         reading: 'さてい' },
  { pattern: /修理費/g,       reading: 'しゅうりひ' },
  { pattern: /代車/g,         reading: 'だいしゃ' },
  { pattern: /レッカー/g,     reading: 'れっかー' },
  { pattern: /ディーラー/g,   reading: 'でぃーらー' },
  { pattern: /クリヤー/g,     reading: 'くりやー' },
  { pattern: /プライマー/g,   reading: 'ぷらいまー' },
  { pattern: /パテ/g,         reading: 'ぱて' },
  { pattern: /防錆/g,         reading: 'ぼうせい' },
  { pattern: /溶接/g,         reading: 'ようせつ' },
  { pattern: /トルコン/g,     reading: 'とるこん' },
  { pattern: /ATF/g,          reading: 'えーてぃーえふ' },
  { pattern: /ADAS/g,         reading: 'えーだす' },
  { pattern: /OBD/g,          reading: 'おーびーでぃー' },
  { pattern: /保険金/g,       reading: 'ほけんきん' },
  { pattern: /見積/g,         reading: 'みつもり' },
  { pattern: /見積もり/g,     reading: 'みつもり' },
  { pattern: /損害賠償/g,     reading: 'そんがいばいしょう' },
  { pattern: /民法/g,         reading: 'みんぽう' },
  { pattern: /免責/g,         reading: 'めんせき' },
  { pattern: /特約/g,         reading: 'とくやく' },
  { pattern: /三者/g,         reading: 'さんしゃ' },
  { pattern: /事故/g,         reading: 'じこ' },
  { pattern: /車検/g,         reading: 'しゃけん' },
  { pattern: /創業/g,         reading: 'そうぎょう' },
];

// ============================================================
// 感情マーカー（テキスト内容から自動付与）
// ============================================================
const EMOTION_PATTERNS = [
  { pattern: /ご安心|大丈夫|心配|まず落ち着いて/,  emotion: 'calm',       intensity: 0.8 },
  { pattern: /申し訳|すみません|ご不便/,            emotion: 'apologetic', intensity: 0.7 },
  { pattern: /頑張|誇り|自信|必ず|絶対に/,          emotion: 'confident',  intensity: 0.9 },
  { pattern: /驚|えっ|まさか|それは/,               emotion: 'surprised',  intensity: 0.6 },
  { pattern: /法律|権利|保険|条項|規定/,            emotion: 'serious',    intensity: 0.8 },
  { pattern: /お気軽|いつでも|どうぞ/,              emotion: 'warm',       intensity: 0.7 },
  { pattern: /一緒に|並走|サポート|お手伝い/,       emotion: 'empathetic', intensity: 0.8 },
];

// ============================================================
// テキスト整形メイン処理
// ============================================================
class TextProcessor {

  /**
   * AI出力テキストを読み上げ用に整形
   * @param {string} rawText - AI出力の生テキスト
   * @param {string} charKey  - 'reiko' | 'aika' | 'mako'
   * @returns {{ display: string, speech: string, emotion: string, segments: Array }}
   */
  static process(rawText, charKey = 'aika') {
    // 1. 表示用テキスト（マークダウン等だけ除去）
    const display = this.cleanForDisplay(rawText);

    // 2. 読み上げ用テキスト（辞書変換・整形）
    const speech = this.buildSpeechText(rawText, charKey);

    // 3. 感情検出
    const emotion = this.detectEmotion(rawText);

    // 4. セグメント分割（ポーズ付き）
    const segments = this.splitIntoSegments(speech, charKey);

    return { display, speech, emotion, segments };
  }

  // --- 表示用クリーニング ---
  static cleanForDisplay(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')    // **bold**
      .replace(/\*(.*?)\*/g, '$1')         // *italic*
      .replace(/`(.*?)`/g, '$1')           // `code`
      .replace(/【([^】]+)】/g, '[$1]')    // 【】 → []
      .replace(/^\s*[-・]\s*/gm, '')       // 箇条書き記号
      .replace(/\n{3,}/g, '\n\n')          // 3連改行以上を2連に
      .trim();
  }

  // --- 読み上げ用テキスト構築 ---
  static buildSpeechText(text, charKey) {
    let t = text;

    // マークダウン除去（表示用と同じ）
    t = this.cleanForDisplay(t);

    // 辞書変換（読み仮名に置換）
    READING_DICT.forEach(({ pattern, reading }) => {
      t = t.replace(pattern, reading);
    });

    // キャラクター別の語尾・調整
    t = this.applyCharacterStyle(t, charKey);

    // 句読点・改行をポーズ記号に変換
    t = this.insertPauses(t, charKey);

    // 英数字・記号の読み上げ対応
    t = this.normalizeSymbols(t);

    return t;
  }

  // --- キャラクター別文体調整 ---
  static applyCharacterStyle(text, charKey) {
    const styles = {
      reiko: {
        // 麗子: 落ち着いた・知的 → 文末を少し間延びさせる
        transforms: [
          [/です。/g, 'です。  '],       // 少し間を追加
          [/ます。/g, 'ます。  '],
          [/ね。/g,   'ね。  '],
        ]
      },
      aika: {
        // 愛華: 自然・明るい → テンポよく
        transforms: [
          [/よ。/g,   'よ。'],
          [/ね！/g,   'ね！'],
        ]
      },
      mako: {
        // 真子: 熱量・職人 → 少し力強く
        transforms: [
          [/ます。/g, 'ます。'],
          [/ね。/g,   'ね。'],
        ]
      },
    };

    const style = styles[charKey];
    if (!style) return text;
    let t = text;
    style.transforms.forEach(([pat, rep]) => { t = t.replace(pat, rep); });
    return t;
  }

  // --- ポーズ挿入 ---
  static insertPauses(text, charKey) {
    // キャラ別のポーズ長さ係数（1.0=基準）
    const pauseScale = { reiko: 1.3, aika: 1.0, mako: 0.9 };
    const scale = pauseScale[charKey] || 1.0;

    // 「、」「，」→ 短いポーズ
    // 「。」「！」「？」→ 長いポーズ
    // 「……」→ 思考ポーズ
    let t = text;

    // 長いポーズ（文末）
    t = t.replace(/([。！？])/g, (m) => m + '\u200B'.repeat(Math.round(2 * scale)));

    // 短いポーズ（読点）
    t = t.replace(/([、，])/g, (m) => m + '\u200B'.repeat(Math.round(1 * scale)));

    // 「…」「……」→ 思考ポーズ
    t = t.replace(/[…]+/g, '　　');

    return t;
  }

  // --- 記号・英数字の正規化 ---
  static normalizeSymbols(text) {
    return text
      .replace(/[\[\]【】「」『』〔〕]/g, ' ')  // 括弧類を空白に
      .replace(/[＋＝]/g, '')                   // 数式記号除去
      .replace(/\d{4,}/g, (m) => m.split('').join(' '))  // 長い数字を区切り
      .replace(/\s{3,}/g, '  ')                 // 過剰な空白を整理
      .trim();
  }

  // --- 感情検出 ---
  static detectEmotion(text) {
    for (const { pattern, emotion, intensity } of EMOTION_PATTERNS) {
      if (pattern.test(text)) {
        return { type: emotion, intensity };
      }
    }
    return { type: 'neutral', intensity: 0.6 };
  }

  // --- セグメント分割（ポーズ情報付き） ---
  // 音声エンジンに1文ずつ渡すための分割
  static splitIntoSegments(speechText, charKey) {
    // 文末で分割
    const sentences = speechText
      .split(/(?<=[。！？][\u200B]*)\s*/)
      .filter(s => s.replace(/\u200B/g, '').trim().length > 0);

    // キャラ別の間（ポーズ）時間(ms)
    const pauseMap = {
      reiko: { sentence: 700, comma: 350 },
      aika:  { sentence: 450, comma: 200 },
      mako:  { sentence: 400, comma: 180 },
    };
    const pauses = pauseMap[charKey] || pauseMap.aika;

    return sentences.map((text, i) => ({
      index: i,
      text: text.replace(/\u200B/g, '').trim(),
      pauseAfter: i < sentences.length - 1 ? pauses.sentence : 0,
    }));
  }

  // --- ElevenLabs用メタデータ生成 ---
  static buildElevenLabsPayload(text, charKey) {
    const { speech, emotion } = this.process(text, charKey);
    // ElevenLabs voice_settings はキャラ設定から参照
    return {
      text: speech,
      emotion: emotion.type,
      model_id: 'eleven_multilingual_v2',
    };
  }

  // --- speechSynthesis用パラメータ生成（フォールバック） ---
  static buildSynthesisParams(text, charKey, voices) {
    const { segments, emotion } = this.process(text, charKey);

    // キャラ別音声パラメータ（speechSynthesis フォールバック用）
    const params = {
      reiko: {
        // 落ち着いた・低め・ゆっくり・知的
        rate: 0.82,      // ゆっくり（0.1〜10、1.0=標準）
        pitch: 0.78,     // 低め（0=最低、2=最高）
        volume: 0.92,
        preferredVoiceName: ['Kyoko', 'O-Ren', 'Haruka'],
      },
      aika: {
        // 明るい・自然・安心感
        rate: 0.95,      // 自然なテンポ
        pitch: 1.15,     // 少し高め
        volume: 1.0,
        preferredVoiceName: ['Ichiro', 'Hana', 'Otoya'],
      },
      mako: {
        // 熱量・職人・少し低め
        rate: 0.90,      // 少しゆっくり目
        pitch: 0.92,     // やや低め
        volume: 1.0,
        preferredVoiceName: ['Otoya', 'Ichiro'],
      },
    };

    const p = params[charKey] || params.aika;

    // 感情による微調整
    if (emotion.type === 'confident') {
      p.rate += 0.04;
      p.volume = Math.min(1.0, p.volume + 0.05);
    } else if (emotion.type === 'calm' || emotion.type === 'apologetic') {
      p.rate -= 0.05;
    }

    // 日本語音声を探す
    const jaVoices = voices.filter(v => v.lang.startsWith('ja'));
    let selectedVoice = null;

    // 好みの音声名で検索
    for (const name of p.preferredVoiceName) {
      selectedVoice = jaVoices.find(v => v.name.includes(name));
      if (selectedVoice) break;
    }
    // なければ最初の日本語音声
    if (!selectedVoice) selectedVoice = jaVoices[0] || null;

    return { segments, voice: selectedVoice, rate: p.rate, pitch: p.pitch, volume: p.volume };
  }
}

// CommonJS / ESM 両対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TextProcessor, READING_DICT, EMOTION_PATTERNS };
} else {
  window.TextProcessor = TextProcessor;
}
