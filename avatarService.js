/**
 * ForumAuto AI Platform - avatarService.js
 * 役割: アバター・口パク・感情表現の抽象化レイヤー
 *
 * 現在のモード:
 *   - 'photo'  : 写真 + CSSアニメーションで口パク風演出（現在）
 *   - 'live2d' : Live2D Cubism SDK（将来）
 *   - 'three'  : Three.js 3Dアバター（将来）
 *
 * VoiceService の lipSync イベントを受け取り、
 * アバターの口・表情を制御する。
 */

class AvatarService {
  constructor(options = {}) {
    this.mode = options.mode || 'photo';
    this.currentChar = options.initialChar || 'reiko';

    // DOM参照
    this._photoEl = null;
    this._overlayEl = null;
    this._mouthEl = null;

    // Live2D / Three.js モデル参照（将来用）
    this._live2dModel = null;
    this._threeScene = null;

    // 感情状態
    this._currentEmotion = 'neutral';
    this._isSpeaking = false;

    // 口パクアニメーションフレーム
    this._lipFrame = null;

    // キャラ別カラー設定
    this.charColors = {
      reiko: { bg: '#1a3a6e', accent: '#b8960c', glow: 'rgba(26,58,110,0.4)' },
      aika:  { bg: '#8b1a4a', accent: '#e06090', glow: 'rgba(139,26,74,0.4)' },
      mako:  { bg: '#1a5c3a', accent: '#40a060', glow: 'rgba(26,92,58,0.4)' },
    };
  }

  // ============================================================
  // 初期化（DOMと紐付け）
  // ============================================================
  init(containerEl) {
    this._container = containerEl;

    if (this.mode === 'photo') {
      this._initPhotoMode(containerEl);
    } else if (this.mode === 'live2d') {
      this._initLive2D(containerEl);
    } else if (this.mode === 'three') {
      this._initThreeJS(containerEl);
    }
  }

  // ============================================================
  // photo モード: CSS口パク + 感情フィルター
  // ============================================================
  _initPhotoMode(containerEl) {
    // 口パクオーバーレイ要素を作成（各カードの写真エリアに注入）
    const cards = containerEl.querySelectorAll('.char-card');
    cards.forEach(card => {
      const charKey = card.dataset.char;
      const photoArea = card.querySelector('.card-photo-area');
      if (!photoArea) return;

      // 口パクオーバーレイ（口の形状を表現）
      const mouthOverlay = document.createElement('div');
      mouthOverlay.className = 'avatar-mouth-overlay';
      mouthOverlay.dataset.char = charKey;
      mouthOverlay.innerHTML = `
        <div class="mouth-shape" data-char="${charKey}">
          <div class="mouth-upper"></div>
          <div class="mouth-lower"></div>
        </div>
      `;
      photoArea.appendChild(mouthOverlay);

      // 感情オーバーレイ（色のフィルター）
      const emotionOverlay = document.createElement('div');
      emotionOverlay.className = 'avatar-emotion-overlay';
      emotionOverlay.dataset.char = charKey;
      photoArea.appendChild(emotionOverlay);
    });
  }

  // ============================================================
  // VoiceService の lipSync イベントハンドラー
  // ============================================================
  handleLipSync({ amplitude, charKey }) {
    if (charKey !== this.currentChar) return;
    this._isSpeaking = amplitude > 0.05;

    if (this.mode === 'photo') {
      this._updatePhotoMouth(amplitude, charKey);
    } else if (this.mode === 'live2d' && this._live2dModel) {
      this._updateLive2DMouth(amplitude);
    } else if (this.mode === 'three' && this._threeScene) {
      this._updateThreeMouth(amplitude);
    }
  }

  // ============================================================
  // photo モード: 口パクアニメーション
  // ============================================================
  _updatePhotoMouth(amplitude, charKey) {
    const mouthEl = document.querySelector(`.mouth-shape[data-char="${charKey}"]`);
    if (!mouthEl) return;

    // amplitude: 0〜1 → 口の開き具合
    const openPx = Math.round(amplitude * 18);      // 最大18px開く
    const lowerEl = mouthEl.querySelector('.mouth-lower');
    const upperEl = mouthEl.querySelector('.mouth-upper');

    if (lowerEl) lowerEl.style.transform = `translateY(${openPx}px)`;
    if (upperEl) upperEl.style.transform = `translateY(${-openPx * 0.3}px)`;

    // アクティブキャラのカードにglow効果
    const card = document.querySelector(`.char-card[data-char="${charKey}"]`);
    if (card) {
      const color = this.charColors[charKey];
      card.style.boxShadow = amplitude > 0.1
        ? `0 0 ${12 + amplitude * 20}px ${color.glow}, 0 8px 24px rgba(0,0,0,0.22)`
        : '';
    }
  }

  // ============================================================
  // 感情表現（写真に色フィルターをかける）
  // ============================================================
  setEmotion(emotion, charKey) {
    this._currentEmotion = emotion.type;
    if (this.mode === 'photo') {
      this._applyEmotionFilter(emotion, charKey);
    } else if (this.mode === 'live2d' && this._live2dModel) {
      this._applyLive2DExpression(emotion);
    }
  }

  _applyEmotionFilter(emotion, charKey) {
    const overlayEl = document.querySelector(`.avatar-emotion-overlay[data-char="${charKey}"]`);
    if (!overlayEl) return;

    const filters = {
      calm:       'rgba(100,150,220, 0.08)',
      confident:  'rgba(184,150,12,  0.12)',
      warm:       'rgba(220,130,100, 0.10)',
      serious:    'rgba(40, 60, 100, 0.15)',
      apologetic: 'rgba(100,100,120, 0.10)',
      surprised:  'rgba(220,200,100, 0.10)',
      neutral:    'transparent',
    };
    overlayEl.style.background = filters[emotion.type] || 'transparent';
    overlayEl.style.transition = 'background 0.6s ease';
  }

  // ============================================================
  // キャラクター切替
  // ============================================================
  switchChar(charKey) {
    this.currentChar = charKey;
    this._currentEmotion = 'neutral';

    // 前キャラのglow解除
    document.querySelectorAll('.char-card').forEach(c => {
      c.style.boxShadow = '';
    });
  }

  // ============================================================
  // 話し始め / 話し終わり アニメーション
  // ============================================================
  onSpeechStart(charKey) {
    const photoEl = document.querySelector(`.char-card[data-char="${charKey}"] .card-photo`);
    if (photoEl) {
      photoEl.style.filter = 'brightness(1.05) contrast(1.02)';
      photoEl.style.transition = 'filter 0.3s ease';
    }
    const mouthEl = document.querySelector(`.avatar-mouth-overlay[data-char="${charKey}"]`);
    if (mouthEl) mouthEl.style.opacity = '1';
  }

  onSpeechEnd(charKey) {
    const photoEl = document.querySelector(`.char-card[data-char="${charKey}"] .card-photo`);
    if (photoEl) {
      photoEl.style.filter = '';
    }
    const mouthEl = document.querySelector(`.avatar-mouth-overlay[data-char="${charKey}"]`);
    if (mouthEl) mouthEl.style.opacity = '0';

    // 口を閉じる
    const mouthShape = document.querySelector(`.mouth-shape[data-char="${charKey}"]`);
    if (mouthShape) {
      const lower = mouthShape.querySelector('.mouth-lower');
      const upper = mouthShape.querySelector('.mouth-upper');
      if (lower) lower.style.transform = '';
      if (upper) upper.style.transform = '';
    }
  }

  // ============================================================
  // CSS（口パクオーバーレイ用）を動的に注入
  // ============================================================
  static injectStyles() {
    if (document.getElementById('avatar-service-styles')) return;
    const style = document.createElement('style');
    style.id = 'avatar-service-styles';
    style.textContent = `
      /* 口パクオーバーレイ */
      .avatar-mouth-overlay {
        position: absolute;
        bottom: 22%;
        left: 50%;
        transform: translateX(-50%);
        width: 28px;
        height: 14px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 10;
      }
      .mouth-shape {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .mouth-upper, .mouth-lower {
        position: absolute;
        left: 0;
        width: 100%;
        height: 7px;
        border-radius: 50%;
        transition: transform 0.05s linear;
      }
      .mouth-upper {
        top: 0;
        background: rgba(40, 20, 20, 0.85);
        border-radius: 50% 50% 0 0;
      }
      .mouth-lower {
        bottom: 0;
        background: rgba(40, 20, 20, 0.85);
        border-radius: 0 0 50% 50%;
      }
      /* 感情フィルターオーバーレイ */
      .avatar-emotion-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 5;
        border-radius: inherit;
      }
      /* 話し中のカードに呼吸アニメ */
      @keyframes avatar-breathe {
        0%, 100% { transform: scale(1); }
        50%       { transform: scale(1.008); }
      }
      .char-card.speaking {
        animation: avatar-breathe 2.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // Live2D 将来実装プレースホルダー
  // ============================================================
  _initLive2D(containerEl) {
    console.log('[AvatarService] Live2D mode: 将来実装予定');
    // TODO: Live2D Cubism SDK 4 の初期化
    // const app = new PIXI.Application({ view: canvas });
    // const model = await Live2DModel.from('path/to/model.model3.json');
  }

  _updateLive2DMouth(amplitude) {
    // TODO: model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', amplitude);
  }

  _applyLive2DExpression(emotion) {
    // TODO: model.expression(emotion.type);
  }

  // ============================================================
  // Three.js 将来実装プレースホルダー
  // ============================================================
  _initThreeJS(containerEl) {
    console.log('[AvatarService] Three.js mode: 将来実装予定');
    // TODO: THREE.Scene, GLTFLoader でアバター読み込み
  }

  _updateThreeMouth(amplitude) {
    // TODO: morph target (mouthOpen) の更新
    // mesh.morphTargetInfluences[mouthOpenIndex] = amplitude;
  }
}

// グローバル・モジュール両対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AvatarService };
} else {
  window.AvatarService = AvatarService;
}
