// Speech recognition and synthesis helper with cross-browser fallback and Indian language prioritization
// Default AI voice: Hindi (hi-IN) with dynamic auto-detection for Marathi (mr-IN), English (en-IN), and other languages.

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class SpeechService {
  private static recognition: any = null;
  private static isListening: boolean = false;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static voicesLoaded: boolean = false;
  private static speechMuted: boolean = false;
  private static activeAudioContext: AudioContext | null = null;

  // Initialize voice list caching
  static {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            SpeechService.cachedVoices = list;
            SpeechService.voicesLoaded = true;
          }
        } catch (e) {
          console.warn('Could not load speech voices:', e);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public static setMuted(muted: boolean): void {
    SpeechService.speechMuted = muted;
    if (muted) {
      SpeechService.stopSpeaking();
    }
  }

  public static isMuted(): boolean {
    return SpeechService.speechMuted;
  }

  public static isCurrentlyListening(): boolean {
    return SpeechService.isListening;
  }

  public static isCurrentlySpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }

  public static detectLanguageFromText(text: string): string {
    if (!text || text.trim().length === 0) return 'hi-IN';

    const lower = text.toLowerCase();

    // Check Devanagari script
    if (/[\u0900-\u097F]/.test(text)) {
      // Distinct Marathi markers
      if (/आहे|नाही|माझ्या|घराजवळ|रस्त्यावर|तुंबली|कचरा|खड्डा|झाला|करा|दाखला|दिवे|पाणी|नाली|प्रभाग|महापालिका|कधी|कसे|सांगा/.test(text)) {
        return 'mr-IN';
      }
      // Otherwise default Hindi
      return 'hi-IN';
    }

    // Hinglish / Roman Hindi markers
    if (/mein|nahi|hai|kahan|karo|bhi|raha|gaya|paani|sadak|khadda|kachra|mera|meri|band|ho|gayi|kripya|namaste|samasya/.test(lower)) {
      return 'hi-IN';
    }

    // Roman Marathi markers
    if (/ahe|nahi|mazya|gharjaval|rastya|pani|diwa|kiti|kuthe|takraar|samashya|madat/.test(lower)) {
      return 'mr-IN';
    }

    // Gujarati markers
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return 'gu-IN';
    }

    // Bengali markers
    if (/[\u0980-\u09FF]/.test(text)) {
      return 'bn-IN';
    }

    // Tamil markers
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'ta-IN';
    }

    // Telugu markers
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return 'te-IN';
    }

    // Latin / English text
    if (/^[A-Za-z0-9\s.,!?'"()-]+$/.test(text)) {
      return 'en-IN';
    }

    return 'hi-IN';
  }

  public static startListening(
    lang: string = 'hi',
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!SpeechService.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser. Please type your message.');
      return false;
    }

    try {
      SpeechService.stopSpeaking();

      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechService.recognition) {
        try {
          SpeechService.recognition.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Select BCP-47 language tag (Default: Hindi)
      const cleanLang = (lang || 'hi').toLowerCase();
      if (cleanLang === 'mr' || cleanLang === 'marathi') {
        recognition.lang = 'mr-IN';
      } else if (cleanLang === 'en' || cleanLang === 'english') {
        recognition.lang = 'en-IN';
      } else {
        recognition.lang = 'hi-IN';
      }

      recognition.onstart = () => {
        SpeechService.isListening = true;
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        onResult({ transcript, isFinal });
      };

      recognition.onerror = (event: any) => {
        SpeechService.isListening = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          onError('Microphone permission was denied. Please allow microphone access or type your issue.');
        } else if (event.error === 'no-speech') {
          onError('No speech was detected. Please try speaking closer to the microphone.');
        } else if (event.error === 'network') {
          onError('Network glitch during voice recognition. You can retry or type directly.');
        } else {
          onError(`Voice input notice: ${event.error || 'Check microphone'}`);
        }
      };

      recognition.onend = () => {
        SpeechService.isListening = false;
        onEnd();
      };

      recognition.start();
      SpeechService.recognition = recognition;
      return true;
    } catch (e: any) {
      SpeechService.isListening = false;
      console.warn('SpeechRecognition failed:', e);
      onError('Could not start voice recognition. Please verify microphone permissions.');
      return false;
    }
  }

  public static stopListening(): void {
    if (SpeechService.recognition && SpeechService.isListening) {
      try {
        SpeechService.recognition.stop();
      } catch (e) {
        // ignore
      }
      SpeechService.isListening = false;
    }
  }

  public static stopSpeaking(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      SpeechService.activeUtterance = null;
    } catch (e) {
      console.warn('Cancel speech synthesis failed:', e);
    }
  }

  // Find best native voice matching Hindi, Marathi, Indian English, etc.
  public static findBestVoice(langTag: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    const voices = SpeechService.cachedVoices.length > 0
      ? SpeechService.cachedVoices
      : window.speechSynthesis.getVoices();

    if (!voices || voices.length === 0) return null;

    const lowerTag = langTag.toLowerCase();

    // 1. Exact match (e.g. 'hi-IN', 'mr-IN', 'en-IN')
    const exact = voices.find((v) => v.lang.toLowerCase() === lowerTag);
    if (exact) return exact;

    // 2. Hindi match (Primary default voice of AI)
    if (lowerTag.startsWith('hi')) {
      const hiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('google हिन्दी') ||
          v.name.toLowerCase().includes('lekha') ||
          v.name.toLowerCase().includes('swara') ||
          v.name.toLowerCase().includes('madhav') ||
          v.name.toLowerCase().includes('neerja') ||
          v.name.toLowerCase().includes('hi-in')
      );
      if (hiVoice) return hiVoice;
    }

    // 3. Marathi specific match
    if (lowerTag.startsWith('mr')) {
      const mrVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('mr') ||
          v.name.toLowerCase().includes('marathi') ||
          v.name.toLowerCase().includes('mr-in')
      );
      if (mrVoice) return mrVoice;

      // Devanagari fallback: Hindi voice reads Marathi phonetics accurately
      const hiFallback = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('lekha')
      );
      if (hiFallback) return hiFallback;
    }

    // 4. Indian English match
    if (lowerTag.startsWith('en')) {
      const inVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('en-in') ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('rishi') ||
          v.name.toLowerCase().includes('veena') ||
          v.name.toLowerCase().includes('priya')
      );
      if (inVoice) return inVoice;
    }

    // 5. Broad Indian country code match (e.g. any IN voice)
    const inGeneral = voices.find((v) => v.lang.toUpperCase().includes('IN'));
    if (inGeneral) return inGeneral;

    // 6. Generic language prefix match
    const prefix = lowerTag.split('-')[0];
    const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    // 7. Default voice or first voice
    return voices.find((v) => v.default) || voices[0] || null;
  }

  /**
   * Speaks the provided text in the target language.
   * Default voice is Hindi ('hi-IN') unless detected otherwise.
   */
  public static speak(
    text: string,
    lang?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (SpeechService.speechMuted) return;
    if (!text || text.trim().length === 0) return;

    try {
      // Clear previous speech and unlock synthesis
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Determine proper language tag
      let targetLang = 'hi-IN'; // Default voice of AI is Hindi

      if (lang) {
        const cleanLang = lang.toLowerCase();
        if (cleanLang === 'hi' || cleanLang === 'hindi' || cleanLang === 'hi-in') {
          targetLang = 'hi-IN';
        } else if (cleanLang === 'mr' || cleanLang === 'marathi' || cleanLang === 'mr-in') {
          targetLang = 'mr-IN';
        } else if (cleanLang === 'en' || cleanLang === 'english' || cleanLang === 'en-in') {
          targetLang = 'en-IN';
        } else if (cleanLang.includes('-')) {
          targetLang = lang;
        } else {
          targetLang = `${cleanLang}-IN`;
        }
      } else {
        // Auto-detect language directly from text
        targetLang = SpeechService.detectLanguageFromText(text);
      }

      // Clean text: strip markdown characters, urls, emojis, asterisks for natural voice flow
      const cleanedSpeechText = text
        .replace(/[*#_~`>]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/📍|🚨|⚠️|🛠️|✅|💡|🏢|📞|🔥|🌐|🌊|🕳️|🗑️|🚰|🌳/g, '')
        .trim();

      if (!cleanedSpeechText) return;

      const utterance = new SpeechSynthesisUtterance(cleanedSpeechText);
      utterance.lang = targetLang;
      utterance.rate = targetLang.startsWith('hi') || targetLang.startsWith('mr') ? 0.95 : 1.0;
      utterance.pitch = 1.0;

      // Assign matching voice
      const voice = SpeechService.findBestVoice(targetLang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        SpeechService.activeUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error event:', e);
        SpeechService.activeUtterance = null;
        if (onEnd) onEnd();
      };

      // Keep strong reference to prevent GC bug in Chromium
      SpeechService.activeUtterance = utterance;

      // Speak utterance
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis exception:', e);
      SpeechService.activeUtterance = null;
      if (onEnd) onEnd();
    }
  }

  // Play subtle feedback chime for audio confirmation
  public static playTone(frequency: number = 520, durationMs: number = 100): void {
    if (typeof window === 'undefined' || SpeechService.speechMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!SpeechService.activeAudioContext) {
        SpeechService.activeAudioContext = new AudioCtx();
      }
      const ctx = SpeechService.activeAudioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }
}
