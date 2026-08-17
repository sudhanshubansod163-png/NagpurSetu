import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Paperclip, 
  MapPin, 
  Send, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Bot, 
  User, 
  Camera, 
  Crosshair, 
  Construction, 
  Trash2, 
  Droplets, 
  Lightbulb, 
  Wrench, 
  MoreHorizontal, 
  X,
  HelpCircle,
  CheckCircle,
  FileCheck,
  AlertCircle,
  Loader2,
  Navigation,
  Globe,
  Volume2,
  VolumeX,
  Languages,
  Radio,
  Square
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { classifyUserMessage, ClassificationResult } from '../services/aiClassifier';
import { SpeechService } from '../services/speech';
import { CaseItem, ChatMessage, Department } from '../types';
import { NagpurMapViewer, NAGPUR_LOCALITIES, NagpurLocation } from './NagpurMapViewer';

interface TalkScreenProps {
  navigate: (route: string) => void;
  onProceedToReview: (draft: {
    problemSummary: string;
    rawInput: string;
    category: string;
    department: Department;
    location: string;
    ward: string;
    photoUrl?: string;
  }) => void;
}

export const TalkScreen: React.FC<TalkScreenProps> = ({
  navigate,
  onProceedToReview,
}) => {
  // State
  const [userSelectedLang, setUserSelectedLang] = useState<'mr' | 'hi' | 'en'>(() => {
    const saved = StorageService.getLanguage();
    if (saved === 'mr' || saved === 'hi' || saved === 'en') return saved;
    return 'hi'; // Default friendly Hindi for NagpurSetu AI
  });

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentCases, setRecentCases] = useState<CaseItem[]>([]);
  const [helpMeModeActive, setHelpMeModeActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Garbage Pickup');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  
  // Current extraction state for ongoing report
  const [currentLocation, setCurrentLocation] = useState('42 Dharampeth Extension, Nagpur');
  const [currentWard, setCurrentWard] = useState('Dharampeth (Ward 4)');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80'
  );
  const [activeClassification, setActiveClassification] = useState<ClassificationResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent cases
  useEffect(() => {
    const my = StorageService.getMyCases();
    setRecentCases(my.slice(0, 3));
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      SpeechService.stopListening();
      SpeechService.stopSpeaking();
    };
  }, []);

  // Scroll to bottom on message update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasStartedConversation, isAiThinking]);

  // Handle voice speech
  const toggleListening = () => {
    if (isListening) {
      SpeechService.stopListening();
      SpeechService.playTone(420, 60);
      setIsListening(false);
    } else {
      setVoiceNotice(null);
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
      SpeechService.playTone(680, 80);
      setIsListening(true);

      const started = SpeechService.startListening(
        userSelectedLang,
        ({ transcript, isFinal }) => {
          setInputText(transcript);
          if (isFinal) {
            setIsListening(false);
            if (transcript.trim().length > 0) {
              handleSendMessage(transcript);
            }
          }
        },
        (err) => {
          setIsListening(false);
          setVoiceNotice(err);
          console.warn('Speech err:', err);
        },
        () => {
          setIsListening(false);
        }
      );
      if (!started) {
        setIsListening(false);
      }
    }
  };

  // Play / Speak AI Voice Response
  const handlePlayVoice = (text: string, msgId?: string, langOverride?: string) => {
    if (isSpeaking && activeSpeakingMsgId === msgId) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
      return;
    }

    SpeechService.stopSpeaking();
    setIsSpeaking(true);
    if (msgId) setActiveSpeakingMsgId(msgId);

    const voiceLang = langOverride || userSelectedLang;
    SpeechService.speak(
      text,
      voiceLang,
      () => {
        setIsSpeaking(true);
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      }
    );
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    // Reset input
    setInputText('');
    setVoiceNotice(null);

    // If starting fresh
    if (!hasStartedConversation) {
      setHasStartedConversation(true);
      setHelpMeModeActive(true);
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsAiThinking(true);

    // AI Classification (async Gemini model with instant fallback) passing user's preferred language
    const classification = await classifyUserMessage(
      text,
      nextMessages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
      userSelectedLang
    );
    setActiveClassification(classification);
    setIsAiThinking(false);

    // Auto-update selected category in help me mode
    if (classification.category.includes('Road')) setSelectedCategory('Road & Potholes');
    else if (classification.category.includes('Solid') || classification.category.includes('Waste')) setSelectedCategory('Garbage Pickup');
    else if (classification.category.includes('Water')) setSelectedCategory('Water Supply');
    else if (classification.category.includes('Electric') || classification.category.includes('Streetlight')) setSelectedCategory('Streetlight Issue');
    else if (classification.category.includes('Drainage') || classification.category.includes('Sewage')) setSelectedCategory('Drainage & Sewage');

    if (classification.locationHint) {
      setCurrentLocation(classification.locationHint);
    }
    if (classification.wardHint) {
      setCurrentWard(classification.wardHint);
    }

    // AI response bubble
    const botMsgId = `msg-bot-${Date.now()}`;
    const botMsg: ChatMessage = {
      id: botMsgId,
      sender: 'assistant',
      text: classification.conversationalReply,
      timestamp: 'Just now',
      widgetType: classification.needsLocation ? 'location_picker' : undefined,
    };

    setMessages((prev) => [...prev, botMsg]);

    // Speak in the specific language (Marathi / Hindi / English) if not muted
    if (!isAudioMuted) {
      const voiceLang = classification.detectedLanguage || userSelectedLang;
      handlePlayVoice(classification.conversationalReply, botMsgId, voiceLang);
    }
  };

  // Quick Prompt click
  const handleTrySaying = (prompt: string) => {
    setInputText(prompt);
    handleSendMessage(prompt);
  };

  // Handle Location Sharing via Geolocation with fallback
  const handleShareLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const loc = `42 Dharampeth Extension, Nagpur (${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E)`;
          setCurrentLocation(loc);
          setCurrentWard('Dharampeth (Ward 4)');
          
          const confirmMsg: ChatMessage = {
            id: `msg-loc-${Date.now()}`,
            sender: 'assistant',
            text: `📍 GPS Location Locked: ${loc}. Pinned to Dharampeth Zone 2. You can now confirm details and proceed to review.`,
            timestamp: 'Just now',
            widgetType: 'case_summary',
          };
          setMessages((prev) => [...prev, confirmMsg]);
        },
        () => {
          setIsLocating(false);
          setCurrentLocation('Variety Square, West High Court Road, Nagpur');
          setCurrentWard('Dharampeth (Ward 4)');
          const confirmMsg: ChatMessage = {
            id: `msg-loc-${Date.now()}`,
            sender: 'assistant',
            text: '📍 Address set: Variety Square, West High Court Road, Nagpur. Pinned to Dharampeth (Ward 4). You can now attach a photo or review your report.',
            timestamp: 'Just now',
            widgetType: 'case_summary',
          };
          setMessages((prev) => [...prev, confirmMsg]);
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      setCurrentLocation('42 Dharampeth Extension, Nagpur');
    }
  };

  const handleSelectMapLocation = (loc: NagpurLocation) => {
    setCurrentLocation(loc.name);
    setCurrentWard(loc.ward);
    setMapPickerOpen(false);

    const confirmMsg: ChatMessage = {
      id: `msg-loc-${Date.now()}`,
      sender: 'assistant',
      text: `📍 Confirmed location: ${loc.name} (${loc.ward}). Mapped to ${loc.zone}.`,
      timestamp: 'Just now',
      widgetType: 'case_summary',
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  // Handle Photo upload
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setUploadedPhotoUrl(objectUrl);

      const photoMsg: ChatMessage = {
        id: `msg-photo-${Date.now()}`,
        sender: 'user',
        text: `Attached photo evidence: ${file.name}`,
        timestamp: 'Just now',
        meta: { photoUrl: objectUrl },
      };

      setMessages((prev) => [...prev, photoMsg]);

      const reply: ChatMessage = {
        id: `msg-bot-photo-${Date.now()}`,
        sender: 'assistant',
        text: 'Photo received. Our civic inspection squad will use this to dispatch the right vehicle. Tap "Review Report" to finalize.',
        timestamp: 'Just now',
        widgetType: 'case_summary',
      };
      setMessages((prev) => [...prev, reply]);
    }
  };

  // Proceed to review
  const handleProceed = () => {
    const summary = activeClassification
      ? activeClassification.title
      : 'Civic Issue near your locality';
    const dept = activeClassification ? activeClassification.department : 'Solid Waste Management';
    const cat = activeClassification ? activeClassification.category : 'Solid Waste - Collection';
    const raw = messages.filter((m) => m.sender === 'user').map((m) => m.text).join(' ') || 'Civic issue report.';

    onProceedToReview({
      problemSummary: summary,
      rawInput: raw,
      category: cat,
      department: dept,
      location: currentLocation,
      ward: currentWard,
      photoUrl: uploadedPhotoUrl,
    });
  };

  const categoriesList = [
    { id: 'Road & Potholes', icon: Construction, label: 'Road &\nPotholes' },
    { id: 'Garbage Pickup', icon: Trash2, label: 'Garbage\nPickup' },
    { id: 'Water Supply', icon: Droplets, label: 'Water\nSupply' },
    { id: 'Streetlight Issue', icon: Lightbulb, label: 'Streetlight\nIssue' },
    { id: 'Drainage & Sewage', icon: Wrench, label: 'Drainage &\nSewage' },
    { id: 'Something Else', icon: MoreHorizontal, label: 'Something\nElse' },
  ];

  return (
    <div className="w-full bg-[#FAFCFF] min-h-[calc(100vh-140px)] flex flex-col justify-between" id="talk-screen-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*,.pdf"
        className="hidden"
        id="hidden-file-input"
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {!hasStartedConversation ? (
          /* SCREEN 2: What do you need help with? */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Main Prompt Area */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1E38] tracking-tight">
                    What do you need help with?
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    Tell us what happened. You don't need to know which department handles it.
                  </p>
                </div>

                {/* Direct Language Switcher Selector */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl self-start sm:self-auto shrink-0 shadow-2xs">
                  <Languages className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                  <button
                    onClick={() => {
                      setUserSelectedLang('mr');
                      StorageService.setLanguage('mr');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userSelectedLang === 'mr'
                        ? 'bg-[#0B1E38] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    id="lang-toggle-mr"
                  >
                    मराठी
                  </button>
                  <button
                    onClick={() => {
                      setUserSelectedLang('hi');
                      StorageService.setLanguage('hi');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userSelectedLang === 'hi'
                        ? 'bg-[#0B1E38] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    id="lang-toggle-hi"
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => {
                      setUserSelectedLang('en');
                      StorageService.setLanguage('en');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      userSelectedLang === 'en'
                        ? 'bg-[#0B1E38] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    id="lang-toggle-en"
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Voice Notice Banner if mic permission or network error */}
              {voiceNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{voiceNotice}</span>
                  </div>
                  <button
                    onClick={() => setVoiceNotice(null)}
                    className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Active Voice Recording Modal/Banner when mic is active */}
              {isListening && (
                <div className="p-4 bg-gradient-to-r from-blue-900 to-[#0B1E38] text-white rounded-2xl shadow-md border border-blue-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/30 border border-red-400 flex items-center justify-center text-red-300 shrink-0">
                      <Radio className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>
                          {userSelectedLang === 'mr'
                            ? 'माईक चालू आहे - मराठीत बोला...'
                            : userSelectedLang === 'hi'
                            ? 'माइक चालू है - हिंदी में बोलें...'
                            : 'Listening in English... speak now'}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5 max-w-md truncate">
                        {inputText || (userSelectedLang === 'mr' ? 'उदा. "रस्त्यावर मोठा खड्डा आहे..."' : userSelectedLang === 'hi' ? 'उदा. "कचरा नहीं उठाया गया..."' : 'e.g. "Garbage overflow near Dharampeth..."')}
                      </div>
                    </div>
                  </div>

                  {/* Animated Soundwave bars */}
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-5 bg-blue-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-8 bg-blue-200 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-6 bg-blue-100 rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="w-1 h-9 bg-white rounded-full animate-bounce [animation-delay:75ms]" />
                    <span className="w-1 h-4 bg-blue-300 rounded-full animate-bounce [animation-delay:225ms]" />
                    <button
                      onClick={toggleListening}
                      className="ml-3 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Done Speaking
                    </button>
                  </div>
                </div>
              )}

              {/* Input Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    userSelectedLang === 'mr'
                      ? 'नागपूरसेतू ला सांगा काय झाले आहे... (उदा. माझ्या घराजवळ कचरा साचला आहे किंवा खड्डा पडला आहे)'
                      : userSelectedLang === 'hi'
                      ? 'नागपुरसेतु को बताएं क्या समस्या है... (उदा. स्ट्रीट लाइट बंद है या कचरा नहीं उठाया)'
                      : 'Tell NagpurSetu what happened... (e.g. Garbage accumulation near Dharampeth or road damage)'
                  }
                  className="w-full h-32 sm:h-36 resize-none text-base text-slate-800 placeholder:text-slate-400 focus:outline-hidden bg-transparent font-['Noto_Sans_Devanagari']"
                  id="talk-main-textarea"
                />

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Attach photo or document"
                      id="talk-attach-button"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleShareLocation}
                      className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Add your location"
                      id="talk-location-button"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={inputText.trim() ? () => handleSendMessage() : toggleListening}
                      className={`h-12 px-5 rounded-full flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer ${
                        inputText.trim()
                          ? 'bg-[#0B1E38] hover:bg-[#152e52] text-white'
                          : isListening
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-[#0B1E38] hover:bg-[#152e52] text-white'
                      }`}
                      id="talk-mic-or-send-button"
                      title={inputText.trim() ? 'Send Complaint' : 'Tap to Speak (बोला)'}
                    >
                      {inputText.trim() ? (
                        <>
                          <span>Send</span>
                          <Send className="w-4 h-4" />
                        </>
                      ) : isListening ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Tap to Speak ({userSelectedLang === 'mr' ? 'मराठीत बोला' : userSelectedLang === 'hi' ? 'बोलें' : 'Speak'})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Try Saying Section */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>बोलून किंवा टाईप करून सांगा (TRY SAYING...)</span>
                  <span className="text-[11px] font-normal text-blue-900">मराठी • हिन्दी • English</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      handleTrySaying("माझ्या घराजवळ कचरा साचला आहे, त्वरित गाडी पाठवा...")
                    }
                    className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left text-xs sm:text-sm text-slate-800 hover:text-slate-900 transition-all shadow-2xs group flex items-start gap-2.5 font-['Noto_Sans_Devanagari'] cursor-pointer"
                    id="prompt-garbage-marathi"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">"माझ्या घराजवळ कचरा साचला आहे..."</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">कचरा संकलन व स्वच्छता (मराठी)</div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      handleTrySaying("रस्त्यावर मोठा खड्डा आहे, वाहने घसरून अपघात होत आहेत...")
                    }
                    className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left text-xs sm:text-sm text-slate-800 hover:text-slate-900 transition-all shadow-2xs group flex items-start gap-2.5 font-['Noto_Sans_Devanagari'] cursor-pointer"
                    id="prompt-pothole-marathi"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">"रस्त्यावर मोठा खड्डा आहे, अपघात होत आहेत..."</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">रस्ते व खड्डे दुरुस्ती (मराठी)</div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      handleTrySaying("स्ट्रीट लाइट तीन दिन से बंद है, इलाके में अंधेरा है...")
                    }
                    className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left text-xs sm:text-sm text-slate-800 hover:text-slate-900 transition-all shadow-2xs group flex items-start gap-2.5 font-['Noto_Sans_Devanagari'] cursor-pointer"
                    id="prompt-streetlight-hindi"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">"स्ट्रीट लाइट तीन दिन से बंद है..."</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">विद्युत व पथदिवे (हिंदी)</div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      handleTrySaying("पानी की सप्लाई बहुत कम प्रेशर से आ रही है...")
                    }
                    className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left text-xs sm:text-sm text-slate-800 hover:text-slate-900 transition-all shadow-2xs group flex items-start gap-2.5 font-['Noto_Sans_Devanagari'] cursor-pointer"
                    id="prompt-water-hindi"
                  >
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">"पानी की सप्लाई बहुत कम प्रेशर से आ रही है..."</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">जलप्रदाय व पाईपलाईन (हिंदी)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Help Me Guide Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setHasStartedConversation(true);
                    setHelpMeModeActive(true);
                    const welcomeText = userSelectedLang === 'mr'
                      ? 'नमस्कार! नागपूरसेतू नागरिक सहाय्यक सेवेत आपले स्वागत आहे. आपण मराठी, हिंदी किंवा इंग्रजीत बोलू शकता. खालीलपैकी समस्येचा प्रकार निवडा किंवा आपली समस्या सांगा.'
                      : userSelectedLang === 'hi'
                      ? 'नमस्ते! नागपुरसेतु नागरिक सहायता में आपका स्वागत है। आप हिंदी, मराठी या अंग्रेजी में बोल सकते हैं। नीचे दी गई श्रेणी चुनें या अपनी समस्या बताएं।'
                      : 'Namaskar! NagpurSetu Voice & Civic Assistant is ready. You can speak in Marathi, Hindi, or English.';
                    setMessages([
                      {
                        id: 'welcome-guide',
                        sender: 'assistant',
                        text: welcomeText,
                        timestamp: 'Just now',
                      },
                    ]);
                    SpeechService.speak(welcomeText, userSelectedLang);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                  id="help-me-guide-button"
                >
                  <HelpCircle className="w-4 h-4 text-slate-700" />
                  <span>मदत व मार्गदर्शन (Help Me Guide)</span>
                </button>
              </div>
            </div>

            {/* Right Sidebar: Recent Activity */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-[#0B1E38]">
                    Recent Activity
                  </h2>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  {recentCases.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/cases/${item.id}`)}
                      className="pt-3 first:pt-0 space-y-1.5 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 group-hover:text-blue-900 font-semibold">
                          {item.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                            item.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.status === 'Resolved'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 font-medium line-clamp-2 leading-snug">
                        {item.title}
                      </p>

                      <div className="text-[11px] text-slate-400">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => navigate('/cases')}
                    className="w-full flex items-center justify-center gap-1 text-xs font-bold text-[#0B1E38] hover:text-blue-700 transition-colors py-1 cursor-pointer"
                    id="view-all-cases-sidebar-link"
                  >
                    <span>View All Cases</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SCREEN 3: Active Conversation & Help Me Mode */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Navigation & Status */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0B1E38] text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    NagpurSetu Assistant
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online • Instant NMC Routing</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Audio Mute Toggle Button */}
                <button
                  onClick={() => {
                    const next = !isAudioMuted;
                    setIsAudioMuted(next);
                    SpeechService.setMuted(next);
                  }}
                  className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAudioMuted
                      ? 'bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                  }`}
                  title={isAudioMuted ? 'Voice Audio Muted (Click to Unmute)' : 'Voice Audio Active (Click to Mute)'}
                  id="toggle-voice-audio-mute"
                >
                  {isAudioMuted ? (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-blue-700 animate-pulse" />
                  )}
                  <span className="hidden sm:inline">{isAudioMuted ? 'Muted' : 'Voice On'}</span>
                </button>

                <button
                  onClick={handleProceed}
                  className="px-4 py-2 bg-[#0B1E38] hover:bg-[#152e52] text-white text-xs font-semibold rounded-md shadow-xs transition-all cursor-pointer"
                  id="active-chat-review-report-button"
                >
                  Review Report &rarr;
                </button>
              </div>
            </div>

            {/* Date divider */}
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                Today
              </span>
            </div>

            {/* Messages Flow */}
            <div className="space-y-4 pb-4">
              {messages.map((msg) => (
                <React.Fragment key={msg.id}>
                  {msg.sender === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-[#E5E7EB] text-slate-900 rounded-2xl rounded-tr-xs px-4 py-3 text-sm max-w-lg shadow-2xs font-medium">
                        {msg.text}
                        {msg.meta?.photoUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-300">
                            <img
                              src={msg.meta.photoUrl}
                              alt="Upload preview"
                              className="w-full h-36 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 justify-start max-w-2xl">
                      <div className="w-8 h-8 rounded-full bg-[#0B1E38] text-white flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>

                      <div className="space-y-3 w-full">
                        {/* Bot Bubble */}
                        <div className="bg-[#122A4E] text-white rounded-2xl rounded-tl-xs p-4 sm:p-5 text-sm space-y-4 shadow-sm relative group">
                          <div className="flex items-start justify-between gap-2">
                            <p className="leading-relaxed font-medium flex-1">
                              {msg.text}
                            </p>
                            <button
                              onClick={() => handlePlayVoice(msg.text, msg.id)}
                              className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                isSpeaking && activeSpeakingMsgId === msg.id
                                  ? 'bg-blue-500 text-white shadow-xs'
                                  : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
                              }`}
                              title="Listen to response (बोलून दाखवा / सुनाएं)"
                              id={`speak-msg-btn-${msg.id}`}
                            >
                              {isSpeaking && activeSpeakingMsgId === msg.id ? (
                                <>
                                  <Volume2 className="w-4 h-4 text-white animate-pulse" />
                                  <span className="text-[10px] font-bold">Speaking...</span>
                                </>
                              ) : (
                                <Volume2 className="w-4 h-4 text-blue-300" />
                              )}
                            </button>
                          </div>

                          {/* Embedded Interactive Map Preview in Message */}
                          <div className="bg-slate-900 rounded-xl overflow-hidden text-slate-100 border border-slate-700">
                            <NagpurMapViewer
                              selectedLocation={currentLocation}
                              selectedWard={currentWard}
                              onSelectLocation={(loc) => {
                                setCurrentLocation(loc.name);
                                setCurrentWard(loc.ward);
                              }}
                              onConfirmSpot={(loc) => {
                                handleSelectMapLocation(loc);
                              }}
                              height="h-48"
                              interactive={true}
                            />

                            <div className="p-2.5 bg-slate-800/90 flex items-center justify-between gap-2 border-t border-slate-700">
                              <button
                                onClick={handleShareLocation}
                                disabled={isLocating}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                                id="chat-share-location-button"
                              >
                                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                                <span>{isLocating ? 'Fixing GPS...' : 'Use My GPS'}</span>
                              </button>

                              <button
                                onClick={() => setMapPickerOpen(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                id="chat-select-on-map-button"
                              >
                                <span>More Zones & Map</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Photo Upload Card */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl p-4 text-center cursor-pointer transition-colors"
                            id="chat-add-photo-dropzone"
                          >
                            <div className="w-9 h-9 rounded-full bg-white/20 text-white mx-auto flex items-center justify-center mb-2">
                              <Camera className="w-4 h-4" />
                            </div>
                            <div className="text-xs font-bold text-white">
                              Add a photo (Optional)
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              Helps workers find the exact spot faster
                            </div>
                          </div>
                        </div>

                        {msg.widgetType === 'case_summary' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-blue-900">
                                Ready for submission
                              </div>
                              <div className="text-[11px] text-blue-700">
                                Problem categorized and mapped to {currentWard}
                              </div>
                            </div>
                            <button
                              onClick={handleProceed}
                              className="px-4 py-2 bg-[#0B1E38] hover:bg-[#152e52] text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer"
                            >
                              Proceed to Review
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-3 justify-start max-w-md">
                  <div className="w-8 h-8 rounded-full bg-[#0B1E38] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#122A4E] text-slate-200 rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span>NagpurSetu AI analyzing civic report...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Help Me Mode Active Section */}
            {helpMeModeActive && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                  <span>🤝 Help Me Mode Active</span>
                </div>
                <p className="text-xs text-slate-600">
                  Tap a category if this is related to something else:
                </p>

                {/* 6 Categories Grid matching Screenshot 3 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          handleSendMessage(`This is regarding ${cat.id}`);
                        }}
                        className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D3E3FD] border-blue-400 text-[#0B1E38] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        } ${cat.id === 'Something Else' ? 'border-dashed' : ''}`}
                        id={`category-pill-${cat.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold whitespace-pre-line leading-tight">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Persistent Input Bar */}
            <div className="sticky bottom-4 space-y-2">
              {isListening && (
                <div className="bg-gradient-to-r from-[#0B1E38] to-blue-900 text-white px-4 py-2 rounded-xl shadow-lg border border-blue-600 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold">
                      {userSelectedLang === 'mr' ? 'मराठीत बोला... (बोलणे सुरू आहे)' : userSelectedLang === 'hi' ? 'हिंदी में बोलें...' : 'Listening in English...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-4 bg-blue-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-6 bg-blue-200 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="w-1 h-3 bg-blue-300 rounded-full animate-bounce [animation-delay:200ms]" />
                    <button
                      onClick={toggleListening}
                      className="ml-3 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-[11px] font-bold rounded-md cursor-pointer transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-300 rounded-2xl sm:rounded-full px-3 sm:px-4 py-2 shadow-lg flex items-center gap-2 sm:gap-3">
                {/* Language Switch button in chat bar */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => {
                      const next = userSelectedLang === 'mr' ? 'hi' : userSelectedLang === 'hi' ? 'en' : 'mr';
                      setUserSelectedLang(next);
                      StorageService.setLanguage(next);
                    }}
                    className="px-2 py-1 text-[11px] font-extrabold text-[#0B1E38] hover:bg-slate-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                    title="Switch language (मराठी / हिन्दी / English)"
                  >
                    <Globe className="w-3 h-3 text-blue-700" />
                    <span>{userSelectedLang === 'mr' ? 'मराठी' : userSelectedLang === 'hi' ? 'हिन्दी' : 'EN'}</span>
                  </button>
                </div>

                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  id="active-chat-mic-button"
                  title="Speak in selected language"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    userSelectedLang === 'mr'
                      ? 'मराठीत बोला किंवा टाईप करा...'
                      : userSelectedLang === 'hi'
                      ? 'हिंदी में बोलें या टाइप करें...'
                      : 'Type or speak in English / Hindi / Marathi...'
                  }
                  className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden bg-transparent min-w-0 font-['Noto_Sans_Devanagari']"
                  id="active-chat-input"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                  title="Attach photo"
                  id="active-chat-clip-button"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="w-9 h-9 rounded-full bg-[#0B1E38] hover:bg-[#152e52] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                  id="active-chat-send-button"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map Picker Modal */}
      {mapPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B1E38] text-white flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B1E38]">Select Location in Nagpur</h3>
                  <div className="text-[11px] text-slate-500">Pick any zone or landmark for precise NMC municipal routing</div>
                </div>
              </div>
              <button 
                onClick={() => setMapPickerOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                id="close-map-picker-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Map View */}
            <NagpurMapViewer
              selectedLocation={currentLocation}
              selectedWard={currentWard}
              onSelectLocation={(loc) => {
                setCurrentLocation(loc.name);
                setCurrentWard(loc.ward);
              }}
              onConfirmSpot={handleSelectMapLocation}
              height="h-56"
              interactive={true}
            />

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recognized NMC Localities & Zones
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {NAGPUR_LOCALITIES.map((loc) => {
                  const isCur = currentLocation.includes(loc.name.split(',')[0]);
                  return (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectMapLocation(loc)}
                      className={`p-3 text-left border rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isCur
                          ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-900 shadow-2xs'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                      }`}
                      id={`loc-select-${loc.name.substring(0, 15).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate">{loc.name}</div>
                        <div className="text-slate-500 text-[11px] truncate">{loc.ward} • {loc.zone}</div>
                      </div>
                      <MapPin className={`w-4 h-4 shrink-0 ${isCur ? 'text-blue-600' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
