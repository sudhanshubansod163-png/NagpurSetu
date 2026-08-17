import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Resilient multi-model execution with automatic fallbacks for 503/429 errors
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-3.7-flash"
];

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: string,
  systemInstruction: string
): Promise<any | null> {
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const replyText = response.text ? response.text.trim() : "{}";
      try {
        return JSON.parse(replyText);
      } catch {
        const cleaned = replyText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      console.warn(`Model ${model} returned error: ${err.message || err}. Trying next fallback...`);
    }
  }
  return null;
}

// Generate rich, authentic local domain fallback when cloud models are temporarily busy or rate-limited
function generateLocalDomainDiagnostic(domainKey: string, userMessage: string, location?: string, ward?: string, prefLang: string = 'mr') {
  const loc = location || 'Nagpur';
  const wrd = ward || 'Dharampeth (Ward 2)';

  const domainDefaults: Record<string, {
    dept: string;
    unit: string;
    sla: number;
    priority: string;
    engineer: string;
    helpline: string;
    safety: { mr: string; hi: string; en: string };
    diag: { mr: string; hi: string; en: string };
    reply: { mr: string; hi: string; en: string };
    steps: { mr: string[]; hi: string[]; en: string[] };
    actions: { mr: string[]; hi: string[]; en: string[] };
  }> = {
    street_lights: {
      dept: 'NMC Electrical & Streetlight Division',
      unit: 'Sky-Lift Hydraulic Boom Unit #04',
      sla: 24,
      priority: 'High',
      engineer: 'Er. R. S. Meshram (Executive Electrical Engineer)',
      helpline: '0712-2567035 (NMC Streetlights)',
      safety: {
        mr: 'काळजी घ्या: ओल्या खांबांना किंवा उघड्या तारांना हात लावू नका.',
        hi: 'सावधानी: गीले खंभों या खुली तारों को बिल्कुल न छुएं।',
        en: 'Safety Alert: Do not touch wet poles or exposed cables.'
      },
      diag: {
        mr: `पथदिवा बिघाड व अंधार पट्टा तपासणी: ${loc} परिसरात त्वरित दुरुस्तीची नोंद.`,
        hi: `स्ट्रीट लाइट खराबी एवं डार्क स्पॉट: ${loc} में तत्काल मरम्मत कार्य शुरू किया गया।`,
        en: `Streetlight outage identified at ${loc}. Priority line testing and boom truck routed.`
      },
      reply: {
        mr: `नमस्कार! आपल्या ${loc} मधील पथदिव्यांच्या समस्येची नोंद घेतली आहे. स्काय-लिफ्ट हायड्रॉलिक युनिट #०४ ला तात्काळ घटनास्थळी रवाना करण्याचे आदेश दिले आहेत.`,
        hi: `नमस्ते! आपके ${loc} में स्ट्रीट लाइट समस्या दर्ज कर ली गई है। स्काई-लिफ्ट यूनिट #04 को मौके पर भेज दिया गया है।`,
        en: `Hello! We have registered your streetlight report at ${loc}. Sky-Lift Unit #04 has been dispatched for rapid restoration.`
      },
      steps: {
        mr: ['खांब व MCB ब्रेकर सर्किट तपासणी सुरू', 'हायड्रॉलिक स्काय-लिफ्ट युनिट घटनास्थळी रवाना', '२४ तासांच्या आत पथदिवा कार्यान्वित करण्याचे आदेश'],
        hi: ['पोल और सर्किट ब्रेकर की जांच शुरू', 'हाइड्रोलिक स्काई-लिफ्ट दस्ता रवाना', '24 घंटे के भीतर लाइट चालू करने के निर्देश'],
        en: ['Feeder line and MCB breaker diagnostic', 'Sky-Lift boom vehicle dispatched to site', 'Restoration mandated within 24 hours']
      },
      actions: {
        mr: ['पथक पाठवा', 'मॅपवर पहा', 'लाइव्ह ट्रॅक करा'],
        hi: ['दस्ता भेजें', 'मैप पर देखें', 'लाइव ट्रैक करें'],
        en: ['Dispatch Squad', 'View on Map', 'Track Live']
      }
    },
    flood_drainage: {
      dept: 'NMC Monsoon Flood & Drainage Control Room',
      unit: 'High-Power Dewatering Suction Pump Squad #02',
      sla: 4,
      priority: 'Critical',
      engineer: 'Er. Pravin Patil (Flood Control Officer)',
      helpline: '0712-2567035 / 101 (Emergency)',
      safety: {
        mr: 'सावधान: रस्त्यावरील उघडे मॅनहोल किंवा वेगाने वाहणाऱ्या पाण्याच्या प्रवाहापासून दूर राहा.',
        hi: 'सावधानी: खुले मैनहोल और तेज पानी के बहाव से सुरक्षित दूरी बनाए रखें।',
        en: 'Warning: Watch for open manholes and avoid moving through deep waterlogged currents.'
      },
      diag: {
        mr: `जलभराव व नाली तुंबल्याची पाहणी: ${loc} मध्ये डीवॉटरिंग पंप तैनात.`,
        hi: `जलभराव व नाली जाम: ${loc} में सक्शन पंप स्क्वॉड तैनात।`,
        en: `Severe waterlogging diagnosed at ${loc}. Immediate suction pump mobilization.`
      },
      reply: {
        mr: `आपत्कालीन दखल! ${loc} येथील साचलेल्या पाण्याचा निचरा करण्यासाठी ६-इंच डीवॉटरिंग सक्शन पंप व सुपर सकर मशीन रवाना केले आहे.`,
        hi: `आपातकालीन सूचना! ${loc} में भरे पानी की निकासी के लिए 6-इंच डीवॉटरिंग सक्शन पंप रवाना कर दिया गया है।`,
        en: `Emergency response active! 6-inch high-power Dewatering Pump Squad #02 has been dispatched to clear waterlogging at ${loc}.`
      },
      steps: {
        mr: ['६-इंच डीवॉटरिंग पंप चालू केला', 'तुंबलेली जलवाहिनी व मॅनहोल गाळ उपसा सुरू', 'वाहतूक सुरळीत करण्यासाठी बॅरिकेडिंग'],
        hi: ['6-इंच सक्शन पंप चालू किया गया', 'नाली व मैनहोल से सिल्ट की त्वरित सफाई', 'यातायात सुरक्षा के लिए बैरिकेडिंग'],
        en: ['6-inch suction pump deployed', 'Stormwater channel silt unblocking', 'Traffic hazard cones positioned']
      },
      actions: {
        mr: ['डीवॉटरिंग सुरू करा', 'मॅपवर लोकेशन पहा', 'स्थिती ट्रॅक करा'],
        hi: ['पंप चालू करें', 'मैप पर देखें', 'स्थिति ट्रैक करें'],
        en: ['Deploy Dewatering', 'View Map', 'Track Squad']
      }
    },
    potholes_roads: {
      dept: 'NMC Road Infrastructure & Maintenance',
      unit: 'Jetpatcher Cold-Mix Rapid Squad #01',
      sla: 48,
      priority: 'High',
      engineer: 'Er. S. M. Deshmukh (Zonal Road Engineer)',
      helpline: '1800-233-3764',
      safety: {
        mr: 'वाहतूक सूचना: दुरुस्तीच्या ठिकाणी वाहनाचा वेग कमी ठेवा.',
        hi: 'यातायात निर्देश: मरम्मत स्थल के पास गति धीमी रखें।',
        en: 'Traffic Advisory: Reduce speed near active road resurfacing zones.'
      },
      diag: {
        mr: `रस्त्यावरील खड्डे तपासणी: ${loc} येथे जेटपॅचर डांबरी पॅचिंग प्रस्तावित.`,
        hi: `सड़क के गड्ढे: ${loc} पर कोल्ड-मिक्स जेटपैचर द्वारा मरम्मत निर्धारित।`,
        en: `Road crater assessment completed at ${loc}. Jetpatcher asphalt squad queued.`
      },
      reply: {
        mr: `नमस्कार! ${loc} येथील खड्ड्यांची तक्रार नोंदवून मनपाच्या जेटपॅचर कोल्ड-मिक्स पथकाकडे वर्ग करण्यात आली आहे.`,
        hi: `नमस्ते! ${loc} के गड्ढे की शिकायत नोट कर जेटपैचर स्क्वॉड को सौंप दी गई है।`,
        en: `We have registered the road defect at ${loc}. Cold-mix asphalt restoration squad is dispatched.`
      },
      steps: {
        mr: ['खड्ड्याची खोली व लांबी मोजणी', 'जेटपॅचर कोल्ड-मिक्स डांबर भरणे', 'रोलर दाब देऊन पृष्ठभाग सपाट करणे'],
        hi: ['गड्ढे के आकार की डिजिटल मैपिंग', 'जेटपैचर से डामर मिश्रण का भराव', 'रोलर द्वारा समतलीकरण'],
        en: ['Crater dimensions recorded', 'Jetpatcher asphalt application', 'Roller compaction and leveling']
      },
      actions: {
        mr: ['जेटपॅचर पाठवा', 'मॅपवर पहा', 'तक्रार ट्रॅक करा'],
        hi: ['दस्ता भेजें', 'मैप पर देखें', 'ट्रैक करें'],
        en: ['Dispatch Jetpatcher', 'View on Map', 'Track Case']
      }
    },
    garbage_waste: {
      dept: 'NMC Solid Waste Management',
      unit: 'BVG / AG Enviro Compactor Truck #12',
      sla: 24,
      priority: 'High',
      engineer: 'Er. Nitin Shinde (Health & Sanitation Officer)',
      helpline: '1800-233-3764',
      safety: {
        mr: 'स्वच्छता सूचना: कचरा उघड्यावर टाकू नका, घंटागाडीतच ओला व सुका वेगळा द्या.',
        hi: 'स्वच्छता निर्देश: कचरा खुले में न फेंकें, कचरा गाड़ी में ही डालें।',
        en: 'Civic Guideline: Do not dump waste openly; hand over segregated garbage to collection vans.'
      },
      diag: {
        mr: `कचरा साठा तपासणी: ${loc} येथे कॉम्पॅक्टर वाहन व ब्लिचिंग पावडर फवारणी पथक.`,
        hi: `कचरा डंप: ${loc} पर कॉम्पैक्टर वाहन व कीटाणुनाशक छिड़काव।`,
        en: `Garbage accumulation diagnosed at ${loc}. Compactor truck and spot disinfection queued.`
      },
      reply: {
        mr: `आपल्या ${loc} येथील अस्वच्छतेची त्वरित दखल घेतली आहे. स्वच्छता वाहनाला तात्काळ कचरा उचलण्यासाठी व पावडर फवारणीसाठी पाठवले आहे.`,
        hi: `आपके ${loc} में कचरे की समस्या पर तुरंत कार्रवाई करते हुए सफाई वाहन व दस्ता भेज दिया गया है।`,
        en: `Report confirmed for ${loc}. Compactor truck and sanitation squad dispatched for full clearance.`
      },
      steps: {
        mr: ['हायड्रॉलिक कॉम्पॅक्टर वाहनाद्वारे कचरा उचलणे', 'जागेवर जंतुनाशक चुन्याची पावडर फवारणी', 'परिसराची पाहणी व छायाचित्र नोंद'],
        hi: ['कॉम्पैक्टर द्वारा कचरे का पूर्ण उठाव', 'कीटाणुनाशक पाउडर का छिड़काव', 'सफाई का सत्यापन एवं फोटो रिकॉर्ड'],
        en: ['Compactor mechanical waste clearance', 'Bleaching disinfectant powder spray', 'Ground verification and photo log']
      },
      actions: {
        mr: ['सफाई पथक पाठवा', 'मॅपवर पहा', 'लाइव्ह ट्रॅक करा'],
        hi: ['सफाई दस्ता भेजें', 'मैप पर देखें', 'ट्रैक करें'],
        en: ['Dispatch Sanitation Squad', 'View Map', 'Track Live']
      }
    },
    water_supply: {
      dept: 'NMC & Orange City Water (OCW)',
      unit: 'OCW Rapid Leakage & Tanker Squad #06',
      sla: 12,
      priority: 'High',
      engineer: 'Er. S. B. Joshi (OCW Executive Engineer)',
      helpline: '0712-2567035 / 1800-233-3764',
      safety: {
        mr: 'पाणी सूचना: पाइपलाइन दुरुस्तीदरम्यान पाणी उकळून प्यावे.',
        hi: 'जल निर्देश: पाइपलाइन सुधार कार्य के दौरान पानी उबालकर पिएं।',
        en: 'Water Advisory: Boil drinking water during active pipeline repairs.'
      },
      diag: {
        mr: `पाणीपुरवठा पाहणी: ${loc} येथे जलगळती शोध व टँकर व्यवस्था.`,
        hi: `जल आपूर्ति जांच: ${loc} पर लीकेज सुधार व टैंकर आपूर्ति।`,
        en: `Water pressure/leakage diagnosed at ${loc}. Isolation valve crew and relief tanker active.`
      },
      reply: {
        mr: `नमस्कार! ${loc} मधील पाणीपुरवठा समस्येची दखल घेण्यात आली आहे. OCW तांत्रिक पथकाला व्हॉल्व्ह व पाइपलाइन तपासणीसाठी निर्देशित केले आहे.`,
        hi: `नमस्ते! ${loc} में पानी की समस्या की जांच के लिए OCW तकनीकी टीम को रवाना किया गया है।`,
        en: `We have logged the water supply issue at ${loc}. OCW maintenance crew has been dispatched.`
      },
      steps: {
        mr: ['पाइपलाइन गळती व व्हॉल्व्ह दाब तपासणी', 'तात्पुरत्या पिण्याच्या पाण्याचा मोफत टँकर बुक', 'दुरुस्तीनंतर जलशुद्धीकरण नमुना चाचणी'],
        hi: ['पाइपलाइन लीकेज व प्रेशर की जांच', 'मुफ्त पानी का राहत टैंकर रवाना', 'पानी की गुणवत्ता की लैब जांच'],
        en: ['Pipeline pressure and valve audit', 'Free relief emergency tanker queued', 'Water purity laboratory test']
      },
      actions: {
        mr: ['टँकर पाठवा', 'मॅपवर पहा', 'तक्रार ट्रॅक करा'],
        hi: ['टैंकर भेजें', 'मैप पर देखें', 'ट्रैक करें'],
        en: ['Dispatch Tanker', 'View Map', 'Track Status']
      }
    },
    certificates: {
      dept: 'Nagpur District Collectorate & Revenue Dept',
      unit: 'Aaple Sarkar / Setu Suvidha Kendra',
      sla: 120,
      priority: 'Normal',
      engineer: 'Tahsildar / Sub-Divisional Officer (Nagpur)',
      helpline: '1800-120-8040 (Aaple Sarkar)',
      safety: {
        mr: 'माहिती: शासकीय सेवांसाठी केवळ अधिकृत ‘आपले सरकार’ पोर्टल किंवा सेतू केंद्राचाच वापर करा.',
        hi: 'सलाह: केवल आधिकारिक ‘आपले सरकार’ पोर्टल या सेतु केंद्र का उपयोग करें।',
        en: 'Notice: Use only official Aaple Sarkar portal or approved Setu Kendras.'
      },
      diag: {
        mr: `दाखले व प्रमाणपत्र मार्गदर्शन: ${loc} सेतू केंद्राशी जोडणी.`,
        hi: `प्रमाणपत्र मार्गदर्शन: ${loc} सेतु केंद्र से संबंधित प्रक्रिया।`,
        en: `Citizen certificate checklist and statutory timeline verified for ${loc}.`
      },
      reply: {
        mr: `नमस्कार! प्रमाणपत्रासाठी आवश्यक कागदपत्रांची यादी तयार आहे. आपण जवळच्या सेतू केंद्रात किंवा ‘आपले सरकार’ पोर्टलवर थेट अर्ज करू शकता.`,
        hi: `नमस्ते! आपके प्रमाणपत्र के लिए आवश्यक दस्तावेजों की सूची तैयार है। आप ऑनलाइन या नजदीकी सेतु केंद्र से आवेदन कर सकते हैं।`,
        en: `Hello! We have prepared the verified document checklist for your certificate under RTS Maharashtra.`
      },
      steps: {
        mr: ['कागदपत्रे पडताळणी (रेशन कार्ड, आधार, उत्पन्न पुरावा)', 'आपले सरकार पोर्टलवर ऑनलाइन अर्ज सादर करणे', '७ ते १५ दिवसांत डिजिटल स्वाक्षरी असलेला दाखला प्राप्त करणे'],
        hi: ['दस्तावेज सत्यापन (आधार, राशन कार्ड, आय प्रमाण)', 'आपले सरकार पोर्टल पर ऑनलाइन आवेदन', '7 से 15 दिनों में डिजिटल प्रमाणपत्र प्राप्ति'],
        en: ['Verify ID & address documents', 'Submit via Aaple Sarkar portal', 'Receive digitally signed certificate within RTS SLA']
      },
      actions: {
        mr: ['कागदपत्रे तपासा', 'सेतू केंद्र शोधा', 'अर्ज ट्रॅक करा'],
        hi: ['दस्तावेज देखें', 'सेतु केंद्र खोजें', 'ट्रैक करें'],
        en: ['View Checklist', 'Find Setu Kendra', 'Track Status']
      }
    },
    schemes: {
      dept: 'Maharashtra Social Welfare & Urban Development',
      unit: 'NagpurSetu Direct Scheme Navigator',
      sla: 72,
      priority: 'Normal',
      engineer: 'Nodal Scheme Officer (Nagpur Zone)',
      helpline: '1800-233-3764',
      safety: {
        mr: 'माहिती: कोणत्याही दलालांना पैसे देऊ नका. सर्व शासकीय योजनांचे अर्ज मोफत आहेत.',
        hi: 'सलाह: किसी बिचौलिए को पैसे न दें, सभी सरकारी योजनाओं के आवेदन पूर्णतः निशुल्क हैं।',
        en: 'Public Notice: All government scheme applications are free. Do not pay intermediaries.'
      },
      diag: {
        mr: `शासकीय योजना पात्रता व अनुदान गणना: ${loc} साठी पडताळणी पूर्ण.`,
        hi: `सरकारी योजना पात्रता व सब्सिडी गणना: ${loc} के लिए सत्यापन।`,
        en: `Subsidy calculations and eligibility requirements evaluated for ${loc}.`
      },
      reply: {
        mr: `नमस्कार! पीएम सूर्य घर, पीएम आवास किंवा लाडकी बहीण योजनेची संपूर्ण माहिती व थेट अर्जाची लिंक खालीलप्रमाणे आहे.`,
        hi: `नमस्ते! पीएम सूर्य घर, पीएम आवास योजना की पात्रता एवं सब्सिडी का विवरण नीचे दिया गया है।`,
        en: `Hello! We have analyzed the scheme criteria and maximum subsidy benefits for your household.`
      },
      steps: {
        mr: ['उत्पन्न व आधार संलग्न बँक खात्याची पडताळणी', 'योजनेच्या अधिकृत पोर्टलवर थेट नोंदणी', 'थेट बँक खात्यात अनुदान (DBT) जमा'],
        hi: ['आधार लिंक बैंक खाते का सत्यापन', 'आधिकारिक पोर्टल पर सीधा पंजीकरण', 'डीबीटी द्वारा सीधे बैंक में सब्सिडी'],
        en: ['Aadhaar linked bank account check', 'Online direct portal registration', 'Direct Benefit Transfer (DBT) credit']
      },
      actions: {
        mr: ['अनुदान तपासा', 'पात्रता पाहा', 'थेट अर्ज करा'],
        hi: ['सब्सिडी देखें', 'पात्रता जांचें', 'आवेदन करें'],
        en: ['Check Subsidy', 'View Eligibility', 'Apply Directly']
      }
    },
    encroachment_trees: {
      dept: 'NMC Garden & Tree Authority Department',
      unit: 'Emergency Hydraulic Tree Chainsaw Squad #03',
      sla: 6,
      priority: 'Critical',
      engineer: 'Er. A. K. Bhole (Garden Superintendent)',
      helpline: '0712-2567035 / 101 (Fire & Emergency)',
      safety: {
        mr: 'धोका: विजेच्या तारांवर झुकलेल्या फांद्यांच्या खाली वाहने उभी करू नका किंवा थांबू नका.',
        hi: 'खतरा: बिजली के तारों पर झुकी शाखाओं के नीचे वाहन न खड़े करें।',
        en: 'Hazard Notice: Keep clear of fallen branches entangled with power lines.'
      },
      diag: {
        mr: `वृक्ष धोका व आपत्कालीन पाहणी: ${loc} येथे हायड्रॉलिक कटर पथक पाठवले आहे.`,
        hi: `पेड़ गिरने की आपातकालीन जांच: ${loc} में हाइड्रोलिक कटर दस्ता तैनात।`,
        en: `Hazardous tree branch / fall diagnosed at ${loc}. Chainsaw squad dispatched.`
      },
      reply: {
        mr: `आपत्कालीन दखल! ${loc} येथील धोकादायक फांद्या/पडलेले झाड कापून रस्ता मोकळा करण्यासाठी हायड्रॉलिक कटर पथक रवाना करण्यात आले आहे.`,
        hi: `आपातकालीन सूचना! ${loc} में गिरे पेड़ को हटाकर रास्ता साफ करने के लिए कटर दस्ता रवाना कर दिया गया है।`,
        en: `Emergency squad active! Hydraulic Tree Chainsaw Squad #03 is en route to clear road blockage at ${loc}.`
      },
      steps: {
        mr: ['हायड्रॉलिक कटरने धोकादायक फांद्या छाटणे', 'रस्त्यावरील लाकडे उचलून वाहतूक सुरळीत करणे', 'महावितरण वायर तपासणी'],
        hi: ['कटर द्वारा खतरनाक शाखाओं की कटाई', 'सड़क से लकड़ियों को हटाकर मार्ग साफ करना', 'बिजली विभाग द्वारा सुरक्षा जांच'],
        en: ['Hydraulic trimming of hanging boughs', 'Rapid timber clearance for traffic flow', 'MSEDCL power line clearance inspection']
      },
      actions: {
        mr: ['कटर पथक पाठवा', 'मॅपवर पहा', 'लाइव्ह ट्रॅक करा'],
        hi: ['दस्ता भेजें', 'मैप पर देखें', 'ट्रैक करें'],
        en: ['Dispatch Squad', 'View Map', 'Track Case']
      }
    }
  };

  const domain = domainDefaults[domainKey] || domainDefaults.street_lights;
  const langKey = prefLang === 'hi' ? 'hi' : prefLang === 'en' ? 'en' : 'mr';

  return {
    domainId: domainKey,
    diagnosis: domain.diag[langKey],
    reply: domain.reply[langKey],
    immediateActionSteps: domain.steps[langKey],
    workOrder: {
      ticketTitle: `${domain.dept} - ${loc}`,
      department: domain.dept,
      assignedUnit: domain.unit,
      slaHours: domain.sla,
      priority: domain.priority,
      wardEngineer: domain.engineer,
      helpline: domain.helpline
    },
    quickActions: domain.actions[langKey].map((label, idx) => ({
      id: `action_${idx + 1}`,
      label,
      type: idx === 0 ? 'dispatch' : idx === 1 ? 'locate' : 'track'
    })),
    safetyAdvisory: domain.safety[langKey],
    suggestedLocation: loc,
    suggestedWard: wrd
  };
}

// Server-side Domain-Specific Problem Solving AI API
app.post("/api/ai/solve-problem", async (req, res) => {
  try {
    const { domainId, userMessage, location, ward, history, language } = req.body;
    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: "User message is required" });
    }

    const ai = getGeminiClient();
    const prefLang = language || 'mr';
    const domainKey = domainId || 'street_lights';

    if (!ai) {
      const fallbackData = generateLocalDomainDiagnostic(domainKey, userMessage, location, ward, prefLang);
      return res.json(fallbackData);
    }

    // Domain Prompts
    const domainPrompts: Record<string, string> = {
      street_lights: `You are the NMC Chief Electrical & Streetlight Automation AI (विद्युत व पथदिवे निवारण कक्ष, नागपूर महानगरपालिका).
Your sole mandate is solving Nagpur streetlight, pole, cable, dark spot, and feeder issues.
Domain Expertise:
- Pole ID naming conventions in NMC (e.g., DP-402, STB-108, HB-204).
- MSEDCL 11kV/415V distribution transformer tripping, MCB breaker faults, photocell sensor failures.
- Rapid dispatch of Sky-Lift Hydraulic Boom vehicles.
- Dark corridor women safety priority protocols.
- Safety Caution: Warn citizens against touching wet electric poles or exposed underground cables.`,

      flood_drainage: `You are the NMC Monsoon Flood, Nullah & Drainage Rapid Response AI (पूर, जलभराव व सांडपाणी आपत्कालीन निवारण कक्ष, नागपूर महानगरपालिका).
Your sole mandate is solving waterlogging, flooded roads, blocked storm water drains, sewage overflow, and nullah choking (Nag River, Pili River, Pora Nullah).
Domain Expertise:
- Water depth assessment (inches/feet) & traffic passability advisories.
- Immediate dispatch of 6-inch high-power Dewatering Suction Pumps & Super Sucker jetting machines.
- Manhole safety (warning citizens about missing lids / open chambers during rain).
- Critical low-lying flooding hotspots: Sitabuldi Interchange underpass, Narendra Nagar bridge, Sakkardara lake overflow, Ganeshpeth bus stand, Manish Nagar railway underbridge.
- Emergency Sandbag deployment squad routing.`,

      potholes_roads: `You are the NMC Road Maintenance, Potholes & Infrastructure AI (रस्ते, खड्डे व वाहतूक सुरक्षा निवारण कक्ष, नागपूर महानगरपालिका).
Your sole mandate is solving pothole craters, broken road dividers, asphalt cave-ins, and road resurfacing in Nagpur.
Domain Expertise:
- Cold-mix instant asphalt patch squad dispatch (Jetpatcher machines).
- Distinction between NMC city roads, PWD state highways, and NHAI ring roads.
- Road safety barricading & reflective hazard cone installation.
- 48-hour municipal SLA tracking for high-traffic corridors like Wardha Road, Central Avenue, Amravati Road, and Koradi Road.`,

      garbage_waste: `You are the NMC Solid Waste & Public Sanitation AI (घनकचरा व स्वच्छता व्यवस्थापन कक्ष, नागपूर महानगरपालिका).
Your sole mandate is solving overflowing garbage vats, missed door-to-door ghantagadi collection, open dumping, and dead animal removal.
Domain Expertise:
- AG Enviro & BVG compactor vehicle GPS tracking in 10 NMC zones.
- Spot sanitation squad dispatch with lime/bleaching powder disinfections.
- Wet vs Dry waste segregation enforcement & anti-littering challan rules.
- 24-hour SLA for garbage dump clearance.`,

      water_supply: `You are the NMC & Orange City Water (OCW) 24x7 Water Supply AI (पाणीपुरवठा व जलगळती निवारण कक्ष, नागपूर महानगरपालिका).
Your sole mandate is solving pipe bursts, low water pressure, contaminated tap water, and tanker booking in Nagpur.
Domain Expertise:
- 24x7 Water supply network fed from Gorewada, Kanhan, Pench, and Navegaon Khairi reservoirs.
- Immediate emergency water tanker booking (NMC free helpline).
- Direct pipeline repair crew dispatch with isolation valve control.
- Water testing sample collection by municipal laboratory.`,

      certificates: `You are the NagpurSetu Citizen Certificates & Revenue AI (दाखले, प्रमाणपत्र व महसूल सेवा कक्ष, नागपूर).
Your sole mandate is helping citizens obtain Income, Domicile, Caste, Non-Creamy Layer, Birth & Death certificates, and Property Tax mutation.
Domain Expertise:
- Step-by-step document checklist for Aaple Sarkar (MahaOnline) portal.
- Nearest Setu Seva Kendra / Collectorate facilitation center.
- Official statutory timeline (Right to Public Service Act - RTS Maharashtra).
- Zero-rejection document validation tips.`,

      schemes: `You are the Maharashtra & Central Government Schemes Navigator AI (शासकीय योजना व अनुदान कक्ष).
Your sole mandate is guiding citizens on PMAY Urban, PM Surya Ghar Muft Bijli, PM SVANidhi, MJPJAY, Ladki Bahin, and Ramai Awas Yojana.
Domain Expertise:
- Accurate subsidy calculations (e.g. ₹78,000 for Solar Rooftop, ₹2.5 Lakhs for PMAY).
- Clear income & caste eligibility verification.
- Required certificates linking & direct application links.`,

      encroachment_trees: `You are the NMC Garden, Trees & Anti-Encroachment Emergency AI (वृक्ष प्राधिकरण व अतिक्रमण निवारण कक्ष).
Your sole mandate is handling fallen trees blocking roads, hazardous tree branches near electric wires, and footpath encroachments.
Domain Expertise:
- Hydraulic tree pruner & chainsaw squad dispatch.
- Fire & Emergency Services coordination for stormy weather tree falls.
- NMC Anti-encroachment flying squad notices.`
    };

    const chosenPrompt = domainPrompts[domainKey] || domainPrompts.street_lights;

    const systemInstruction = `${chosenPrompt}

LANGUAGE REQUIREMENT:
- You must converse naturally in ${prefLang === 'mr' ? 'MARATHI (मराठी in Devanagari script)' : prefLang === 'hi' ? 'HINDI (हिंदी in Devanagari script)' : 'ENGLISH'}.
- Tone: Highly authoritative, reassuring, professional, and action-oriented. Provide immediate real-time solution steps.

Return a STRICT JSON response with this format:
{
  "domainId": "${domainKey}",
  "diagnosis": "Short 1-2 sentence real-time engineering assessment",
  "reply": "Empathetic, clear, solution-driven message to citizen in ${prefLang === 'mr' ? 'Marathi' : prefLang === 'hi' ? 'Hindi' : 'English'}",
  "immediateActionSteps": [
    "Step 1 with specific action",
    "Step 2 with specific action",
    "Step 3 with specific action"
  ],
  "workOrder": {
    "ticketTitle": "Clear concise work order title",
    "department": "Name of municipal department",
    "assignedUnit": "Specific vehicle or squad name (e.g. Sky-Lift Unit #04)",
    "slaHours": 24,
    "priority": "Critical" | "High" | "Normal",
    "wardEngineer": "Name & designation of ward officer",
    "helpline": "Emergency toll-free phone number"
  },
  "quickActions": [
    { "id": "action_1", "label": "Action label", "type": "dispatch" | "locate" | "photo" | "track" },
    { "id": "action_2", "label": "Action label", "type": "dispatch" | "locate" | "photo" | "track" },
    { "id": "action_3", "label": "Action label", "type": "dispatch" | "locate" | "photo" | "track" }
  ],
  "safetyAdvisory": "Critical 1-sentence safety caution for citizens near this hazard",
  "suggestedLocation": "${location || 'Nagpur'}",
  "suggestedWard": "${ward || 'Dharampeth (Ward 2)'}"
}
Return ONLY valid JSON.`;

    const contextMsg = history && Array.isArray(history) && history.length > 0
      ? `Location: ${location || 'Nagpur'}, Ward: ${ward || 'Nagpur Ward'}\nHistory:\n${history.map((h: any) => `${h.sender}: ${h.text}`).join('\n')}\nCitizen Query: "${userMessage}"`
      : `Location: ${location || 'Nagpur'}, Ward: ${ward || 'Nagpur Ward'}\nCitizen Query: "${userMessage}"`;

    const parsed = await generateWithModelFallback(ai, contextMsg, systemInstruction);
    if (parsed) {
      return res.json(parsed);
    }

    // Fallback gracefully to domain expert rules
    const fallbackData = generateLocalDomainDiagnostic(domainKey, userMessage, location, ward, prefLang);
    return res.json(fallbackData);
  } catch (error: any) {
    console.error("Specialized AI solve problem caught error:", error);
    const prefLang = req.body?.language || 'mr';
    const fallbackData = generateLocalDomainDiagnostic(req.body?.domainId || 'street_lights', req.body?.userMessage || '', req.body?.location, req.body?.ward, prefLang);
    return res.json(fallbackData);
  }
});

// Server-side AI Civic Classifier & Conversational Agent API
app.post("/api/ai/classify", async (req, res) => {
  try {
    const { text, history, language } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return structured fallback if API key is not yet configured
      return res.json({
        source: 'local_fallback',
        intent: 'complaint',
        category: 'Solid Waste Management',
        department: 'Solid Waste Management',
        title: text.length > 50 ? text.substring(0, 50) + '...' : text,
        locationHint: '',
        wardHint: 'Dharampeth (Ward 4)',
        priority: 'Normal',
        slaDays: 2,
        detectedLanguage: language || 'en',
        conversationalReply: 'I have noted down your concern. Please confirm the exact street location or landmark in Nagpur so we can route this to the zonal ward team.',
        needsLocation: true,
        needsPhoto: true,
        suggestedAction: 'location_picker'
      });
    }

    const systemPrompt = `You are "NagpurSetu AI Assistant" (नागपूरसेतू नागरिक सहाय्यक), the voice and conversational civic intelligence agent for Nagpur Municipal Corporation (NMC - नागपूर महानगरपालिका).
Your primary mandate is to converse naturally with citizens in MARATHI (मराठी) and HINDI (हिंदी) as the priority local languages of Nagpur, while also supporting English when requested.

CORE LANGUAGE MANDATE:
1. MARATHI (मराठी) - TOP PRIORITY:
   - When the user selects Marathi or writes/speaks in Marathi (e.g., 'कचरा उचलला नाही', 'रस्त्यावर मोठा खड्डा आहे', 'पाणी येत नाही', 'पथदिवे बंद आहेत', 'नाली तुंबली आहे', 'दाखला कसा काढायचा', 'माझ्या प्रभागात समस्या आहे', 'मदत हवी आहे'):
   - Set "detectedLanguage": "mr".
   - Your "conversationalReply" MUST be 100% in pure, polite, authentic Marathi in Devanagari script.
   - Example tone: "नमस्कार! नागपूरसेतू मध्ये आपले स्वागत आहे. मी आपल्या समस्येची नोंद घेत आहे. कृपया रस्त्याचे नाव किंवा जवळचा परिसर मॅपवर निश्चित करा जेणेकरून संबंधित विभागीय कार्यालयाला माहिती पाठवता येईल."

2. HINDI (हिंदी) - TOP PRIORITY:
   - When the user selects Hindi or writes/speaks in Hindi or Hinglish (e.g., 'कचरा नहीं उठाया गया', 'सड़क पर बड़ा गड्ढा है', 'पानी का प्रेशर कम है', 'स्ट्रीट लाइट खराब है', 'नाली जाम हो गई है', 'complaint darj karni hai', 'pani nahi aa raha'):
   - Set "detectedLanguage": "hi".
   - Your "conversationalReply" MUST be in clear, warm, fluent Hindi in Devanagari script.
   - Example tone: "नमस्ते! नागपुरसेतु में आपका स्वागत है। आपकी शिकायत दर्ज की जा रही है। कृपया मैप पर सटीक स्थान या लैंडमार्क चुनें ताकि संबंधित जोन के अधिकारियों को तुरंत सूचित किया जा सके।"

3. ENGLISH:
   - If user explicitly queries in English, set "detectedLanguage": "en" and provide a helpful, concise English reply.

4. If user preferred language is provided as '${language || 'mr'}', prioritize '${language || 'mr'}' unless user clearly typed in another language.

Analyze the user's latest message and return a STRICT valid JSON object with the following fields:
- intent: one of ["complaint", "service_request", "track_case", "inquiry", "general"]
- category: A clear civic category name (e.g., "Solid Waste - Collection", "Roads & Traffic - Potholes", "Drainage & Sewage Overflow", "Water Works - Low Pressure", "Electrical - Streetlights", "Health & Sanitation", "Birth/Death & Property Tax")
- department: one of ["Solid Waste Management", "Roads & Traffic", "Water Works", "Electrical & Streetlights", "Drainage & Sewage", "Town Planning & Birth/Death", "Health & Sanitation", "Garden & Trees", "Fire & Emergency"]
- title: A concise, professional 3-7 word summary of the issue in English for municipal dispatch records (e.g. "Overflowing Waste Bin Near Variety Square", "Streetlight Malfunction on Wardha Road", "Low Water Pressure in Dharampeth")
- locationHint: any Nagpur locality/landmark/street mentioned in text (e.g. "Dharampeth", "Variety Square", "Laxmi Nagar", "Sitabuldi", "Manish Nagar", "Sadar", "Mahal", "Itwari", "Civil Lines", "Nandanvan", "Khamla", "Trimurti Nagar", "Ramdaspeth"), or "" if none mentioned.
- wardHint: One of the 10 NMC Wards if identifiable ("Laxmi Nagar (Ward 1)", "Dharampeth (Ward 2)", "Hanuman Nagar (Ward 3)", "Dhantoli (Ward 4)", "Nehru Nagar (Ward 5)", "Gandhibagh (Ward 6)", "Sataranjipura (Ward 7)", "Lakadganj (Ward 8)", "Ashi Nagar (Ward 9)", "Mangalwari (Ward 10)"), or ""
- priority: "Emergency" | "High" | "Elevated" | "Normal" | "Low"
- slaDays: number of standard SLA days to fix (e.g. 1 for drainage/water emergency, 2 for garbage/pothole, 3 for streetlight, 5 for certificates)
- detectedLanguage: "mr" | "hi" | "en"
- conversationalReply: The empathetic, direct message to be spoken back to citizen in their language (predominantly Marathi or Hindi).
- needsLocation: boolean (true for physical civic issues like garbage, potholes, streetlights, drainage)
- needsPhoto: boolean (true if visual verification helps crews dispatch the right vehicle/equipment)
- suggestedAction: "location_picker" | "photo_upload" | "case_summary" | "duplicate_warning" | "categories"

Return ONLY the JSON object. Do not include markdown code block markers.`;

    const chatContext = history && Array.isArray(history) && history.length > 0
      ? `Recent Conversation Context:\n${history.map((h: any) => `${h.sender === 'user' ? 'Citizen' : 'NagpurSetu'}: ${h.text}`).join('\n')}\n\nLatest Citizen Message:\n"${text}"`
      : `Citizen Message:\n"${text}"`;

    const parsed = await generateWithModelFallback(ai, chatContext, systemPrompt);

    if (parsed) {
      return res.json({
        source: 'gemini',
        intent: parsed.intent || 'complaint',
        category: parsed.category || 'Solid Waste Management',
        department: parsed.department || 'Solid Waste Management',
        title: parsed.title || text.substring(0, 40),
        locationHint: parsed.locationHint || '',
        wardHint: parsed.wardHint || '',
        priority: parsed.priority || 'Normal',
        slaDays: typeof parsed.slaDays === 'number' ? parsed.slaDays : 2,
        detectedLanguage: parsed.detectedLanguage || (language || 'mr'),
        conversationalReply: parsed.conversationalReply || 'आपल्या समस्येची नोंद घेतली आहे. NagpurSetu द्वारे संबंधित विभागाला सूचना पाठवली आहे.',
        needsLocation: parsed.needsLocation ?? true,
        needsPhoto: parsed.needsPhoto ?? true,
        suggestedAction: parsed.suggestedAction || 'location_picker',
        duplicateRisk: false,
      });
    }

    // Graceful structured fallback
    const isMarathi = language === 'mr' || /[\u0900-\u097F]/.test(text);
    return res.json({
      source: 'local_fallback',
      intent: 'complaint',
      category: 'Solid Waste Management',
      department: 'Solid Waste Management',
      title: text.length > 50 ? text.substring(0, 50) + '...' : text,
      locationHint: '',
      wardHint: 'Dharampeth (Ward 2)',
      priority: 'Normal',
      slaDays: 2,
      detectedLanguage: language || (isMarathi ? 'mr' : 'en'),
      conversationalReply: language === 'mr' || isMarathi
        ? 'नमस्कार! मी आपल्या समस्येची नोंद घेतली आहे. कृपया रस्त्याचे अचूक नाव सांगा किंवा मॅपवर ठिकाण निश्चित करा.'
        : language === 'hi'
        ? 'नमस्ते! मैंने आपकी समस्या नोट कर ली है। कृपया सटीक सड़क या लैंडमार्क चुनें।'
        : 'I have noted your concern. Please confirm your exact location or landmark in Nagpur so we can dispatch the rapid team.',
      needsLocation: true,
      needsPhoto: true,
      suggestedAction: 'location_picker'
    });
  } catch (error: any) {
    console.error("AI classification caught error:", error);
    const prefLang = req.body?.language || 'mr';
    return res.json({
      source: 'local_fallback',
      intent: 'complaint',
      category: 'General Civic',
      department: 'Solid Waste Management',
      title: 'Civic Report',
      locationHint: '',
      wardHint: 'Dharampeth (Ward 2)',
      priority: 'Normal',
      slaDays: 2,
      detectedLanguage: prefLang,
      conversationalReply: prefLang === 'mr'
        ? 'आपल्या समस्येची नोंद घेतली आहे. कृपया परिसराचे नाव निश्चित करा.'
        : 'Your civic concern has been recorded. Please confirm your locality.',
      needsLocation: true,
      needsPhoto: true,
      suggestedAction: 'location_picker'
    });
  }
});

// Start server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NagpurSetu server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
