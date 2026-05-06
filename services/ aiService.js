/**
 * ForumAuto AI Platform - aiService.js
 * 役割: AI呼び出しの完全抽象化レイヤー
 *
 * 対応プロバイダー（すべてSupabase Edge Function経由）:
 *   - claude   （Anthropic Claude） ← 現在使用
 *   - gemini   （Google Gemini）
 *   - openai   （OpenAI GPT）
 *
 * 将来対応予定:
 *   - Mistral
 *   - ローカルOllama
 */

class AIService {
  constructor(options = {}) {
    this.provider = options.provider || 'claude';
    this.supabaseUrl = options.supabaseUrl || '';
    this.supabaseKey = options.supabaseKey || '';
    this.edgeFuncPath = '/functions/v1/ai-proxy';
    this.defaultModel = options.model || null;

    // リクエストキャンセル用
    this._abortController = null;
  }

  // ============================================================
  // メイン: AI呼び出し
  // ============================================================
  async chat({ system, messages, maxTokens = 400, charKey = 'aika' }) {
    this._abortController = new AbortController();

    // キャラクター向けsystemプロンプト補強
    const enhancedSystem = this._enhanceSystemPrompt(system, charKey);

    try {
      const res = await fetch(this.supabaseUrl + this.edgeFuncPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({
          provider: this.provider,
          system: enhancedSystem,
          messages,
          max_tokens: maxTokens,
          model: this.defaultModel,
        }),
        signal: this._abortController.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.result || '';

    } catch (e) {
      if (e.name === 'AbortError') return null;
      throw e;
    }
  }

  // ============================================================
  // キャラ向けsystem補強（共通の音声出力指示を追加）
  // ============================================================
  _enhanceSystemPrompt(system, charKey) {
    const voiceGuide = {
      reiko: '回答は2〜3文。文末は「です」「ます」で統一。専門用語は使いつつも平易に。「……」「、」を使って自然な間を表現してください。',
      aika:  '回答は2〜3文。やわらかい表現で。「〜ですね」「〜しましょう」など共感を示す言い回しを使ってください。',
      mako:  '回答は3〜4文。技術への情熱を短い文で表現。専門知識を自信を持って伝えてください。',
    };

    return system + '\n\n【音声出力用の注意】' + (voiceGuide[charKey] || voiceGuide.aika);
  }

  // プロバイダー切替
  setProvider(provider) {
    this.provider = provider;
    console.log(`[AIService] プロバイダー切替: ${provider}`);
  }

  // リクエストキャンセル
  cancel() {
    if (this._abortController) {
      this._abortController.abort();
    }
  }
}

// グローバル・モジュール両対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIService };
} else {
  window.AIService = AIService;
}
