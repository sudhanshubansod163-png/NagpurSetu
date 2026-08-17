import { 
  CaseItem, 
  CitizenCertificate, 
  CommunityInsight, 
  GovernmentScheme, 
  HotspotCluster, 
  MunicipalService, 
  NotificationItem, 
  UserProfile,
  WardAreaStats
} from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'CIT-1001',
  name: '',
  phone: '',
  email: '',
  role: 'citizen',
  preferredLanguage: 'en',
  homeAddress: '',
  officeAddress: '',
  ward: 'Dharampeth (Ward 4)',
  accessibility: {
    highContrast: false,
    largeText: false,
    voiceAssistance: true,
    screenReaderOptimized: false,
  },
  notificationsEnabled: true,
};

export const MUNICIPAL_SERVICES: MunicipalService[] = [
  {
    id: 'srv-pothole',
    name: 'Road & Pothole Repair',
    department: 'Roads & Traffic',
    description: 'Report road craters, uneven asphalt, missing pavers, or broken footpaths across Nagpur.',
    fee: 0,
    slaDays: 2,
    requiredDocuments: ['Live problem photo with location landmark'],
    icon: 'Construction',
    category: 'roads',
    onlinePortalUrl: 'https://nmcnagpur.gov.in',
    authorityName: 'NMC Public Works Department (PWD)'
  },
  {
    id: 'srv-streetlight',
    name: 'Streetlight Maintenance & Replacement',
    department: 'Electrical & Streetlights',
    description: 'Report non-functioning LED streetlights, flickering poles, exposed wiring, or dark stretches.',
    fee: 0,
    slaDays: 2,
    requiredDocuments: ['Pole number / Street landmark'],
    icon: 'Lightbulb',
    category: 'general',
    onlinePortalUrl: 'https://nmcnagpur.gov.in',
    authorityName: 'NMC Electrical Department'
  },
  {
    id: 'srv-waste',
    name: 'Solid Waste & Garbage Clearance',
    department: 'Solid Waste Management',
    description: 'Request clearance of uncollected garbage, overflowing community bins, or open dumping spots.',
    fee: 0,
    slaDays: 1,
    requiredDocuments: ['Location landmark / Bin photo'],
    icon: 'Trash2',
    category: 'waste',
    onlinePortalUrl: 'https://nmcnagpur.gov.in',
    authorityName: 'NMC Solid Waste Management Dept'
  },
  {
    id: 'srv-drainage',
    name: 'Drainage & Sewage Desilting',
    department: 'Drainage & Sewage',
    description: 'Report clogged storm-water drains, overflowing sewer chambers, or missing manhole covers.',
    fee: 0,
    slaDays: 2,
    requiredDocuments: ['Exact chamber location / Street name'],
    icon: 'Droplets',
    category: 'waste',
    onlinePortalUrl: 'https://nmcnagpur.gov.in',
    authorityName: 'NMC Drainage & Sewage Dept'
  },
  {
    id: 'srv-tax',
    name: 'Property Tax Assessment & Payment',
    department: 'Enforcement & Hoardings',
    description: 'Pay annual municipal property tax online, view assessment index, and download official receipt.',
    fee: 0,
    slaDays: 1,
    requiredDocuments: ['Property Index (UPIN) Number', 'Previous Tax Receipt'],
    icon: 'Receipt',
    category: 'tax',
    onlinePortalUrl: 'https://nmcnagpur.gov.in/property-tax',
    authorityName: 'NMC Property Tax Department'
  },
  {
    id: 'srv-water',
    name: 'New Water Pipeline Connection',
    department: 'Water Works',
    description: 'Apply for 15mm/20mm domestic or commercial metered water supply line with NMC/OCW.',
    fee: 1500,
    slaDays: 14,
    requiredDocuments: ['Property Tax Receipt / NOC', 'Sanctioned Building Plan', 'Applicant Aadhaar Card', 'Ownership Proof (7/12 or Index II)'],
    icon: 'Droplets',
    category: 'water',
    onlinePortalUrl: 'https://ocwnagpur.com',
    authorityName: 'Orange City Water (OCW) / NMC Water Works'
  },
  {
    id: 'srv-birth',
    name: 'Birth Certificate Issuance',
    department: 'Town Planning & Birth/Death',
    description: 'Apply for official digital birth certificate, name inclusion, or verified duplicate copy.',
    fee: 50,
    slaDays: 7,
    requiredDocuments: ['Hospital Discharge / Birth Report', 'Parent Aadhaar Cards', 'Marriage Certificate / Address Proof'],
    icon: 'FileText',
    category: 'certificate',
    onlinePortalUrl: 'https://crsorgi.gov.in',
    authorityName: 'NMC Health & Registrar Office'
  },
  {
    id: 'srv-death',
    name: 'Death Certificate Application',
    department: 'Town Planning & Birth/Death',
    description: 'Official issuance of registered death certificate for Nagpur municipal jurisdiction.',
    fee: 50,
    slaDays: 5,
    requiredDocuments: ['Crematorium/Burial Pass', 'Hospital Medical Cause Certificate', 'Applicant ID & Relationship Proof'],
    icon: 'FileCheck',
    category: 'certificate',
    onlinePortalUrl: 'https://crsorgi.gov.in',
    authorityName: 'NMC Health & Registrar Office'
  },
  {
    id: 'srv-trade',
    name: 'Shop & Trade License (Gumasta)',
    department: 'Enforcement & Hoardings',
    description: 'Apply for new municipal trade license or annual renewal for commercial shops in Nagpur.',
    fee: 750,
    slaDays: 3,
    requiredDocuments: ['Shop Act Registration (Intimation)', 'NMC Property Tax Receipt', 'Fire Safety NOC (if applicable)', 'Applicant ID'],
    icon: 'Store',
    category: 'license',
    onlinePortalUrl: 'https://aaplesarkar.mahaonline.gov.in',
    authorityName: 'NMC Market & Licensing Dept'
  },
  {
    id: 'srv-building',
    name: 'Building Permission & Sanction Plan',
    department: 'Town Planning & Birth/Death',
    description: 'Online submission of building layout plans, commencement certificates, and occupancy certificates.',
    fee: 2500,
    slaDays: 30,
    requiredDocuments: ['Architectural Drawing Plan (AutoDCR)', 'Property Title Deeds (7/12 Extract, PR Card)', 'NMC Tax Clearance Certificate', 'Structural Engineer Stability Certificate'],
    icon: 'FileCheck',
    category: 'planning',
    onlinePortalUrl: 'https://bpms.maharashtra.gov.in',
    authorityName: 'NMC Town Planning Department'
  },
  {
    id: 'srv-tree',
    name: 'Tree Trimming & Hazard Pruning',
    department: 'Roads & Traffic',
    description: 'Request garden department pruning for overgrown branches interfering with powerlines or traffic.',
    fee: 0,
    slaDays: 4,
    requiredDocuments: ['Photo of hazardous tree branch', 'Exact Location Landmark'],
    icon: 'Trees',
    category: 'roads',
    onlinePortalUrl: 'https://nmcnagpur.gov.in',
    authorityName: 'NMC Garden Department'
  }
];

export const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  // 1. Housing & Urban Living
  {
    id: 'sch-pmay-urban',
    name: 'Pradhan Mantri Awas Yojana - Urban (PMAY-U)',
    marathiName: 'प्रधानमंत्री आवास योजना (शहरी)',
    hindiName: 'प्रधानमंत्री आवास योजना (शहरी)',
    category: 'Housing & Urban Living',
    beneficiaries: ['General Citizens', 'Women', 'Job Seekers'],
    purpose: 'Provides pucca housing assistance to all eligible urban families and slum dwellers in Nagpur.',
    benefits: 'Central & State subsidy up to ₹2.50 Lakh for Credit Linked Subsidy (CLSS) or Beneficiary Led Construction (BLC).',
    eligibility: [
      'Beneficiary family should not own a pucca house anywhere in India',
      'Annual family household income: EWS up to ₹3 Lakh, LIG up to ₹6 Lakh',
      'Female ownership or co-ownership mandatory for married beneficiaries',
      'Resident of Nagpur municipal corporation urban area'
    ],
    requiredDocuments: [
      'Aadhaar Card of all family members',
      'Voter ID / Ration Card',
      'Bank Account passbook linked with Aadhaar',
      'Land ownership title / City Survey PR card (for BLC component)',
      'Self-declaration of not owning any other pucca house'
    ],
    requiredCertificates: ['Income Certificate (तहसीलदार/SDR)', 'Domicile Certificate (Maharashtra)', 'Affidavit of Non-Housing Ownership'],
    applicationProcedure: 'Apply online via PMAY-U official portal or visit NMC Slum Rehabilitation / PMAY cell at Civil Lines HQ.',
    officialAuthority: 'Ministry of Housing and Urban Affairs & NMC Nagpur Housing Cell',
    officialLink: 'https://pmay-urban.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: '₹2.50 Lakhs'
  },
  {
    id: 'sch-ramai-awas',
    name: 'Ramai Awas Gharkul Yojana (Maharashtra)',
    marathiName: 'रमाई आवास घरकुल योजना',
    hindiName: 'रमाई आवास घरकुल योजना',
    category: 'Housing & Urban Living',
    beneficiaries: ['General Citizens', 'Persons with Disabilities', 'Women'],
    purpose: 'Provides subsidized permanent housing construction grant to Scheduled Caste (SC) and Neo-Buddhist families living in kaccha houses.',
    benefits: 'Grant of ₹2.50 Lakh in urban NMC areas for house construction, directly credited in installment milestones.',
    eligibility: [
      'Belonging to SC (Scheduled Caste) or Neo-Buddhist community of Maharashtra',
      'Permanent resident of Maharashtra State (Minimum 15 years domicile)',
      'Annual household income limit up to ₹3 Lakh for urban areas',
      'Own land/plot or existing kaccha house'
    ],
    requiredDocuments: [
      'Caste Certificate issued by Competent Authority of Maharashtra',
      'Income Certificate issued by Tehsildar',
      'Plot ownership 7/12 extract or City Survey Property Card',
      'Bank Account Passbook (Aadhaar Seeded)',
      'Photo of current Kaccha house'
    ],
    requiredCertificates: ['Caste Certificate (SC/Neo-Buddhist)', 'Income Certificate', 'Domicile Certificate (Maharashtra)'],
    applicationProcedure: 'Submit application on Maha-Awas / SJSA Social Justice Portal or at NMC Social Welfare department.',
    officialAuthority: 'Social Justice and Special Assistance Department, Govt. of Maharashtra',
    officialLink: 'https://sjsa.maharashtra.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: '₹2.50 Lakhs'
  },
  {
    id: 'sch-shabari-awas',
    name: 'Shabari Adivasi Gharkul Yojana',
    marathiName: 'शबरी आदिवासी घरकुल योजना',
    hindiName: 'शबरी आदिवासी घरकुल योजना',
    category: 'Housing & Urban Living',
    beneficiaries: ['Farmers', 'General Citizens', 'Persons with Disabilities'],
    purpose: 'Housing financial grant for Scheduled Tribe (ST) families living in substandard dwellings across Nagpur district and urban clusters.',
    benefits: 'Grant of ₹2.50 Lakh for pucca house construction with sanitation unit grant under Swachh Bharat.',
    eligibility: [
      'Belonging to Scheduled Tribe (ST) category of Maharashtra',
      'Permanent resident of Maharashtra with valid ST certificate and validity',
      'Family must not have received benefits under any previous government housing scheme'
    ],
    requiredDocuments: [
      'ST Caste Certificate & Caste Validity Certificate',
      'Income Certificate (Tehsildar)',
      'Land title document / PR Card',
      'Aadhaar and Bank details'
    ],
    requiredCertificates: ['ST Caste Certificate', 'Caste Validity Certificate', 'Income Certificate'],
    applicationProcedure: 'Apply through Tribal Development Department portal or Nagpur District Tribal Development Office, Giripeth.',
    officialAuthority: 'Tribal Development Department, Govt. of Maharashtra',
    officialLink: 'https://tribal.maharashtra.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: '₹2.50 Lakhs'
  },

  // 2. Financial Assistance & Livelihood
  {
    id: 'sch-pmsvanidhi',
    name: 'PM SVANidhi - Street Vendor Micro-Credit Scheme',
    marathiName: 'पीएम स्वनिधी - फेरीवाले व पथविक्रेते कर्ज योजना',
    hindiName: 'पीएम स्वनिधि योजना',
    category: 'Financial Assistance & Livelihood',
    beneficiaries: ['Entrepreneurs', 'Job Seekers', 'General Citizens'],
    purpose: 'Collateral-free working capital loan to urban street vendors and micro-hawkers operating in Nagpur.',
    benefits: '1st tranche ₹10,000, 2nd tranche ₹20,000, 3rd tranche ₹50,000 with 7% interest subsidy and cashback on digital UPI transactions.',
    eligibility: [
      'Street vendors possessing Certificate of Vending / ID Card issued by NMC Town Vending Committee (TVC)',
      'Vendors identified in NMC survey or vendors recommended with Letter of Recommendation (LoR)'
    ],
    requiredDocuments: [
      'Aadhaar Card linked to active mobile number',
      'Vending ID Card or Letter of Recommendation from NMC Ward Office',
      'Bank Account Passbook',
      'UPI QR Code merchant handle for digital cashback'
    ],
    requiredCertificates: ['NMC Vending ID Card / Town Vending Certificate'],
    applicationProcedure: 'Apply online on PMSVANidhi portal or visit nearest Common Service Centre (CSC) / NMC Zonal Office.',
    officialAuthority: 'Ministry of Housing and Urban Affairs & NMC Nagpur NULM Cell',
    officialLink: 'https://pmsvanidhi.mohua.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: '₹10,000 to ₹50,000'
  },
  {
    id: 'sch-sanjay-gandhi',
    name: 'Sanjay Gandhi Niradhar Anudan Yojana',
    marathiName: 'संजय गांधी निराधार अनुदान योजना',
    hindiName: 'संजय गांधी निराधार अनुदान योजना',
    category: 'Financial Assistance & Livelihood',
    beneficiaries: ['Senior Citizens', 'Women', 'Persons with Disabilities'],
    purpose: 'Monthly financial pension to destitute individuals, widows, abandoned women, and persons with severe disabilities.',
    benefits: 'Monthly financial assistance of ₹1,500 credited directly to bank account.',
    eligibility: [
      'Resident of Maharashtra for at least 15 continuous years',
      'Annual family income not exceeding ₹21,000 (relaxed for persons with >40% disability)',
      'Destitute women, aged persons (>65 years), or persons with permanent severe illnesses'
    ],
    requiredDocuments: [
      'Age Proof (School Leaving Certificate or Medical Officer Certificate)',
      'Residence Certificate (Domicile of 15 years in Maharashtra)',
      'Income Certificate (Tehsildar)',
      'Disability Certificate (>40% by Civil Surgeon) where applicable',
      'Death Certificate of Husband (for widow applicants)'
    ],
    requiredCertificates: ['Income Certificate (Below ₹21k)', 'Domicile Certificate', 'Civil Surgeon Disability Certificate', 'Death Certificate (for widows)'],
    applicationProcedure: 'Submit physical or online application through Tehsildar Office (Collectorate, Civil Lines, Nagpur) or Setu Kendra.',
    officialAuthority: 'Revenue and Forest Department, Govt. of Maharashtra (Nagpur Collectorate)',
    officialLink: 'https://nagpur.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: '₹1,500/month'
  },
  {
    id: 'sch-cmegp',
    name: "Chief Minister's Employment Generation Programme (CMEGP)",
    marathiName: 'मुख्यमंत्री रोजगार निर्मिती कार्यक्रम (CMEGP)',
    hindiName: 'मुख्यमंत्री रोजगार निर्माण कार्यक्रम',
    category: 'Financial Assistance & Livelihood',
    beneficiaries: ['Entrepreneurs', 'Job Seekers', 'Students', 'Women'],
    purpose: 'Financial assistance and capital subsidy for establishing new micro-enterprises, manufacturing units, and service startups in Maharashtra.',
    benefits: 'Project loans up to ₹50 Lakh (Manufacturing) and ₹20 Lakh (Service). Govt. capital subsidy 15% to 35% based on category.',
    eligibility: [
      'Age between 18 to 45 years (relaxation up to 50 years for SC/ST/Women/Ex-servicemen/PwD)',
      'Minimum educational qualification: 7th pass for projects >₹10 Lakh; 10th pass for projects >₹25 Lakh',
      'Resident of Maharashtra'
    ],
    requiredDocuments: [
      'Detailed Project Report (DPR)',
      'Aadhaar Card & PAN Card',
      'Educational Qualification Marksheet',
      'Domicile Certificate of Maharashtra',
      'Caste Certificate / Special Category proof (if seeking 35% subsidy)'
    ],
    requiredCertificates: ['Domicile Certificate', 'Educational Certificate', 'Caste Certificate (optional)', 'Income Certificate'],
    applicationProcedure: 'Apply online on Maha-CMEGP portal with DPR and select District Industries Centre (DIC) Nagpur.',
    officialAuthority: 'Directorate of Industries, Maharashtra & DIC Nagpur',
    officialLink: 'https://maha-cmegp.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: 'Up to 35% Capital Subsidy'
  },

  // 3. Health, Nutrition & Sanitation
  {
    id: 'sch-mjpjay',
    name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY & PM-JAY)',
    marathiName: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना',
    hindiName: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना',
    category: 'Health, Nutrition & Sanitation',
    beneficiaries: ['General Citizens', 'Senior Citizens', 'Farmers', 'Women'],
    purpose: 'Universal cashless health insurance coverage for all ration-card holding families in Maharashtra across 1,350+ medical procedures and surgeries.',
    benefits: 'Cashless medical treatment up to ₹5 Lakh per family per year in empaneled government (GMC, Super Speciality) and private hospitals in Nagpur.',
    eligibility: [
      'Holder of valid Yellow, Orange, or White Ration Card of Maharashtra',
      'All resident families of Maharashtra holding an Aadhaar card',
      'Available at all major Nagpur empaneled hospitals including AIIMS Nagpur, GMC, and Kingsway'
    ],
    requiredDocuments: [
      'Aadhaar Card of the patient and family head',
      'Ration Card (Yellow/Orange/White) or Ayushman Card',
      'Doctor prescription / Hospital admission referral'
    ],
    requiredCertificates: ['Aadhaar Card', 'Ration Card / Ayushman Bharat Health Account (ABHA)'],
    applicationProcedure: 'Present Aadhaar & Ration Card at the "Arogyamitra" desk at any empaneled hospital in Nagpur for instant cashless authorization.',
    officialAuthority: 'State Health Assurance Society (SHAS), Maharashtra',
    officialLink: 'https://www.jeevandayee.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: 'Up to ₹5 Lakh/year cashless'
  },
  {
    id: 'sch-bal-sangopan',
    name: 'Bal Sangopan Yojana (Foster Care Support)',
    marathiName: 'बाल संगोपन योजना',
    hindiName: 'बाल संगोपन योजना',
    category: 'Health, Nutrition & Sanitation',
    beneficiaries: ['Students', 'Women', 'General Citizens'],
    purpose: 'Financial assistance for single parents, foster parents, or guardians raising orphan, vulnerable, or single-earner deceased children.',
    benefits: '₹2,250 per month per child (up to 18 years of age) credited directly for education and nutrition.',
    eligibility: [
      'Children whose parents have passed away, or single mother/father unable to support',
      'Family annual income below ₹2 Lakh',
      'Age of child between 0 to 18 years, actively enrolled in school'
    ],
    requiredDocuments: [
      'Child Birth Certificate',
      'Death Certificate of parents / Medical inability certificate',
      'School Bonafide Certificate',
      'Income Certificate of guardian',
      'Guardian Aadhaar and Bank Passbook'
    ],
    requiredCertificates: ['Birth Certificate of Child', 'Death Certificate of Parent', 'Income Certificate', 'Bonafide Certificate'],
    applicationProcedure: 'Submit through District Women & Child Development (WCD) Office, Civil Lines, Nagpur or Child Welfare Committee (CWC).',
    officialAuthority: 'Women and Child Development Department, Maharashtra',
    officialLink: 'https://womenchild.maharashtra.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: '₹2,250/month per child'
  },

  // 4. Energy & Utilities
  {
    id: 'sch-pmsuryaghar',
    name: 'PM Surya Ghar: Muft Bijli Yojana (Rooftop Solar)',
    marathiName: 'पीएम सूर्य घर: मोफत वीज योजना',
    hindiName: 'पीएम सूर्य घर: मुफ्त बिजली योजना',
    category: 'Energy & Utilities',
    beneficiaries: ['General Citizens', 'Senior Citizens', 'Entrepreneurs'],
    purpose: 'Financial subsidy for installing grid-connected residential rooftop solar plants to obtain up to 300 units of free electricity per month.',
    benefits: 'Direct DBT subsidy: ₹30,000 for 1kW system, ₹60,000 for 2kW, ₹78,000 for 3kW and above with net-metering support from MSEDCL (Mahavitaran).',
    eligibility: [
      'Owner of residential building or apartment with suitable shadow-free rooftop',
      'Active residential electricity consumer connection with MSEDCL (Mahavitaran Nagpur)',
      'Must install through registered empaneled solar vendors'
    ],
    requiredDocuments: [
      'Latest MSEDCL electricity bill (showing Consumer Number & Billing Unit)',
      'Aadhaar Card of the electricity account holder',
      'Bank Account Passbook (for subsidy DBT transfer)',
      'Rooftop ownership document / Property tax receipt'
    ],
    requiredCertificates: ['MSEDCL Electricity Bill', 'NMC Property Tax Receipt / Ownership Proof'],
    applicationProcedure: 'Register on National Solar Rooftop Portal (pmsuryaghar.gov.in), select MSEDCL Nagpur DISCOM, choose vendor, and apply.',
    officialAuthority: 'Ministry of New and Renewable Energy (MNRE) & MSEDCL Nagpur',
    officialLink: 'https://pmsuryaghar.gov.in',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: 'Up to ₹78,000 subsidy'
  },
  {
    id: 'sch-atal-saur-pump',
    name: 'Atal Saur Krishi Pump Yojana (Magel Tyala Saur Krishi Pump)',
    marathiName: 'मागेल त्याला सौर कृषी पंप योजना',
    hindiName: 'अटल सौर कृषि पंप योजना',
    category: 'Energy & Utilities',
    beneficiaries: ['Farmers'],
    purpose: 'Provision of subsidized 3 HP, 5 HP, or 7.5 HP off-grid DC solar water agricultural pumps to farmers across rural & peri-urban Nagpur district.',
    benefits: '90% to 95% government subsidy. Farmer contributes only 5% (SC/ST) to 10% (General category) of total solar pump cost.',
    eligibility: [
      'Farmer with agricultural land holding having water source (well/borewell)',
      'Traditional electric agricultural connection not yet available',
      'Resident farmer of Maharashtra'
    ],
    requiredDocuments: [
      '7/12 Extract with Water Source mention',
      '8-A Extract',
      'Aadhaar Card',
      'Caste Certificate (for SC/ST concession)',
      'NOC from co-owners if joint land'
    ],
    requiredCertificates: ['7/12 & 8-A Land Record Extracts', 'Caste Certificate (for SC/ST)'],
    applicationProcedure: 'Apply online on MSEDCL Solar Agriculture Pump Portal (mahadiscom.in/solar_MTSKPY).',
    officialAuthority: 'MSEDCL & Agriculture Department, Govt. of Maharashtra',
    officialLink: 'https://www.mahadiscom.in/solar',
    lastVerifiedDate: 'August 2026',
    isNagpurSpecific: true,
    subsidyAmount: '90% - 95% Subsidy'
  }
];

export const CITIZEN_CERTIFICATES: CitizenCertificate[] = [
  {
    id: 'cert-income',
    name: 'Income Certificate (उत्पन्नाचा दाखला)',
    marathiName: 'तहसीलदार उत्पन्नाचा दाखला',
    hindiName: 'आय प्रमाण पत्र',
    purpose: 'Official legal proof of annual family income required for scholarships, college admissions (EBC), PMAY housing, and welfare schemes.',
    issuingAuthority: 'Revenue Department / Tehsildar, Nagpur Collectorate',
    department: 'Revenue & Forest Department',
    eligibility: [
      'Any permanent resident of Nagpur / Maharashtra',
      'Family member declaring verifiable income from salary, business, agriculture, or daily wages'
    ],
    requiredDocuments: [
      'Aadhaar Card / Voter ID of applicant',
      'Ration Card copy (listing all family members)',
      'Income Proof: Salary Slip (Form 16) / ITR OR Talathi Income Report for agriculture/labor',
      'Self-Declaration Affidavit on ₹100 stamp paper or Aaple Sarkar format'
    ],
    processType: 'Online via Aaple Sarkar',
    applicationSteps: [
      'Visit Aaple Sarkar portal (aaplesarkar.mahaonline.gov.in) and register user ID',
      'Select Revenue Department -> Revenue Services -> Income Certificate',
      'Fill family member details and upload scanned copies of Aadhaar, Ration Card & Income proof',
      'Pay official processing fee of ₹33.60 online',
      'Download digitally signed certificate from portal within 7 working days'
    ],
    officialSource: 'Aaple Sarkar - Government of Maharashtra RTS Portal',
    officialLink: 'https://aaplesarkar.mahaonline.gov.in',
    processingTimeDays: 7,
    governmentFee: 33.60,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['sch-pmay-urban', 'sch-ramai-awas', 'sch-sanjay-gandhi', 'sch-cmegp', 'sch-bal-sangopan']
  },
  {
    id: 'cert-domicile',
    name: 'Age, Nationality & Domicile Certificate (अधिवास प्रमाणपत्र)',
    marathiName: 'वय, राष्ट्रीयत्व आणि अधिवास प्रमाणपत्र',
    hindiName: 'मूल निवास / अधिवास प्रमाण पत्र',
    purpose: 'Mandatory proof of 15+ years continuous residence in Maharashtra required for government jobs (MPSC), state quota admissions, and state welfare schemes.',
    issuingAuthority: 'Sub-Divisional Officer (SDO) / Tehsildar, Nagpur',
    department: 'Revenue & Forest Department',
    eligibility: [
      'Continuous residence of at least 15 years in Maharashtra (or born in Maharashtra to domiciled parents)'
    ],
    requiredDocuments: [
      'School Leaving Certificate (TC) mentioning birthplace in Maharashtra',
      'Proof of 15 years residence: Electricity bills, NMC Property Tax receipts, or Ration card spanning 15 years',
      'Applicant Aadhaar Card',
      'Talathi residence enquiry report'
    ],
    processType: 'Online via Aaple Sarkar',
    applicationSteps: [
      'Register on Aaple Sarkar portal',
      'Select Revenue Department -> Certificate of Age, Nationality & Domicile',
      'Upload School Leaving Certificate, 15-year residence proof, and Aadhaar',
      'Pay online fee of ₹33.60 and track RTS token number',
      'Collect digitally signed certificate within 15 working days'
    ],
    officialSource: 'Aaple Sarkar RTS Maharashtra',
    officialLink: 'https://aaplesarkar.mahaonline.gov.in',
    processingTimeDays: 15,
    governmentFee: 33.60,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['sch-pmay-urban', 'sch-ramai-awas', 'sch-sanjay-gandhi', 'sch-cmegp']
  },
  {
    id: 'cert-caste',
    name: 'Caste Certificate (जातीचे प्रमाणपत्र)',
    marathiName: 'जातीचे प्रमाणपत्र (SC / ST / VJNT / OBC / SBC / SEBC)',
    hindiName: 'जाति प्रमाण पत्र',
    purpose: 'Proof of belonging to a reserved community under the Constitution of India and Maharashtra Government state list.',
    issuingAuthority: 'Sub-Divisional Magistrate (SDM) / SDO Nagpur',
    department: 'Social Justice & Special Assistance Department',
    eligibility: [
      'Applicant must belong to recognized SC, ST, VJNT, OBC, SBC, or SEBC category',
      'Family must have resided in Maharashtra before the designated deemed date (1950 for SC/ST, 1961 for VJNT, 1967 for OBC)'
    ],
    requiredDocuments: [
      'Applicant School Leaving Certificate (mentioning caste)',
      'Father / Grandfather / Paternal Uncle School Leaving Certificate or Kotwal Book entry proving caste before cutoff year',
      'Affidavit Form 3 / Form 17',
      'Ration Card and Aadhaar Card'
    ],
    processType: 'Online via Aaple Sarkar',
    applicationSteps: [
      'Fill Caste Certificate application form on Aaple Sarkar',
      'Upload genealogical tree (Vanshavali) and paternal pre-cutoff caste proof',
      'Verification by Tehsildar & SDO scrutiny committee',
      'Download Barcoded Caste Certificate upon approval'
    ],
    officialSource: 'Social Justice Dept / Aaple Sarkar',
    officialLink: 'https://aaplesarkar.mahaonline.gov.in',
    processingTimeDays: 21,
    governmentFee: 56.60,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['sch-ramai-awas', 'sch-shabari-awas', 'sch-cmegp', 'sch-atal-saur-pump']
  },
  {
    id: 'cert-non-creamy',
    name: 'Non-Creamy Layer Certificate (NCL) (उन्नत व प्रगत गटात मोडत नसल्याचे प्रमाणपत्र)',
    marathiName: 'नॉन-क्रिमीलेअर प्रमाणपत्र',
    hindiName: 'नॉन-क्रीमी लेयर प्रमाण पत्र',
    purpose: 'Certifies that an OBC/VJNT/SBC/SEBC family income is below ₹8 Lakhs for 3 consecutive financial years, qualifying for reservations.',
    issuingAuthority: 'Tehsildar / SDO Nagpur',
    department: 'Revenue & Forest Department',
    eligibility: [
      'Belonging to OBC, VJNT, SBC, or SEBC category of Maharashtra',
      'Gross annual family income less than ₹8 Lakh for the last 3 financial years'
    ],
    requiredDocuments: [
      'Valid Caste Certificate of applicant',
      'Income proof for last 3 financial years (ITR / 3-year Tehsildar Income Certificate)',
      'Aadhaar Card & Ration Card',
      'Self-Declaration Affidavit'
    ],
    processType: 'Online via Aaple Sarkar',
    applicationSteps: [
      'Select Revenue Department -> Non-Creamy Layer Certificate on Aaple Sarkar',
      'Attach 3-year income receipts & Caste certificate',
      'Submit application and pay online fee',
      'Download 1-year or 3-year validity NCL certificate'
    ],
    officialSource: 'Aaple Sarkar Maharashtra',
    officialLink: 'https://aaplesarkar.mahaonline.gov.in',
    processingTimeDays: 15,
    governmentFee: 33.60,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['sch-cmegp']
  },
  {
    id: 'cert-birth',
    name: 'Birth Certificate (जन्म प्रमाणपत्र)',
    marathiName: 'महानगरपालिका जन्म नोंदणी प्रमाणपत्र',
    hindiName: 'जन्म प्रमाण पत्र',
    purpose: 'Primary identity and age verification document issued by Nagpur Municipal Corporation for all births within city limits.',
    issuingAuthority: 'Registrar of Births & Deaths, NMC Nagpur',
    department: 'NMC Health & Vital Statistics Dept',
    eligibility: [
      'Birth occurred within Nagpur Municipal Corporation geographical jurisdiction'
    ],
    requiredDocuments: [
      'Hospital Discharge Summary / Form 1 Birth report from hospital',
      'Parents Aadhaar Cards',
      'Marriage Certificate or joint affidavit (for delayed registration >21 days)'
    ],
    processType: 'Online via Aaple Sarkar',
    applicationSteps: [
      'Apply on crsorgi.gov.in or NMC online portal / Aaple Sarkar',
      'Search registration record using date of birth, mother name & hospital name',
      'Pay ₹50 certificate fee online',
      'Download digitally signed QR-coded Birth Certificate'
    ],
    officialSource: 'Office of Registrar General & Census Commissioner / NMC',
    officialLink: 'https://crsorgi.gov.in',
    processingTimeDays: 7,
    governmentFee: 50.00,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['sch-bal-sangopan']
  },
  {
    id: 'cert-death',
    name: 'Death Certificate (मृत्यू प्रमाणपत्र)',
    marathiName: 'महानगरपालिका मृत्यू नोंदणी प्रमाणपत्र',
    hindiName: 'मृत्यु प्रमाण पत्र',
    purpose: 'Legal registration and issuance of death record required for insurance claims, property succession, bank settlements, and pensions.',
    issuingAuthority: 'Registrar of Births & Deaths, NMC Nagpur',
    department: 'NMC Health & Vital Statistics Dept',
    eligibility: [
      'Death occurred within NMC Nagpur jurisdiction or at Nagpur hospital/crematorium'
    ],
    requiredDocuments: [
      'Crematorium / Mokshadham receipt / Burial slip',
      'Hospital Medical Cause of Death certificate (Form 4/4A)',
      'Deceased person Aadhaar Card and Applicant ID'
    ],
    processType: 'Online via Aaple Sarkar',
    applicationSteps: [
      'Apply online on crsorgi.gov.in or NMC Zonal Health Office',
      'Provide crematorium entry number and hospital report',
      'Pay nominal fee of ₹50',
      'Receive official NMC Death Certificate'
    ],
    officialSource: 'Civil Registration System / NMC Health Dept',
    officialLink: 'https://crsorgi.gov.in',
    processingTimeDays: 5,
    governmentFee: 50.00,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['sch-sanjay-gandhi', 'sch-bal-sangopan']
  },
  {
    id: 'cert-disability',
    name: 'UDID Disability Certificate (दिव्यांगत्व प्रमाणपत्र)',
    marathiName: 'युनिक डिसॅबिलिटी आयडी (UDID) व दिव्यांग प्रमाणपत्र',
    hindiName: 'दिव्यांगता प्रमाण पत्र (UDID)',
    purpose: 'National Unique Disability Identity Card providing access to government pensions, free bus passes (Aapli Bus/MSRTC), and railway concessions.',
    issuingAuthority: 'Medical Board, Government Medical College & Hospital (GMC), Nagpur',
    department: 'Public Health & Social Justice Department',
    eligibility: [
      'Person with benchmark disability >= 40% diagnosed by designated Medical Board'
    ],
    requiredDocuments: [
      'Recent passport-size color photograph showing disability',
      'Aadhaar Card as ID and address proof',
      'Clinical diagnosis and hospital test reports'
    ],
    processType: 'Online & Offline (Setu Seva Kendra)',
    applicationSteps: [
      'Register on Swavlamban Portal (swavlambancard.gov.in)',
      'Upload Aadhaar and medical history',
      'Attend scheduled physical assessment at GMC Medical Board, Hanuman Nagar, Nagpur',
      'UDID Smart Card dispatched to home address and digital e-UDID downloadable'
    ],
    officialSource: 'Department of Empowerment of Persons with Disabilities, Govt. of India',
    officialLink: 'https://www.swavlambancard.gov.in',
    processingTimeDays: 30,
    governmentFee: 0,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['sch-sanjay-gandhi', 'sch-ramai-awas']
  },
  {
    id: 'cert-property-noc',
    name: 'NMC Property Tax Clearance NOC (मालमत्ता कर थकबाकी नसल्याचा दाखला)',
    marathiName: 'महानगरपालिका मालमत्ता कर ना-हरकत प्रमाणपत्र',
    hindiName: 'संपत्ति कर एनओसी',
    purpose: 'Proves zero pending tax dues on a property; required for building plan sanction, water connection, property resale, and bank mortgages.',
    issuingAuthority: 'Property Tax Assessment Officer, NMC Nagpur',
    department: 'NMC Assessment & Collection Dept',
    eligibility: [
      'Owner of registered property in NMC jurisdiction with all historical tax dues cleared'
    ],
    requiredDocuments: [
      'Property UPIN Index Number',
      'Latest paid Property Tax receipt copy',
      'Index-II / Sale Deed of property'
    ],
    processType: 'Online via Aaple Sarkar',
    applicationSteps: [
      'Visit NMC Property Tax portal (nmcnagpur.gov.in)',
      'Enter UPIN and ensure zero balance dues',
      'Click "Apply for Tax NOC / Dues Nil Certificate"',
      'Download instant barcoded clearance certificate'
    ],
    officialSource: 'Nagpur Municipal Corporation Assessment Department',
    officialLink: 'https://nmcnagpur.gov.in',
    processingTimeDays: 1,
    governmentFee: 0,
    lastVerifiedDate: 'August 2026',
    connectedSchemes: ['srv-water', 'srv-building', 'sch-pmsuryaghar']
  }
];

export const INITIAL_CASES: CaseItem[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const HOTSPOT_CLUSTERS: HotspotCluster[] = [
  {
    id: 'hotspot-1',
    name: 'Dharampeth - West High Court Road Corridor',
    ward: 'Dharampeth (Ward 4)',
    category: 'Road Problems',
    count: 0,
    confirmations: 0,
    activeCount: 0,
    resolvedCount: 0,
    lat: 21.1438,
    lng: 79.0645,
    severity: 'moderate',
    description: 'Civic monitoring node along West High Court Road between Law College and Coffee House Square.',
    recentCases: []
  },
  {
    id: 'hotspot-2',
    name: 'Sitabuldi Metro Junction & Variety Square',
    ward: 'Dharampeth (Ward 4)',
    category: 'Streetlight Problems',
    count: 0,
    confirmations: 0,
    activeCount: 0,
    resolvedCount: 0,
    lat: 21.1466,
    lng: 79.0806,
    severity: 'moderate',
    description: 'Civic monitoring node at Sitabuldi junction and pedestrian crossings.',
    recentCases: []
  },
  {
    id: 'hotspot-3',
    name: 'Sadar & Mangalwari Market Precinct',
    ward: 'Mangalwari (Ward 10)',
    category: 'Waste Management',
    count: 0,
    confirmations: 0,
    activeCount: 0,
    resolvedCount: 0,
    lat: 21.1712,
    lng: 79.0834,
    severity: 'moderate',
    description: 'Civic monitoring node around Mangalwari Bazaar precinct.',
    recentCases: []
  },
  {
    id: 'hotspot-4',
    name: 'Laxmi Nagar 8-Rasta Square & VNIT Link',
    ward: 'Laxmi Nagar (Ward 1)',
    category: 'Drainage Problems',
    count: 0,
    confirmations: 0,
    activeCount: 0,
    resolvedCount: 0,
    lat: 21.1219,
    lng: 79.0669,
    severity: 'moderate',
    description: 'Civic monitoring node near 8-Rasta square and VNIT gate link road.',
    recentCases: []
  },
  {
    id: 'hotspot-5',
    name: 'Nandanvan & KDK College Ring Road',
    ward: 'Nehru Nagar (Ward 5)',
    category: 'Water Problems',
    count: 0,
    confirmations: 0,
    activeCount: 0,
    resolvedCount: 0,
    lat: 21.1365,
    lng: 79.1302,
    severity: 'moderate',
    description: 'Civic monitoring node near KDK College square ring road.',
    recentCases: []
  },
  {
    id: 'hotspot-6',
    name: 'Itwari & Sataranjipura Wholesale Hub',
    ward: 'Sataranjipura (Ward 7)',
    category: 'Waste Management',
    count: 0,
    confirmations: 0,
    activeCount: 0,
    resolvedCount: 0,
    lat: 21.1542,
    lng: 79.1165,
    severity: 'moderate',
    description: 'Civic monitoring node along central market lanes in Itwari.',
    recentCases: []
  }
];

export const WARD_AREA_ANALYTICS: WardAreaStats[] = [
  {
    ward: 'Dharampeth (Ward 4)',
    zone: 'Zone 2 (Dharampeth)',
    area: 'Dharampeth, Ramdaspeth, Sitabuldi, Gokulpeth',
    totalProblems: 0,
    activeProblems: 0,
    resolvedProblems: 0,
    confirmations: 0,
    topCategory: 'Road Problems',
    categoryBreakdown: {
      'Road Problems': 0,
      'Streetlight Problems': 0,
      'Waste Management': 0,
      'Drainage Problems': 0,
      'Water Problems': 0
    }
  },
  {
    ward: 'Mangalwari (Ward 10)',
    zone: 'Zone 10 (Mangalwari)',
    area: 'Sadar, Mangalwari, Chaoni, Mecosabagh',
    totalProblems: 0,
    activeProblems: 0,
    resolvedProblems: 0,
    confirmations: 0,
    topCategory: 'Waste Management',
    categoryBreakdown: {
      'Waste Management': 0,
      'Road Problems': 0,
      'Streetlight Problems': 0,
      'Drainage Problems': 0
    }
  },
  {
    ward: 'Laxmi Nagar (Ward 1)',
    zone: 'Zone 1 (Laxmi Nagar)',
    area: 'Laxmi Nagar, VNIT, Bajaj Nagar, Pratap Nagar',
    totalProblems: 0,
    activeProblems: 0,
    resolvedProblems: 0,
    confirmations: 0,
    topCategory: 'Drainage Problems',
    categoryBreakdown: {
      'Drainage Problems': 0,
      'Road Problems': 0,
      'Streetlight Problems': 0,
      'Water Problems': 0
    }
  },
  {
    ward: 'Nehru Nagar (Ward 5)',
    zone: 'Zone 5 (Nehru Nagar)',
    area: 'Nandanvan, Sakkardara, Nehru Nagar, Dighori',
    totalProblems: 0,
    activeProblems: 0,
    resolvedProblems: 0,
    confirmations: 0,
    topCategory: 'Water Problems',
    categoryBreakdown: {
      'Water Problems': 0,
      'Road Problems': 0,
      'Waste Management': 0,
      'Streetlight Problems': 0
    }
  },
  {
    ward: 'Sataranjipura (Ward 7)',
    zone: 'Zone 7 (Sataranjipura)',
    area: 'Itwari, Maskasath, Sataranjipura, Shanti Nagar',
    totalProblems: 0,
    activeProblems: 0,
    resolvedProblems: 0,
    confirmations: 0,
    topCategory: 'Waste Management',
    categoryBreakdown: {
      'Waste Management': 0,
      'Road Problems': 0,
      'Streetlight Problems': 0
    }
  },
  {
    ward: 'Gandhibagh (Ward 6)',
    zone: 'Zone 6 (Gandhibagh)',
    area: 'Mahal, Gandhibagh, Tilak Statue, Badkas Chowk',
    totalProblems: 0,
    activeProblems: 0,
    resolvedProblems: 0,
    confirmations: 0,
    topCategory: 'Streetlight Problems',
    categoryBreakdown: {
      'Streetlight Problems': 0,
      'Drainage Problems': 0,
      'Road Problems': 0
    }
  }
];

export const COMMUNITY_INSIGHTS: CommunityInsight[] = [];


