import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Lightbulb, 
  Waves, 
  Construction, 
  Trash2, 
  Droplets, 
  Award, 
  Landmark, 
  Trees, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  ShieldAlert, 
  CheckCircle2, 
  Truck, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Camera, 
  ArrowRight,
  FileText,
  Radio,
  RefreshCw,
  Zap
} from 'lucide-react';
import { PROBLEM_DOMAINS, ProblemDomain } from '../data/problemDomains';
import { StorageService } from '../services/storage';
import { CaseItem } from '../types';

interface SpecializedProblemAIModalProps {
  initialDomainKey?: string;
  initialLocation?: string;
  initialWard?: string;
  onClose: () => void;
  navigate: (route: string) => void;
}

export const SpecializedProblemAIModal: React.FC<SpecializedProblemAIModalProps> = ({
  initialDomainKey = 'street_lights',
  initialLocation = 'Sitabuldi, Nagpur',
  initialWard = 'Dharampeth (Ward 2)',
  onClose,
  navigate,
}) => {
  const [activeDomain, setActiveDomain] = useState<ProblemDomain>(() => {
    return PROBLEM_DOMAINS.find(d => d.key === initialDomainKey) || PROBLEM_DOMAINS[0];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    diagnosticData?: any;
  }>>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [preferredLang, setPreferredLang] = useState<'mr' | 'hi' | 'en'>('mr');
  const [locationName, setLocationName] = useState(initialLocation);
  const [wardName, setWardName] = useState(initialWard);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial welcome greeting tailored strictly to the selected domain
  useEffect(() => {
    const defaultGreetings: Record<string, { mr: string; hi: string; en: string }> = {
      street_lights: {
        mr: `नमस्कार! मी नागपूर महानगरपालिका 'विद्युत व पथदिवे निवारण AI' आहे. आपल्या परिसरातील बंद पथदिवे, तुटलेले खांब, किंवा अंधाराच्या समस्या त्वरित सोडवण्यासाठी मी सज्ज आहे. समस्या किंवा खांबाचा क्रमांक सांगा.`,
        hi: `नमस्ते! मैं नागपुर नगर निगम 'स्ट्रीट लाइट एवं विद्युत समाधान AI' हूँ। बंद स्ट्रीट लाइट, टूटे पोल, या अंधेरे की समस्या का तुरंत समाधान करने के लिए तैयार हूँ। अपनी समस्या बताएं।`,
        en: `Hello! I am the NMC Dedicated 'Street Light & Electrical AI'. I am ready to resolve dark spots, tripped feeders, broken poles, and light outages across Nagpur in real time.`
      },
      flood_drainage: {
        mr: `नमस्कार! मी मनपा 'पूर, जलभराव व सांडपाणी आपत्कालीन निवारण AI' आहे. पावसामुळे रस्त्यावर साचलेले पाणी, तुंबलेली नाली, किंवा मॅनहोल समस्येवर त्वरित डीवॉटरिंग पंप व पथक पाठवण्यासाठी सांगा.`,
        hi: `नमस्ते! मैं NMC 'बाढ़, जलभराव व ड्रेनेज आपातकालीन AI' हूँ। जलभराव, नालियों की रुकावट या सीवेज ओवरफ्लो पर तुरंत सक्शन पंप और दस्ता तैनात करने के लिए तैयार हूँ।`,
        en: `Hello! I am the NMC 'Monsoon Flood & Drainage Emergency Response AI'. I specialize in deploying dewatering pumps, jetting machines, and clearing waterlogged spots across Nagpur.`
      },
      potholes_roads: {
        mr: `नमस्कार! मी मनपा 'रस्ते, खड्डे व वाहतूक सुरक्षा AI' आहे. रस्त्यावरील खड्डे, उखडलेले डांबर, किंवा तुटलेले दुभाजक दुरुस्त करण्यासाठी जेटपॅचर कोल्ड-मिक्स पथक तैनात करण्यास तयार आहे.`,
        hi: `नमस्ते! मैं NMC 'सड़कें, गड्ढे व यातायात सुरक्षा AI' हूँ। खतरनाक गड्ढों और क्षतिग्रस्त सड़कों की मरम्मत के लिए जेटपैचर स्क्वॉड भेजने को तैयार हूँ।`,
        en: `Hello! I am the NMC 'Road Maintenance & Potholes AI'. I specialize in rapid cold-mix asphalt patching and traffic hazard mitigation across Nagpur.`
      },
      garbage_waste: {
        mr: `नमस्कार! मी मनपा 'घनकचरा व स्वच्छता व्यवस्थापन AI' आहे. कचरा कुंडी ओव्हरफ्लो, घंटागाडी न येणे, किंवा अस्वच्छतेवर त्वरित कॉम्पॅक्टर वाहन व स्वच्छता पथक पाठवण्यास तयार आहे.`,
        hi: `नमस्ते! मैं NMC 'कचरा एवं स्वच्छता प्रबंधन AI' हूँ। कचरे के ढेर या सफाई वाहन न आने पर तुरंत सैनिटेशन स्क्वॉड भेजने के लिए तैयार हूँ।`,
        en: `Hello! I am the NMC 'Solid Waste & Public Sanitation AI'. I dispatch compactor vehicles and spot disinfection crews in real time.`
      },
      water_supply: {
        mr: `नमस्कार! मी मनपा व OCW 'पाणीपुरवठा व जलगळती निवारण AI' आहे. पाइपलाइन फुटणे, कमी दाबाने पाणी येणे, किंवा पिण्याच्या पाण्याचा टँकर बुक करण्यासाठी सांगा.`,
        hi: `नमस्ते! मैं NMC एवं OCW 'जल आपूर्ति व लीकेज AI' हूँ। पाइपलाइन लीकेज, कम प्रेशर, या मुफ्त पानी का टैंकर बुक करने के लिए तैयार हूँ।`,
        en: `Hello! I am the NMC & OCW '24x7 Water Supply & Leakage AI'. I coordinate pipe burst isolation, water testing, and emergency tanker dispatch.`
      },
      certificates: {
        mr: `नमस्कार! मी 'दाखले व प्रमाणपत्र महसूल AI' आहे. उत्पन्न, अधिवास (Domicile), जात प्रमाणपत्र, किंवा जन्म-मृत्यू दाखल्यासाठी आवश्यक कागदपत्रे व अर्ज प्रक्रिया विचारू शकता.`,
        hi: `नमस्ते! मैं 'प्रमाणपत्र एवं राजस्व AI' हूँ। आय, अधिवास, जाति प्रमाणपत्र, या जन्म-मृत्यु प्रमाण पत्रों की ऑनलाइन प्रक्रिया में मदद के लिए तैयार हूँ।`,
        en: `Hello! I am the 'Citizen Certificates & Revenue AI'. I provide instant checklists and RTS fast-track steps for Maharashtra government certificates.`
      },
      schemes: {
        mr: `नमस्कार! मी 'शासकीय योजना व अनुदान AI' आहे. पीएम सूर्य घर (सोलर ₹७८,००० अनुदान), पीएम आवास, किंवा लाडकी बहीण योजनेच्या पात्रतेसाठी विचारा.`,
        hi: `नमस्ते! मैं 'सरकारी योजना एवं सब्सिडी AI' हूँ। पीएम सूर्य घर, पीएम आवास, या स्वनिधि योजना की पात्रता और सब्सिडी की गणना के लिए तैयार हूँ।`,
        en: `Hello! I am the 'Government Schemes & Subsidy AI'. I calculate subsidies and eligibility for central & state government schemes in Nagpur.`
      },
      encroachment_trees: {
        mr: `नमस्कार! मी 'वृक्ष प्राधिकरण व आपत्कालीन AI' आहे. वादळामुळे पडलेली झाडे, विजेच्या तारांना लागणाऱ्या फांद्या तोडण्यासाठी हायड्रॉलिक कटर पथक पाठवण्यास सज्ज आहे.`,
        hi: `नमस्ते! मैं 'वृक्ष सुरक्षा एवं आपातकालीन AI' हूँ। गिरी हुई पेड़ों की शाखाओं को हटाने के लिए हाइड्रोलिक प्रूनर दस्ता भेजने को तैयार हूँ।`,
        en: `Hello! I am the 'Tree Hazards & Emergency AI'. I dispatch emergency hydraulic chainsaw crews for fallen trees across Nagpur roads.`
      }
    };

    const text = defaultGreetings[activeDomain.key]?.[preferredLang] || defaultGreetings[activeDomain.key]?.mr || 'Hello, I am your specialized problem AI.';

    setMessages([
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [activeDomain, preferredLang]);

  // Speech Recognition
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = preferredLang === 'mr' ? 'mr-IN' : preferredLang === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
        // Auto send after speech
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const clean = text.replace(/[*#_~]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = preferredLang === 'mr' ? 'mr-IN' : preferredLang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Send message to real-time Problem AI API
  const handleSendMessage = async (msgOverride?: string) => {
    const textToSend = (msgOverride || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsgObj = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsgObj]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/solve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: activeDomain.key,
          userMessage: textToSend,
          location: locationName,
          ward: wardName,
          language: preferredLang,
          history: messages.slice(-4)
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch AI solution');
      }

      const data = await res.json();

      const assistantMsgObj = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant' as const,
        text: data.reply || 'Problem evaluated and assigned to the rapid municipal dispatch unit.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diagnosticData: data
      };

      setMessages(prev => [...prev, assistantMsgObj]);
    } catch (err) {
      console.error(err);
      // Fallback
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant' as const,
          text: preferredLang === 'mr'
            ? `आपल्या समस्येची नोंद घेण्यात आली आहे. संबंधित ${activeDomain.department} पथकाला तातडीने प्रत्यक्ष पाहणीसाठी सूचना देण्यात आली आहे.`
            : `We have registered your issue. The ${activeDomain.department} squad has been dispatched for field inspection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Diagnostic Solution into Formal Case in StorageService
  const handleCreateCaseFromDiagnostic = (diag: any) => {
    const newCase: CaseItem = {
      id: `NS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: diag.workOrder?.ticketTitle || `${activeDomain.title} - ${locationName}`,
      description: diag.diagnosis || `${activeDomain.title} reported at ${locationName}`,
      category: activeDomain.title,
      department: (diag.workOrder?.department || activeDomain.department) as any,
      location: locationName,
      ward: wardName,
      citizenName: 'Nagpur Citizen',
      citizenPhone: '9823000000',
      citizenId: 'CITIZEN-CURRENT',
      status: 'Assigned',
      priority: diag.workOrder?.priority || 'High',
      slaStatus: 'On Track',
      expectedResolutionDays: Math.ceil((diag.workOrder?.slaHours || 24) / 24),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedOfficer: diag.workOrder?.wardEngineer || 'Er. S. M. Patil (Ward Executive Engineer)',
      assignedOfficerPhone: diag.workOrder?.helpline || activeDomain.emergencyHelpline,
      attachments: [],
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          title: 'Problem Evaluated by Specialized AI',
          timestamp: new Date().toLocaleString(),
          description: `Diagnosed by ${activeDomain.title}. Work order dispatched.`,
          status: 'completed',
          dotColor: 'dark'
        },
        {
          id: `tl-${Date.now()}-2`,
          title: 'Rapid Squad Dispatched',
          timestamp: new Date().toLocaleString(),
          description: `Assigned unit: ${diag.workOrder?.assignedUnit || 'Zonal Unit #1'}`,
          status: 'current',
          dotColor: 'orange'
        },
        {
          id: `tl-${Date.now()}-3`,
          title: 'Field Verification & Resolution',
          timestamp: 'Expected within SLA',
          status: 'pending',
          dotColor: 'gray'
        }
      ]
    };

    StorageService.addCase(newCase);
    setCreatedCaseId(newCase.id);
  };

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lightbulb': return <Lightbulb className="w-4 h-4" />;
      case 'Waves': return <Waves className="w-4 h-4" />;
      case 'Construction': return <Construction className="w-4 h-4" />;
      case 'Trash2': return <Trash2 className="w-4 h-4" />;
      case 'Droplets': return <Droplets className="w-4 h-4" />;
      case 'Award': return <Award className="w-4 h-4" />;
      case 'Landmark': return <Landmark className="w-4 h-4" />;
      case 'Trees': return <Trees className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in" id="specialized-ai-modal">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="bg-[#0B1E38] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center border border-white/20">
              {getDomainIcon(activeDomain.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Dedicated Objective AI
                </span>
                <span className="text-xs text-blue-200 hidden sm:inline">
                  • {activeDomain.department}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {activeDomain.title}
              </h2>
              <p className="text-[11px] text-blue-200 -mt-0.5">
                {activeDomain.marathiTitle} • {activeDomain.hindiTitle}
              </p>
            </div>
          </div>

          {/* Language selector & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/15 text-[11px] font-bold">
              <button
                onClick={() => setPreferredLang('mr')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  preferredLang === 'mr' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setPreferredLang('hi')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  preferredLang === 'hi' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setPreferredLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  preferredLang === 'en' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Objective Domain Switcher Strip */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase px-2 whitespace-nowrap">
            Choose Problem AI:
          </span>
          {PROBLEM_DOMAINS.map((domain) => {
            const isCurrent = domain.id === activeDomain.id;
            return (
              <button
                key={domain.id}
                onClick={() => {
                  setActiveDomain(domain);
                  setCreatedCaseId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0B1E38] text-white shadow-sm scale-102'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {getDomainIcon(domain.iconName)}
                <span>{domain.title.replace(' AI', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Location & Quick Context Header */}
        <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-amber-950 shrink-0 gap-2">
          <div className="flex items-center gap-2 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Problem Zone:</span>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="px-2 py-0.5 bg-white border border-amber-300 rounded-md font-bold text-slate-900 focus:outline-hidden text-xs max-w-[200px]"
            />
            <span className="text-amber-700 font-semibold">• {wardName}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-amber-900">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-700" />
              SLA: {activeDomain.slaHours}h Rapid Resolution
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-amber-200">
              <PhoneCall className="w-3 h-3 text-red-600" />
              Helpline: {activeDomain.emergencyHelpline}
            </span>
          </div>
        </div>

        {/* Chat & Problem Diagnostic Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAFC]">
          
          {/* Sample Prompts for this Domain */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick {activeDomain.title.replace(' AI', '')} Scenarios:
              </span>
              <span>Click to test instantly</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeDomain.sampleProblems.map((prob, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLocationName(prob.suggestedLocation);
                    handleSendMessage(prob.description);
                  }}
                  className="text-left text-xs font-semibold px-3 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${prob.priority === 'Critical' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                  <span>{prob.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#0B1E38] text-amber-400 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    {getDomainIcon(activeDomain.iconName)}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2.5 ${isUser ? 'text-right' : 'text-left'}`}>
                  
                  {/* Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#0B1E38] text-white rounded-tr-xs shadow-xs font-medium'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => speakText(msg.text)}
                          className="text-slate-500 hover:text-blue-900 flex items-center gap-1 font-semibold"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rich Domain Diagnostic Card if available */}
                  {msg.diagnosticData && (
                    <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md text-left text-xs animate-fade-in">
                      
                      {/* Diagnostic Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-900 font-extrabold text-[10px] uppercase">
                            Real-Time Engineering Triage
                          </span>
                          <h4 className="text-sm font-bold text-[#0B1E38] mt-1">
                            {msg.diagnosticData.workOrder?.ticketTitle || 'Civic Incident Diagnostics'}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {msg.diagnosticData.diagnosis}
                          </p>
                        </div>

                        <div className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl font-extrabold text-[11px] shrink-0 text-center">
                          <div>SLA</div>
                          <div className="text-sm font-black text-amber-950">{msg.diagnosticData.workOrder?.slaHours || 24}h</div>
                        </div>
                      </div>

                      {/* Work Order Details */}
                      {msg.diagnosticData.workOrder && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Assigned Squad Unit:</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-blue-800" />
                              {msg.diagnosticData.workOrder.assignedUnit}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Ward Executive Officer:</span>
                            <span className="font-bold text-slate-900">
                              {msg.diagnosticData.workOrder.wardEngineer}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Immediate Action Steps */}
                      {msg.diagnosticData.immediateActionSteps && (
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-800 text-xs block">
                            Automatic Resolution Action Plan:
                          </span>
                          <div className="space-y-1">
                            {msg.diagnosticData.immediateActionSteps.map((step: string, sIdx: number) => (
                              <div key={sIdx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg text-slate-700 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety Caution */}
                      {msg.diagnosticData.safetyAdvisory && (
                        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-950 text-xs font-semibold flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>{msg.diagnosticData.safetyAdvisory}</span>
                        </div>
                      )}

                      {/* Quick Interactive Actions */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {createdCaseId ? (
                          <div className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              Case Registered: #{createdCaseId}
                            </span>
                            <button
                              onClick={() => {
                                onClose();
                                navigate(`/cases`);
                              }}
                              className="text-xs px-3 py-1 bg-emerald-800 text-white rounded-lg hover:bg-emerald-900"
                            >
                              View in My Cases
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreateCaseFromDiagnostic(msg.diagnosticData)}
                            className="px-4 py-2 bg-[#0B1E38] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Dispatch Squad & Create Tracking Ticket</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onClose();
                            navigate('/hotspots');
                          }}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1"
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-700" />
                          <span>View on Hotspot Map</span>
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0B1E38]" />
              <span>{activeDomain.title} is analyzing real-time Nagpur civic telemetry...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white animate-ping'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Voice Input (Hindi/Marathi/English)"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-slate-700" />}
            </button>

            <input
              type="text"
              placeholder={`Ask ${activeDomain.title} in Marathi, Hindi, or English (e.g., 'Street light band hai', 'Water logging in underpass')...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B1E38] focus:bg-white"
            />

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3 bg-[#0B1E38] hover:bg-blue-900 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center gap-1.5 shadow-sm text-xs sm:text-sm cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Solve</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
