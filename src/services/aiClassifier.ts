import { Department, Language, PriorityLevel } from '../types';

export interface ClassificationResult {
  intent: 'complaint' | 'service_request' | 'track_case' | 'inquiry' | 'general';
  category: string;
  department: Department;
  title: string;
  locationHint?: string;
  wardHint?: string;
  priority: PriorityLevel;
  slaDays: number;
  detectedLanguage: Language;
  conversationalReply: string;
  needsLocation: boolean;
  needsPhoto: boolean;
  suggestedAction?: 'location_picker' | 'photo_upload' | 'case_summary' | 'duplicate_warning' | 'categories';
  duplicateRisk?: boolean;
}

// Local fast rule-based classifier (instant offline / fallback engine)
export const classifyUserMessageLocal = (text: string, currentLang: string = 'mr'): ClassificationResult => {
  const lower = text.toLowerCase().trim();

  // Detect language accurately
  let detectedLang: Language = currentLang === 'mr' ? 'mr' : currentLang === 'hi' ? 'hi' : 'en';

  if (/[\u0900-\u097F]/.test(text)) {
    // Check Devanagari vocabulary for Marathi vs Hindi
    if (/आहे|नाही|माझ्या|घराजवळ|रस्त्यावर|तुंबली|कचरा|खड्डा|झाला|करा|दाखला|दिवे|पाणी|नाली/.test(text)) {
      detectedLang = 'mr';
    } else {
      detectedLang = 'hi';
    }
  } else if (/mein|nahi|hai|kahan|karo|bhi|raha|gaya|paani|sadak|khadda|kachra|mera|meri|band|ho|gayi/.test(lower)) {
    detectedLang = 'hi';
  } else if (/ahe|nahi|mazya|gharjaval|rastya|pani|diwa|kiti|kuthe/.test(lower)) {
    detectedLang = 'mr';
  } else if (currentLang === 'mr' || currentLang === 'hi') {
    detectedLang = currentLang;
  }

  // Check for Case Tracking intent
  if (
    lower.includes('track') ||
    lower.includes('status') ||
    lower.includes('check my') ||
    lower.includes('kya hua') ||
    lower.includes('complaint status') ||
    lower.includes('mera complaint') ||
    lower.includes('माझी तक्रार') ||
    lower.includes('तक्रार स्थिती')
  ) {
    let reply = 'Here are your recent registered civic cases and their live departmental status:';
    if (detectedLang === 'mr') {
      reply = 'येथे तुमच्या नुकत्याच नोंदवलेल्या तक्रारी आणि त्यांची सद्यस्थिती आहे:';
    } else if (detectedLang === 'hi') {
      reply = 'आपकी दर्ज की गई शिकायतों का लाइव स्टेटस नीचे देख सकते हैं:';
    }

    return {
      intent: 'track_case',
      category: 'Tracking',
      department: 'Solid Waste Management',
      title: 'Case Tracking Request',
      priority: 'Normal',
      slaDays: 0,
      detectedLanguage: detectedLang,
      conversationalReply: reply,
      needsLocation: false,
      needsPhoto: false,
    };
  }

  // 1. Solid Waste Management / Garbage
  if (
    lower.includes('garbage') ||
    lower.includes('kachra') ||
    lower.includes('कचरा') ||
    lower.includes('waste') ||
    lower.includes('trash') ||
    lower.includes('safai') ||
    lower.includes('dustbin') ||
    lower.includes('dump') ||
    lower.includes('उचलला नाही')
  ) {
    let reply =
      'नमस्ते, मैंने कचरे की समस्या नोट कर ली है। कृपया अपना सटीक स्थान या गली का नाम बताएं ताकि सफाई टीम भेजी जा सके।';
    if (detectedLang === 'mr') {
      reply = 'नक्कीच, मी मदत करतो. कचरा कोणत्या ठिकाणी साचला आहे? कृपया आपले अचूक ठिकाण शेअर करा.';
    } else if (detectedLang === 'en') {
      reply = 'Understood. I can help resolve this Solid Waste issue. Please share the exact location where garbage has accumulated.';
    }

    return {
      intent: 'complaint',
      category: 'Solid Waste - Collection',
      department: 'Solid Waste Management',
      title: 'Uncollected Garbage Accumulation',
      locationHint: lower.includes('dharampeth') ? 'Dharampeth' : lower.includes('mangalwari') ? 'Mangalwari' : undefined,
      priority: 'Elevated',
      slaDays: 2,
      detectedLanguage: detectedLang,
      conversationalReply: reply,
      needsLocation: true,
      needsPhoto: true,
      suggestedAction: 'location_picker',
    };
  }

  // 2. Roads & Potholes / Traffic
  if (
    lower.includes('pothole') ||
    lower.includes('khadda') ||
    lower.includes('खड्डा') ||
    lower.includes('road') ||
    lower.includes('रस्ता') ||
    lower.includes('sadak') ||
    lower.includes('variety square') ||
    lower.includes('traffic') ||
    lower.includes('damar')
  ) {
    let reply =
      'सड़क और गड्ढे की शिकायत दर्ज कर ली गई है। कृपया सटीक स्थान बताएं या मैप पर मार्क करें।';
    if (detectedLang === 'mr') {
      reply = 'मी रस्ता दुरुस्ती विभागाला त्वरित सूचित करत आहे. खड्ड्याचे अचूक ठिकाण मॅपवर निवडा किंवा पत्ता सांगा.';
    } else if (detectedLang === 'en') {
      reply = 'I have identified a Road & Pothole issue. Please share the exact street or landmark so the road maintenance squad can inspect it.';
    }

    const isVarietySquare = lower.includes('variety square') || lower.includes('dharampeth');

    return {
      intent: 'complaint',
      category: 'Roads & Traffic - Potholes',
      department: 'Roads & Traffic',
      title: 'Damaged Road Surface / Pothole',
      locationHint: isVarietySquare ? 'Near Variety Square, Dharampeth, Nagpur' : undefined,
      wardHint: isVarietySquare ? 'Dharampeth (Ward 4)' : undefined,
      priority: 'High',
      slaDays: 2,
      detectedLanguage: detectedLang,
      conversationalReply: reply,
      needsLocation: true,
      needsPhoto: true,
      suggestedAction: 'location_picker',
      duplicateRisk: isVarietySquare,
    };
  }

  // 3. Drainage / Water Logging / Sewage
  if (
    lower.includes('water log') ||
    lower.includes('waterlog') ||
    lower.includes('drain') ||
    lower.includes('naali') ||
    lower.includes('nali') ||
    lower.includes('नाली') ||
    lower.includes('तुंबली') ||
    lower.includes('sewage') ||
    lower.includes('paani bhar') ||
    lower.includes('gutter')
  ) {
    let reply =
      'नाली और सीवरेज की समस्या नोट कर ली गई है। ड्रेनेज टीम भेजने के लिए कृपया लोकेशन शेयर करें।';
    if (detectedLang === 'mr') {
      reply = 'नाली तुंबल्याची तक्रार नोंदवली आहे. सांडपाणी विभागासाठी कृपया अचूक ठिकाण शेअर करा.';
    } else if (detectedLang === 'en') {
      reply = 'I have registered the drainage and water-logging concern. Please provide the location details.';
    }

    return {
      intent: 'complaint',
      category: 'Drainage & Sewage',
      department: 'Drainage & Sewage',
      title: 'Choked Drainage & Sewage Overflow',
      priority: 'High',
      slaDays: 1,
      detectedLanguage: detectedLang,
      conversationalReply: reply,
      needsLocation: true,
      needsPhoto: true,
      suggestedAction: 'location_picker',
    };
  }

  // 4. Streetlight / Electrical
  if (
    lower.includes('streetlight') ||
    lower.includes('street light') ||
    lower.includes('light') ||
    lower.includes('लाइट') ||
    lower.includes('pole') ||
    lower.includes('dark') ||
    lower.includes('bijli') ||
    lower.includes('diwa')
  ) {
    let reply =
      'स्ट्रीट लाइट बंद होने की शिकायत दर्ज कर ली गई है। कृपया पोल नंबर या सटीक गली का नाम बताएं।';
    if (detectedLang === 'mr') {
      reply = 'पथदिव्यांची तक्रार नोंदवून घेतली आहे. कृपया खांब क्रमांक किंवा ठिकाण सांगा.';
    } else if (detectedLang === 'en') {
      reply = 'Streetlight malfunction identified. Please share the pole number or street location for the electrical maintenance unit.';
    }

    return {
      intent: 'complaint',
      category: 'Electrical - Maintenance',
      department: 'Electrical & Streetlights',
      title: 'Streetlight Not Functioning',
      priority: 'Normal',
      slaDays: 2,
      detectedLanguage: detectedLang,
      conversationalReply: reply,
      needsLocation: true,
      needsPhoto: false,
      suggestedAction: 'location_picker',
    };
  }

  // 5. Water Supply / Drinking Water
  if (
    lower.includes('water supply') ||
    lower.includes('drinking water') ||
    lower.includes('paani nahi') ||
    lower.includes('pressure') ||
    lower.includes('pani') ||
    lower.includes('पाणी') ||
    lower.includes('pipe leak')
  ) {
    let reply =
      'जलप्रदाय विभाग (Water Works) को सूचित किया जा रहा है। कृपया अपना इलाका और नल का प्रेशर बताएं।';
    if (detectedLang === 'mr') {
      reply = 'पाणीपुरवठा विभागाला सूचित केले जात आहे. आपला परिसर आणि समस्येचे ठिकाण सांगा.';
    } else if (detectedLang === 'en') {
      reply = 'Water Works concern detected. Please provide your locality to verify pipeline pressure with OCW/NMC.';
    }

    return {
      intent: 'complaint',
      category: 'Water Works',
      department: 'Water Works',
      title: 'Water Supply Disruption / Low Pressure',
      priority: 'High',
      slaDays: 1,
      detectedLanguage: detectedLang,
      conversationalReply: reply,
      needsLocation: true,
      needsPhoto: false,
      suggestedAction: 'location_picker',
    };
  }

  // 6. Birth / Death / Certificates / Service Request
  if (
    lower.includes('certificate') ||
    lower.includes('birth') ||
    lower.includes('death') ||
    lower.includes('tax') ||
    lower.includes('license') ||
    lower.includes('apply') ||
    lower.includes('दाखला') ||
    lower.includes('प्रमाणपत्र')
  ) {
    let reply =
      'NagpurSetu aapko municipal service ke liye guide karega. Aapko kaun sa certificate ya service chahiye?';
    if (detectedLang === 'mr') {
      reply = 'नागपूरसेतू तुम्हाला महापालिका सेवेसाठी मार्गदर्शन करेल. आपल्याला कोणता दाखला किंवा सेवा हवी आहे?';
    } else if (detectedLang === 'en') {
      reply = 'I can help you apply for NMC citizen certificates and municipal services directly without visiting civic offices.';
    }

    return {
      intent: 'service_request',
      category: 'Town Planning & Birth/Death',
      department: 'Town Planning & Birth/Death',
      title: 'Municipal Certificate / Service Request',
      priority: 'Normal',
      slaDays: 5,
      detectedLanguage: detectedLang,
      conversationalReply: reply,
      needsLocation: false,
      needsPhoto: false,
    };
  }

  // Generic / Vague fallback
  let defaultReply =
    'Main samajh gaya. Kripya thoda aur batayein ki kya samasya hai — jaise road, kachra, paani ya streetlight?';
  if (detectedLang === 'mr') {
    defaultReply =
      'मी समजलो. कृपया अधिक माहिती द्या — जसे की रस्ता, कचरा, पाणीपुरवठा किंवा पथदिवे यांपैकी कशाबद्दल समस्या आहे?';
  } else if (detectedLang === 'en') {
    defaultReply =
      'Tell NagpurSetu what happened. You can mention issues with road damage, uncollected waste, water supply, or streetlights.';
  }

  return {
    intent: 'general',
    category: 'General Civic Inquiry',
    department: 'Solid Waste Management',
    title: 'Civic Issue Report',
    priority: 'Normal',
    slaDays: 3,
    detectedLanguage: detectedLang,
    conversationalReply: defaultReply,
    needsLocation: true,
    needsPhoto: false,
    suggestedAction: 'categories',
  };
};

// Async hybrid classifier calling the server-side Gemini endpoint with instant fallback
export const classifyUserMessage = async (
  text: string,
  history: Array<{ sender: string; text: string }> = [],
  currentLang: string = 'en'
): Promise<ClassificationResult> => {
  try {
    const res = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        history,
        language: currentLang,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    if (data && data.conversationalReply) {
      return data as ClassificationResult;
    }
  } catch (err) {
    console.warn('Backend AI service fallback triggered:', err);
  }

  // Gracefully fallback to deterministic local engine
  return classifyUserMessageLocal(text, currentLang);
};

