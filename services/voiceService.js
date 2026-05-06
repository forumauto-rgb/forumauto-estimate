/**
 * ForumAuto AI Platform - voiceService.js
 * 役割: 音声合成の完全抽象化レイヤー
 *
 * 対応エンジン:
 *   1. ElevenLabs API（Supabase Edge Function経由） ← 本番推奨
 *   2. Web Speech API / speechSynthesis             ← フォールバック
 *
 * 将来対応予定:
 *   - VOICEVOX（ローカル高品質TTS）
 *   - Google Cloud TTS
 *   - Azure Cognitive Speech
 */

// ============================================================
// キャラクター別 ElevenLabs Voice ID 設定
// ============================================================
const ELEVENLABS_VOICE_CONFIG = {
  reiko: {
    // 落ち着いた知的女性 / 低め / ゆっくり / 法務感
    voiceId: 'YOUR_REIKO_VOICE_ID',    // ← ElevenLabs で設定した麗子のVoice ID
    model: 'eleven_multilingual_v2',
    settings: {
      stability: 0.75,        // 高め = 安定・一貫した声質
      similarity_boost: 0.80,
      style: 0.45,            // スタイル強度（0=ニュートラル, 1=感情豊か）
      use_speaker_boost: true,
      speed: 0.88,            // ゆっくり（0.7〜1.3）
    },
    description: '落ち着いた知的女性・低め・ゆっくり・法務保険感',
  },
  aika: {
    // 優しい受付 / 明るめ / 自然 / 安心感
    voiceId: 'YOUR_AIKA_VOICE_ID',     // ← ElevenLabs で設定した愛華のVoice ID
    model: 'eleven_multilingual_v2',
    settings: {
      stability: 0.65,        // 少し低め = 表情豊か
      similarity_boost: 0.75,
      style: 0.60,            // 少し高め = 明るく親しみやすく
      use_speaker_boost: true,
      speed: 0.96,            // ほぼ標準
    },
    description: '優しい受付・明るめ・自然・安心感',
  },
  mako: {
    // 技術者 / 少し低め / 熱量 / 職人気質
    voiceId: 'YOUR_MAKO_VOICE_ID',     // ← ElevenLabs で設定した真子のVoice ID
    model: 'eleven_multilingual_v2',
    settings: {
      stability: 0.70,
      similarity_boost: 0.78,
      style: 0.55,            // 熱量・職人気質
      use_speaker_boost: true,
      speed: 0.92,
    },
    description: '技術者・少し低め・熱量・職人気質',
  },
};

// ============================================================
// VoiceService クラス
// ============================================================
class VoiceService {
  constructor(options = {}) {
    this.engine = options.engine || 'auto';       // 'elevenlabs' | 'synthesis' | 'auto'
    this.supabaseUrl = options.supabaseUrl || '';
    this.supabaseKey = options.supabaseKey || '';
    this.edgeFuncPath = '/functions/v1/voice-proxy';

    // 再生状態
    this._currentAudio = null;
    this._speaking = false;
    this._queue = [];
    this._listeners = {};

    // speechSynthesis 初期化
    this._voices = [];
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        this._voices = window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // エンジン自動判定
    if (this.engine === 'auto') {
      this.engine = this._detectEngine();
    }

    console.log(`[VoiceService] エンジン: ${this.engine}`);
  }

  _detectEngine() {
    // ElevenLabs Voice IDが設定されていればElevenLabs優先
    const hasElevenLabsConfig = Object.values(ELEVENLABS_VOICE_CONFIG)
      .some(c => c.voiceId && !c.voiceId.startsWith('YOUR_'));
    if (hasElevenLabsConfig && this.supabaseUrl) return 'elevenlabs';
    return 'synthesis';
  }

  // ============================================================
  // イベント
  // ============================================================
  on(event, fn) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(fn);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  // ============================================================
  // メイン: セグメント列を順番に再生
  // ============================================================
  async speakSegments(segments, charKey, emotion) {
    this.cancel();

    for (const segment of segments) {
      if (!segment.text.trim()) continue;
      await this._speakSegment(segment.text, charKey, emotion);

      // セグメント間のポーズ
      if (segment.pauseAfter > 0) {
        await this._pause(segment.pauseAfter);
      }
    }

    this._emit('end', { charKey });
  }

  async _speakSegment(text, charKey, emotion) {
    this._emit('segmentStart', { text, charKey });

    if (this.engine === 'elevenlabs') {
      await this._speakElevenLabs(text, charKey, emotion);
    } else {
      await this._speakSynthesis(text, charKey);
    }

    this._emit('segmentEnd', { text, charKey });
  }

  // ============================================================
  // ElevenLabs経由（Supabase Edge Function: voice-proxy）
  // ============================================================
  async _speakElevenLabs(text, charKey, emotion) {
    const config = ELEVENLABS_VOICE_CONFIG[charKey] || ELEVENLABS_VOICE_CONFIG.aika;

    try {
      const res = await fetch(this.supabaseUrl + this.edgeFuncPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({
          text,
          voiceId: config.voiceId,
          modelId: config.model,
          voiceSettings: {
            ...config.settings,
            // 感情による動的調整
            style: this._adjustStyleForEmotion(config.settings.style, emotion),
          },
        }),
      });

      if (!res.ok) {
        console.warn('[VoiceService] ElevenLabs失敗, speechSynthesisにフォールバック');
        await this._speakSynthesis(text, charKey);
        return;
      }

      const audioBlob = await res.blob();
      await this._playAudioBlob(audioBlob, charKey);

    } catch (e) {
      console.warn('[VoiceService] ElevenLabs例外:', e.message);
      await this._speakSynthesis(text, charKey);
    }
  }

  _adjustStyleForEmotion(baseStyle, emotion) {
    if (!emotion) return baseStyle;
    const adjustments = {
      confident:  +0.10,
      warm:       +0.08,
      empathetic: +0.05,
      calm:       -0.05,
      serious:    -0.08,
      apologetic: -0.03,
      neutral:     0.00,
    };
    const adj = adjustments[emotion.type] || 0;
    return Math.max(0, Math.min(1, baseStyle + adj * (emotion.intensity || 1)));
  }

  // ============================================================
  // Blob音声の再生（口パクイベント付き）
  // ============================================================
  async _playAudioBlob(blob, charKey) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this._currentAudio = audio;

      // Web Audio API で振幅解析（口パク用）
      this._startLipSyncAnalysis(audio, charKey);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        this._currentAudio = null;
        this._stopLipSyncAnalysis();
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.play().catch(resolve);
    });
  }

  // ============================================================
  // Web Audio API による振幅解析（口パク用）
  // ============================================================
  _audioCtx = null;
  _analyser = null;
  _lipSyncFrame = null;

  _startLipSyncAnalysis(audioElement, charKey) {
    try {
      if (!this._audioCtx) {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const source = this._audioCtx.createMediaElementSource(audioElement);
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 256;
      source.connect(this._analyser);
      this._analyser.connect(this._audioCtx.destination);

      const dataArray = new Uint8Array(this._analyser.frequencyBinCount);
      const tick = () => {
        this._analyser.getByteFrequencyData(dataArray);
        // 口の開き具合（0〜1）= 低周波成分の平均
        const avg = dataArray.slice(0, 16).reduce((a, b) => a + b, 0) / 16 / 255;
        // AvatarService にイベント通知
        this._emit('lipSync', { amplitude: avg, charKey });
        this._lipSyncFrame = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      // Web Audio API 非対応の場合はスキップ
    }
  }

  _stopLipSyncAnalysis() {
    if (this._lipSyncFrame) {
      cancelAnimationFrame(this._lipSyncFrame);
      this._lipSyncFrame = null;
    }
    this._emit('lipSync', { amplitude: 0 });
  }

  // ============================================================
  // speechSynthesis フォールバック（キャラ別パラメータ適用）
  // ============================================================
  async _speakSynthesis(text, charKey) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }

      window.speechSynthesis.cancel();

      // TextProcessorのパラメータを使用
      const params = (window.TextProcessor || TextProcessor)
        .buildSynthesisParams(text, charKey, this._voices);

      // セグメントを順番に発話
      let idx = 0;
      const speakNext = () => {
        if (idx >= params.segments.length) { resolve(); return; }
        const seg = params.segments[idx++];
        if (!seg.text.trim()) { speakNext(); return; }

        const u = new SpeechSynthesisUtterance(seg.text);
        u.lang = 'ja-JP';
        u.rate = params.rate;
        u.pitch = params.pitch;
        u.volume = params.volume;
        if (params.voice) u.voice = params.voice;

        // 口パクシミュレーション（speechSynthesis用）
        u.onstart = () => this._simulateLipSync(seg.text, charKey);
        u.onend = () => {
          this._stopLipSyncAnalysis();
          // セグメント間のポーズ
          if (seg.pauseAfter > 0) {
            setTimeout(speakNext, seg.pauseAfter);
          } else {
            speakNext();
          }
        };
        u.onerror = speakNext;

        window.speechSynthesis.speak(u);
      };
      speakNext();
    });
  }

  // speechSynthesis用の口パクシミュレーション（疑似的に振動させる）
  _simulateLipSync(text, charKey) {
    const charCount = text.length;
    const duration = charCount * 120; // 文字数×120ms が目安の発話時間
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        this._emit('lipSync', { amplitude: 0, charKey });
        return;
      }
      // sin波で口の開閉をシミュレート
      const amplitude = Math.abs(Math.sin(elapsed / 120 * Math.PI)) * 0.7;
      this._emit('lipSync', { amplitude, charKey });
      this._lipSyncFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  // ============================================================
  // ユーティリティ
  // ============================================================
  cancel() {
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this._stopLipSyncAnalysis();
    this._queue = [];
    this._speaking = false;
  }

  isSpeaking() {
    return this._speaking;
  }

  // ポーズ（待機）
  _pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // エンジン切替
  setEngine(engine) {
    this.engine = engine;
    console.log(`[VoiceService] エンジン切替: ${engine}`);
  }

  // 現在のエンジン取得
  getEngine() {
    return this.engine;
  }

  // ElevenLabs Voice設定の確認・更新
  static getVoiceConfig(charKey) {
    return ELEVENLABS_VOICE_CONFIG[charKey];
  }

  static setVoiceId(charKey, voiceId) {
    if (ELEVENLABS_VOICE_CONFIG[charKey]) {
      ELEVENLABS_VOICE_CONFIG[charKey].voiceId = voiceId;
    }
  }
}

// グローバル・モジュール両対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceService, ELEVENLABS_VOICE_CONFIG };
} else {
  window.VoiceService = VoiceService;
  window.ELEVENLABS_VOICE_CONFIG = ELEVENLABS_VOICE_CONFIG;
}
