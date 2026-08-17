import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Camera, 
  Clock, 
  FileCheck2, 
  CheckSquare, 
  Square,
  Sparkles,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { CitizenVerificationChecklist as ChecklistType } from '../types';

interface CitizenVerificationChecklistProps {
  checklist: ChecklistType;
  onChange: (updated: ChecklistType) => void;
  category?: string;
  language?: 'en' | 'hi' | 'mr';
  className?: string;
}

export const CitizenVerificationChecklistComponent: React.FC<CitizenVerificationChecklistProps> = ({
  checklist,
  onChange,
  category = 'General',
  language = 'en',
  className = ''
}) => {
  // Category-specific dynamic rule
  const getCategoryRule = () => {
    const cat = category.toLowerCase();
    if (cat.includes('road') || cat.includes('pothole')) {
      return {
        key: 'pothole',
        textEn: 'Hazard Check: Pothole / road defect is causing direct risk to motorists, two-wheelers, or pedestrians.',
        textHi: 'जोखिम जांच: गड्ढा या सड़क क्षति से दोपहिया चालकों या नागरिकों को प्रत्यक्ष खतरा है।',
        textMr: 'धोका तपासणी: खड्ड्यामुळे किंवा रस्त्यांच्या नुकसानीमुळे दुचाकीस्वार व नागरिकांना थेट धोका आहे।'
      };
    }
    if (cat.includes('garbage') || cat.includes('waste') || cat.includes('sanitation')) {
      return {
        key: 'waste',
        textEn: 'Waste Accumulation: Garbage has accumulated creating foul smell, hygiene risk, or drain clogging.',
        textHi: 'कचरा संचय: कचरा जमा होने से बदबू, अस्वच्छता या नाला जाम होने का खतरा उत्पन्न हो रहा है।',
        textMr: 'कचरा साठा: कचरा साचल्यामुळे दुर्गंधी, आरोग्यास धोका किंवा गटार तुंबण्याची शक्यता निर्माण झाली आहे।'
      };
    }
    if (cat.includes('light') || cat.includes('street')) {
      return {
        key: 'light',
        textEn: 'Night Safety: Street light is non-functional creating a dark stretch or safety hazard after sunset.',
        textHi: 'रात्रि सुरक्षा: स्ट्रीट लाइट बंद होने से शाम के बाद अंधेरा और असुरक्षा की स्थिति है।',
        textMr: 'रात्रीची सुरक्षा: स्ट्रीट लाईट बंद असल्याने अंधार पडून सुरक्षिततेचा प्रश्न निर्माण झाला आहे।'
      };
    }
    if (cat.includes('water') || cat.includes('drain') || cat.includes('sewage') || cat.includes('flood')) {
      return {
        key: 'water',
        textEn: 'Flow / Contamination: Active water leakage, dirty water supply, or sewage overflow currently happening.',
        textHi: 'प्रवाह / संदूषण: पानी का रिसाव, दूषित जलापूर्ति या सीवेज का पानी सड़कों पर बह रहा है।',
        textMr: 'गळती / दूषित पाणी: पाण्याची गळती, दूषित पाणीपुरवठा किंवा सांडपाणी रस्त्यावर वाहत आहे।'
      };
    }
    return {
      key: 'general',
      textEn: 'Civic Priority: The issue requires immediate Municipal (NMC) attention to prevent public inconvenience.',
      textHi: 'नागरिक प्राथमिकता: सार्वजनिक असुविधा रोकने के लिए मनपा (NMC) द्वारा त्वरित कार्रवाई आवश्यक है।',
      textMr: 'नागरी प्राधान्य: सार्वजनिक गैरसोय टाळण्यासाठी मनपाकडून (NMC) तात्काळ उपाययोजना आवश्यक आहे।'
    };
  };

  const categoryRule = getCategoryRule();

  const handleToggle = (key: keyof ChecklistType) => {
    const updated = {
      ...checklist,
      [key]: !checklist[key]
    };

    // Calculate score
    let checkedCount = 0;
    if (updated.witnessedInPerson) checkedCount++;
    if (updated.photoIsAuthentic) checkedCount++;
    if (updated.issueCurrentlyActive) checkedCount++;
    if (updated.locationIsAccurate) checkedCount++;
    if (updated.agreedCivicTerms) checkedCount++;
    if (updated.categorySpecificCheck) checkedCount++;

    const total = 6;
    updated.authenticityScore = Math.round((checkedCount / total) * 100);
    updated.categoryCheckDescription = categoryRule.textEn;

    onChange(updated);
  };

  const handleCheckAll = () => {
    const allTrue: ChecklistType = {
      witnessedInPerson: true,
      photoIsAuthentic: true,
      issueCurrentlyActive: true,
      locationIsAccurate: true,
      agreedCivicTerms: true,
      categorySpecificCheck: true,
      categoryCheckDescription: categoryRule.textEn,
      authenticityScore: 100,
      verifiedAt: new Date().toISOString()
    };
    onChange(allTrue);
  };

  // Checked count
  const checkedItems = [
    checklist.witnessedInPerson,
    checklist.photoIsAuthentic,
    checklist.issueCurrentlyActive,
    checklist.locationIsAccurate,
    checklist.agreedCivicTerms,
    checklist.categorySpecificCheck
  ].filter(Boolean).length;

  const isAllComplete = checkedItems === 6;

  return (
    <div 
      className={`rounded-2xl border transition-all ${
        isAllComplete 
          ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs' 
          : 'bg-amber-50/40 border-amber-200 shadow-2xs'
      } p-5 sm:p-6 space-y-5 ${className}`}
      id="citizen-verification-checklist-container"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isAllComplete 
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs' 
              : 'bg-amber-500 text-white border-amber-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0B1E38]">
                {language === 'mr' 
                  ? 'नागरिक सत्यता पडताळणी चेकलिस्ट' 
                  : language === 'hi' 
                  ? 'नागरिक सत्यता सत्यापन चेकलिस्ट' 
                  : 'Citizen Ground-Truth Verification Checklist'}
              </h3>
              {isAllComplete ? (
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% VERIFIED</span>
                </span>
              ) : (
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{checkedItems}/6 REQUIRED</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {language === 'mr'
                ? 'तक्रार खरी असल्याचे प्रमाणित करण्यासाठी खालील सर्व मुद्दे तपासा. यामुळे मनपा पथक जलद कारवाई करेल.'
                : language === 'hi'
                ? 'शिकायत सही होने की पुष्टि के लिए नीचे दिए गए सभी बिंदुओं की जांच करें। इससे मनपा टीम तुरंत कार्रवाई करेगी।'
                : 'Confirm these ground points to certify complaint authenticity and unlock priority municipal dispatch.'}
            </p>
          </div>
        </div>

        {/* Quick Check All Button */}
        <button
          type="button"
          onClick={handleCheckAll}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs ${
            isAllComplete
              ? 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
              : 'bg-[#0B1E38] hover:bg-[#152e52] text-white'
          }`}
          id="btn-verify-all-checklist"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isAllComplete ? 'All Verified ✓' : 'Verify All 6 Points'}</span>
        </button>
      </div>

      {/* Verification Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>Authenticity & Truthfulness Score</span>
          </span>
          <span className={isAllComplete ? 'text-emerald-700' : 'text-amber-700'}>
            {checklist.authenticityScore || Math.round((checkedItems / 6) * 100)}% ({checkedItems} of 6 Confirmed)
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${
              isAllComplete ? 'bg-emerald-600' : checkedItems >= 4 ? 'bg-blue-600' : 'bg-amber-500'
            }`}
            style={{ width: `${checklist.authenticityScore || Math.round((checkedItems / 6) * 100)}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Item 1: In-Person Witness */}
        <div 
          onClick={() => handleToggle('witnessedInPerson')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
            checklist.witnessedInPerson 
              ? 'bg-white border-emerald-300 shadow-2xs text-slate-900' 
              : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
          id="checklist-item-witness"
        >
          <div className="mt-0.5 shrink-0">
            {checklist.witnessedInPerson ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-700" />
              <span>1. Personally Witnessed on Ground</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {language === 'mr'
                ? 'मी प्रत्यक्ष घटनास्थळी उपस्थित आहे किंवा स्वतः ही समस्या पाहिली आहे.'
                : language === 'hi'
                ? 'मैंने व्यक्तिगत रूप से यह समस्या देखी है या मैं घटनास्थल पर मौजूद हूं।'
                : 'I have personally witnessed or am physically present at this spot in Nagpur.'}
            </p>
          </div>
        </div>

        {/* Item 2: Authentic Photo */}
        <div 
          onClick={() => handleToggle('photoIsAuthentic')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
            checklist.photoIsAuthentic 
              ? 'bg-white border-emerald-300 shadow-2xs text-slate-900' 
              : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
          id="checklist-item-photo"
        >
          <div className="mt-0.5 shrink-0">
            {checklist.photoIsAuthentic ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Authentic & Current Photo</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {language === 'mr'
                ? 'जोडलेला फोटो खरा, चालू स्थितीचा आणि मूळ ठिकाणचाच आहे (इंटरनेटवरील जुना नाही).'
                : language === 'hi'
                ? 'अपलोड किया गया फोटो वास्तविक और वर्तमान स्थिति का है (इंटरनेट से लिया हुआ नहीं)।'
                : 'The attached photo is a genuine, current image of this exact problem.'}
            </p>
          </div>
        </div>

        {/* Item 3: Active & Unresolved */}
        <div 
          onClick={() => handleToggle('issueCurrentlyActive')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
            checklist.issueCurrentlyActive 
              ? 'bg-white border-emerald-300 shadow-2xs text-slate-900' 
              : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
          id="checklist-item-active"
        >
          <div className="mt-0.5 shrink-0">
            {checklist.issueCurrentlyActive ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-700" />
              <span>3. Issue is Active & Ongoing</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {language === 'mr'
                ? 'समस्या अजूनही चालू आहे व महापालिकेकडून अद्याप दुरुस्त झालेली नाही.'
                : language === 'hi'
                ? 'यह समस्या वर्तमान में सक्रिय है और अभी तक ठीक नहीं हुई है।'
                : 'The issue is currently active on-site and has not already been resolved.'}
            </p>
          </div>
        </div>

        {/* Item 4: Correct Location & Ward */}
        <div 
          onClick={() => handleToggle('locationIsAccurate')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
            checklist.locationIsAccurate 
              ? 'bg-white border-emerald-300 shadow-2xs text-slate-900' 
              : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
          id="checklist-item-location"
        >
          <div className="mt-0.5 shrink-0">
            {checklist.locationIsAccurate ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              <span>4. Accurate Nagpur Location</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {language === 'mr'
                ? 'नकाशावरील जीपीएस लोकेशन, प्रभाग (वॉर्ड) व पत्ता अचूक आहे.'
                : language === 'hi'
                ? 'मानचित्र पर जीपीएस स्थान, वार्ड और पता पूरी तरह सटीक है।'
                : 'The GPS coordinates, ward, and address accurately identify the spot.'}
            </p>
          </div>
        </div>

        {/* Item 5: Category Specific Rule */}
        <div 
          onClick={() => handleToggle('categorySpecificCheck')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
            checklist.categorySpecificCheck 
              ? 'bg-white border-emerald-300 shadow-2xs text-slate-900' 
              : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
          id="checklist-item-category"
        >
          <div className="mt-0.5 shrink-0">
            {checklist.categorySpecificCheck ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-700" />
              <span>5. Specific Impact Confirmation</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {language === 'mr' 
                ? categoryRule.textMr 
                : language === 'hi' 
                ? categoryRule.textHi 
                : categoryRule.textEn}
            </p>
          </div>
        </div>

        {/* Item 6: Legal Good Faith Declaration */}
        <div 
          onClick={() => handleToggle('agreedCivicTerms')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
            checklist.agreedCivicTerms 
              ? 'bg-white border-emerald-300 shadow-2xs text-slate-900' 
              : 'bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
          id="checklist-item-declaration"
        >
          <div className="mt-0.5 shrink-0">
            {checklist.agreedCivicTerms ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>6. Good-Faith Civic Affirmation</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {language === 'mr'
                ? 'मी शपथपूर्वक घोषित करतो की ही माहिती सत्य असून खोटी किंवा दिशाभूल करणारी तक्रार नाही.'
                : language === 'hi'
                ? 'मैं प्रमाणित करता हूँ कि यह शिकायत सच्ची है और झूठी या शरारती नहीं है।'
                : 'I declare that this complaint is true and not a false or malicious submission.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Help Note */}
      <div className="text-[11px] text-slate-500 bg-white/80 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>
            {language === 'mr'
              ? 'नागपूर महानगरपालिका (NMC) सत्यता पडताळणी प्रणाली • खोटी तक्रार नोंदवणे नियमांनुसार दंडनीय आहे'
              : language === 'hi'
              ? 'नागपुर महानगर पालिका (NMC) सत्यता सत्यापन प्रणाली • झूठी शिकायत दंडनीय है'
              : 'NMC Smart Grievance Ground Verification • All 6 checks must be confirmed to proceed.'}
          </span>
        </span>
        {isAllComplete && (
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready to Dispatch</span>
          </span>
        )}
      </div>
    </div>
  );
};
