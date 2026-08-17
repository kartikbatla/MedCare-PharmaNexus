import {
  inventory,
  expiryItems,
  purchaseOrders,
  invoices,
  paymentRequests,
  notifications,
  suppliers,
  materialRequests,
  alerts,
} from '../../../data/mockData';
import { medicineNameById } from '../../../data/medicineCatalog';
import { formatINR } from '../../../lib/utils';

export type Lang = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr';

export const LANGUAGES: Array<{ code: Lang; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

export function detectLanguage(text: string): Lang {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0900-\u097F]/.test(text)) {
    if (/आहे|होय|तुम्ही|मी\b|ची\b|चे\b|आहात/.test(text)) return 'mr';
    return 'hi';
  }
  return 'en';
}

export interface AiReply {
  text: string;
  buttons?: Array<{ label: string; action: string }>;
}

const T: Record<string, Record<Lang, string>> = {
  greeting: {
    en: "Hello! I'm your procurement assistant. I can check inventory, demand forecasts, expiry, suppliers, purchase orders, invoices, 3-way matching, payments and analytics. Ask me in English, Hindi or any Indian language.",
    hi: 'नमस्ते! मैं आपका procurement assistant हूँ। मैं inventory, demand forecast, expiry, suppliers, purchase orders, invoices, 3-way matching, payments और analytics में मदद कर सकता हूँ। आप किसी भी भारतीय भाषा में पूछ सकते हैं।',
    te: 'నమస్కారం! నేను మీ procurement assistant ని. inventory, demand forecast, expiry, suppliers, purchase orders, invoices, 3-way matching, payments మరియు analytics లో సహాయం చేయగలను. మీరు ఏ భారతీయ భాషలోనైనా అడగవచ్చు.',
    ta: 'வணக்கம்! நான் உங்கள் procurement assistant. inventory, demand forecast, expiry, suppliers, purchase orders, invoices, 3-way matching, payments மற்றும் analytics-இல் உதவ முடியும். எந்த இந்திய மொழியிலும் கேட்கலாம்.',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ procurement assistant. inventory, demand forecast, expiry, suppliers, purchase orders, invoices, 3-way matching, payments ಮತ್ತು analytics ನಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಯಾವುದೇ ಭಾರತೀಯ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಬಹುದು.',
    ml: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ procurement assistant ആണ്. inventory, demand forecast, expiry, suppliers, purchase orders, invoices, 3-way matching, payments, analytics എന്നിവയിൽ സഹായിക്കാം. ഏത് ഇന്ത്യൻ ഭാഷയിലും ചോദിക്കാം.',
    bn: 'নমস্কার! আমি আপনার procurement assistant. inventory, demand forecast, expiry, suppliers, purchase orders, invoices, 3-way matching, payments ও analytics-এ সাহায্য করতে পারি। আপনি যেকোনো ভারতীয় ভাষায় জিজ্ঞেস করতে পারেন।',
    mr: 'नमस्कार! मी तुमचा procurement assistant. inventory, demand forecast, expiry, suppliers, purchase orders, invoices, 3-way matching, payments आणि analytics मध्ये मदत करू शकतो. तुम्ही कोणत्याही भारतीय भाषेत विचारू शकता.',
  },

  fluStock: {
    en: '{item} stock in {city} is {stock} units. Based on current demand, there is a risk of running out in {days} days. Predicted demand is {demand} units — I recommend procuring {rec} units.',
    hi: '{city} में अभी {item} के {stock} units available हैं। Current demand के आधार पर stock {days} दिन में खत्म होने का खतरा है। Predicted demand {demand} units है — मैं {rec} units खरीदने की सलाह देता हूँ।',
    te: '{city} లో ప్రస్తుతం {item} {stock} units అందుబాటులో ఉన్నాయి. ప్రస్తుత డిమాండ్ ఆధారంగా {days} రోజుల్లో స్టాక్ అయిపోయే ప్రమాదం ఉంది. అంచనా డిమాండ్ {demand} units — {rec} units కొనుగోలు చేయాలని సిఫార్సు చేస్తున్నాను.',
    ta: '{city}-இல் தற்போது {item} {stock} units உள்ளது. தற்போதைய தேவையின் அடிப்படையில் {days} நாட்களில் ஸ்டாக் தீரும் அபாயம் உள்ளது. மதிப்பிடப்பட்ட தேவை {demand} units — {rec} units வாங்க பரிந்துரைக்கிறேன்.',
    kn: '{city} ನಲ್ಲಿ ಪ್ರಸ್ತುತ {item} {stock} units ಲಭ್ಯವಿದೆ. ಪ್ರಸ್ತುತ ಬೇಡಿಕೆಯ ಆಧಾರದಲ್ಲಿ {days} ದಿನಗಳಲ್ಲಿ ಸ್ಟಾಕ್ ಖಾಲಿಯಾಗುವ ಅಪಾಯವಿದೆ. ಅಂದಾಜು ಬೇಡಿಕೆ {demand} units — {rec} units ಖರೀದಿಸಲು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.',
    ml: '{city}-ൽ നിലവിൽ {item} {stock} units ലഭ്യമാണ്. നിലവിലെ ഡിമാൻഡ് അനുസരിച്ച് {days} ദിവസത്തിനുള്ളിൽ സ്റ്റോക്ക് തീരാനുള്ള സാധ്യതയുണ്ട്. പ്രതീക്ഷിക്കുന്ന ഡിമാൻഡ് {demand} units — {rec} units വാങ്ങാൻ ശുപാർശ ചെയ്യുന്നു.',
    bn: '{city}-তে এই মুহূর্তে {item} {stock} units উপলব্ধ। বর্তমান চাহিদা অনুযায়ী {days} দিনের মধ্যে স্টক শেষ হওয়ার ঝুঁকি রয়েছে। প্রত্যাশিত চাহিদা {demand} units — আমি {rec} units কেনার পরামর্শ দিচ্ছি।',
    mr: '{city} मध्ये सध्या {item} च्या {stock} units उपलब्ध आहेत. सध्याच्या मागणीनुसार {days} दिवसांत स्टॉक संपण्याचा धोका आहे. अंदाजित मागणी {demand} units आहे — मी {rec} units खरेदीची शिफारस करतो.',
  },

  reorder: {
    en: 'Yes, you should reorder. {item} in {city} has only {stock} units left with {days} days of cover, against a predicted demand of {demand} units. Given a {lead}-day lead time and {safety} units of safety stock, placing an order now for {rec} units is the right call.',
    hi: 'हाँ, reorder करना चाहिए। {city} में {item} के सिर्फ {stock} units बचे हैं और cover सिर्फ {days} दिन का है, जबकि predicted demand {demand} units है। {lead} दिन की lead time और {safety} units safety stock को देखते हुए, अभी {rec} units का order देना सही रहेगा।',
    te: 'అవును, reorder చేయాలి. {city} లో {item} కేవలం {stock} units మాత్రమే మిగిలి ఉంది, {days} రోజుల cover మాత్రమే ఉంది — అంచనా డిమాండ్ {demand} units. {lead}-రోజుల lead time మరియు {safety} units safety stock చూస్తే, ఇప్పుడే {rec} units ఆర్డర్ చేయడం సరైనది.',
    ta: 'ஆம், reorder செய்ய வேண்டும். {city}-இல் {item} {stock} units மட்டுமே உள்ளது, {days} நாட்கள் cover மட்டுமே உள்ளது — மதிப்பிடப்பட்ட தேவை {demand} units. {lead}-நாள் lead time மற்றும் {safety} units safety stock என்பதை பார்த்தால், இப்போதே {rec} units ஆர்டர் செய்வது சரியானது.',
    kn: 'ಹೌದು, reorder ಮಾಡಬೇಕು. {city} ನಲ್ಲಿ {item} ಕೇವಲ {stock} units ಉಳಿದಿದೆ, {days} ದಿನಗಳ cover ಮಾತ್ರ ಇದೆ — ಅಂದಾಜು ಬೇಡಿಕೆ {demand} units. {lead}-ದಿನ lead time ಮತ್ತು {safety} units safety stock ನೋಡಿದರೆ, ಈಗಲೇ {rec} units ಆರ್ಡರ್ ಮಾಡುವುದು ಸರಿಯಾಗಿದೆ.',
    ml: 'അതെ, reorder ചെയ്യണം. {city}-യിൽ {item} ഇനി {stock} units മാത്രമേ ബാക്കിയുള്ളൂ, {days} ദിവസത്തെ cover മാത്രം — പ്രതീക്ഷിക്കുന്ന ഡിമാൻഡ് {demand} units. {lead}-ദിവസം lead time, {safety} units safety stock എന്നിവ കണക്കിലെടുത്താൽ ഇപ്പോൾ തന്നെ {rec} units ഓർഡർ ചെയ്യുന്നതാണ് ശരി.',
    bn: 'হ্যাঁ, reorder করা উচিত। {city}-তে {item} মাত্র {stock} units অবশিষ্ট আছে, cover আছে {days} দিন — প্রত্যাশিত চাহিদা {demand} units। {lead}-দিনের lead time এবং {safety} units safety stock বিবেচনায় এখনই {rec} units অর্ডার করাই সঠিক।',
    mr: 'होय, reorder केले पाहिजे. {city} मध्ये {item} फक्त {stock} units शिल्लक आहे, {days} दिवसांचे cover आहे — अंदाजित मागणी {demand} units. {lead}-दिवसांची lead time आणि {safety} units safety stock पाहता, आत्ताच {rec} units ऑर्डर करणे योग्य आहे.',
  },

  inventory: {
    en: "Here's your live inventory snapshot:\n\n{list}\n\n{count} items are at stock-out risk. I can open the full inventory table or create a replenishment plan.",
    hi: 'आपका live inventory snapshot:\n\n{list}\n\n{count} items stock-out risk पर हैं। मैं पूरी inventory table या replenishment plan खोल सकता हूँ।',
    te: 'మీ live inventory snapshot ఇదిగో:\n\n{list}\n\n{count} వస్తువులు stock-out ప్రమాదంలో ఉన్నాయి. పూర్తి inventory table లేదా replenishment plan తెరవగలను.',
    ta: 'உங்கள் live inventory snapshot:\n\n{list}\n\n{count} பொருட்கள் stock-out அபாயத்தில் உள்ளன. முழு inventory table அல்லது replenishment plan-ஐ திறக்கலாம்.',
    kn: 'ನಿಮ್ಮ live inventory snapshot ಇಲ್ಲಿದೆ:\n\n{list}\n\n{count} ವಸ್ತುಗಳು stock-out ಅಪಾಯದಲ್ಲಿವೆ. ಪೂರ್ಣ inventory table ಅಥವಾ replenishment plan ತೆರೆಯಬಹುದು.',
    ml: 'നിങ്ങളുടെ live inventory snapshot ഇതാ:\n\n{list}\n\n{count} ഇനങ്ങൾ stock-out അപകടത്തിലാണ്. പൂർണ്ണ inventory table അല്ലെങ്കിൽ replenishment plan തുറക്കാം.',
    bn: 'আপনার live inventory snapshot:\n\n{list}\n\n{count}টি আইটেম stock-out ঝুঁকিতে রয়েছে। আমি সম্পূর্ণ inventory table বা replenishment plan খুলতে পারি।',
    mr: 'तुमचा live inventory snapshot:\n\n{list}\n\n{count} वस्तू stock-out जोखमीवर आहेत. मी संपूर्ण inventory table किंवा replenishment plan उघडू शकतो.',
  },

  demand: {
    en: '{item} demand in {city} is expected to rise to {demand} units per week (+{pct}%). Current stock of {stock} units covers only {days} days. I recommend procuring {rec} units.',
    hi: '{city} में {item} की demand अगले 7 दिनों में {demand} units/week (+{pct}%) तक बढ़ने का अनुमान है। Current stock {stock} units सिर्फ {days} दिन cover करता है। मैं {rec} units खरीदने की सलाह देता हूँ।',
    te: '{city} లో {item} డిమాండ్ {demand} units/week (+{pct}%)కి పెరుగుతుందని అంచనా. ప్రస్తుత {stock} units {days} రోజులు మాత్రమే సరిపోతాయి. {rec} units కొనుగోలు చేయాలని సిఫార్సు చేస్తున్నాను.',
    ta: '{city}-இல் {item} தேவை {demand} units/week (+{pct}%) ஆக உயரும் என மதிப்பிடப்பட்டுள்ளது. தற்போதைய {stock} units {days} நாட்கள் மட்டுமே போதும். {rec} units வாங்க பரிந்துரைக்கிறேன்.',
    kn: '{city} ನಲ್ಲಿ {item} ಬೇಡಿಕೆ {demand} units/week (+{pct}%) ಗೆ ಹೆಚ್ಚುತ್ತದೆ ಎಂದು ಅಂದಾಜು. ಪ್ರಸ್ತುತ {stock} units ಕೇವಲ {days} ದಿನಗಳಿಗೆ ಸಾಕು. {rec} units ಖರೀದಿಸಲು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.',
    ml: '{city}-യിൽ {item} ഡിമാൻഡ് {demand} units/week (+{pct}%) ആയി ഉയരുമെന്ന് പ്രതീക്ഷിക്കുന്നു. നിലവിലെ {stock} units {days} ദിവസം മാത്രം മതി. {rec} units വാങ്ങാൻ ശുപാർശ ചെയ്യുന്നു.',
    bn: '{city}-তে {item} চাহিদা {demand} units/week (+{pct}%) পর্যন্ত বাড়বে বলে আশা করা হচ্ছে। বর্তমান {stock} units মাত্র {days} দিনের জন্য যথেষ্ট। {rec} units কেনার পরামর্শ দিচ্ছি।',
    mr: '{city} मध्ये {item} ची मागणी {demand} units/week (+{pct}%) पर्यंत वाढेल असा अंदाज आहे. सध्याचे {stock} units फक्त {days} दिवस पुरेल. {rec} units खरेदीची शिफारस करतो.',
  },

  expiry: {
    en: 'Near-expiry items (FEFO):\n\n{list}\n\nI recommend prioritizing {item} for dispatch before the expiry window closes.',
    hi: 'Near-expiry items (FEFO):\n\n{list}\n\nमेरी सलाह है कि expiry window बंद होने से पहले {item} को dispatch के लिए प्राथमिकता दें।',
    te: 'సమీప గడువు వస్తువులు (FEFO):\n\n{list}\n\nగడువు ముగిసేలోపు {item} ని dispatch చేయడానికి ప్రాధాన్యత ఇవ్వాలని సిఫార్సు చేస్తున్నాను.',
    ta: 'காலாவதியாகும் பொருட்கள் (FEFO):\n\n{list}\n\nகாலாவதிக்கு முன் {item}-ஐ dispatch செய்ய முன்னுரிமை அளிக்க பரிந்துரைக்கிறேன்.',
    kn: 'ಹತ್ತಿರದ ಮುಕ್ತಾಯ ವಸ್ತುಗಳು (FEFO):\n\n{list}\n\nಮುಕ್ತಾಯ ಮೊದಲು {item} ಅನ್ನು dispatch ಮಾಡಲು ಆದ್ಯತೆ ನೀಡಲು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.',
    ml: 'അടുത്ത കാലാവധിയുള്ള ഇനങ്ങൾ (FEFO):\n\n{list}\n\nകാലാവധി കഴിയുന്നതിന് മുമ്പ് {item} dispatch ചെയ്യാൻ മുൻഗണന നൽകാൻ ശുപാർശ ചെയ്യുന്നു.',
    bn: 'সমাপ্তির কাছাকাছি আইটেম (FEFO):\n\n{list}\n\nমেয়াদ শেষ হওয়ার আগে {item} dispatch-এর জন্য অগ্রাধিকার দেওয়ার পরামর্শ দিচ্ছি।',
    mr: 'जवळच्या कालबाह्य वस्तू (FEFO):\n\n{list}\n\nकालबाह्य होण्यापूर्वी {item} dispatch करण्यास प्राधान्य देण्याची शिफारस करतो.',
  },

  supplier: {
    en: 'Best supplier for {item}: {supplier} — Supplier Score {score}/100 (demo).\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery and quality scores are demo/simulation values — actual rates require a quotation.',
    hi: '{item} के लिए सबसे अच्छा supplier: {supplier} — Supplier Score {score}/100 (demo)।\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery और quality scores demo/simulation values हैं — actual rates के लिए quotation चाहिए।',
    te: '{item} కోసం ఉత్తమ supplier: {supplier} — Supplier Score {score}/100 (demo).\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery మరియు quality scores demo/simulation విలువలు — వాస్తవ ధరలకు quotation అవసరం.',
    ta: '{item}-க்கான சிறந்த supplier: {supplier} — Supplier Score {score}/100 (demo).\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery மற்றும் quality scores demo/simulation மதிப்புகள் — உண்மையான விலைக்கு quotation தேவை.',
    kn: '{item} ಗಾಗಿ ಉತ್ತಮ supplier: {supplier} — Supplier Score {score}/100 (demo).\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery ಮತ್ತು quality scores demo/simulation ಮೌಲ್ಯಗಳು — ನೈಜ ದರಗಳಿಗೆ quotation ಅಗತ್ಯ.',
    ml: '{item}-നുള്ള ഏറ്റവും നല്ല supplier: {supplier} — Supplier Score {score}/100 (demo).\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery, quality scores demo/simulation മൂല്യങ്ങളാണ് — യഥാർത്ഥ നിരക്കിന് quotation വേണം.',
    bn: '{item}-এর জন্য সেরা supplier: {supplier} — Supplier Score {score}/100 (demo)।\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery এবং quality scores demo/simulation মান — প্রকৃত দরকার quotation।',
    mr: '{item} साठी सर्वोत्तम supplier: {supplier} — Supplier Score {score}/100 (demo).\n\n• Location: {location}\n• Capabilities: {caps}\n• Verification: Officially verified ✓\n\nPrice, delivery आणि quality scores demo/simulation मूल्ये आहेत — वास्तविक दरांसाठी quotation आवश्यक आहे.',
  },

  poStatus: {
    en: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}. Expected delivery {delivery}. {extra}',
    hi: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}। Expected delivery {delivery}। {extra}',
    te: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}. Expected delivery {delivery}. {extra}',
    ta: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}. Expected delivery {delivery}. {extra}',
    kn: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}. Expected delivery {delivery}. {extra}',
    ml: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}. Expected delivery {delivery}. {extra}',
    bn: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}। Expected delivery {delivery}। {extra}',
    mr: '{po} · {supplier} · {material} · {qty} units · {amount}\nStatus: {status}. Expected delivery {delivery}. {extra}',
  },

  invoiceAnomaly: {
    en: '{invoice} from {supplier} was flagged for a price anomaly:\n\n• PO price: {poPrice}/unit\n• Invoice price: {invPrice}/unit\n• Difference: +{pct}%\n\nOCR confidence is 96% — the invoice is held in Review Required pending supplier clarification.',
    hi: '{invoice} ({supplier}) price anomaly के लिए flagged हुआ था:\n\n• PO price: {poPrice}/unit\n• Invoice price: {invPrice}/unit\n• Difference: +{pct}%\n\nOCR confidence 96% है — invoice Review Required में रोक दी गई है जब तक supplier clarification न दे।',
    te: '{invoice} ({supplier}) ధర అసాధారణతకు గుర్తించబడింది:\n\n• PO ధర: {poPrice}/unit\n• ఇన్వాయిస్ ధర: {invPrice}/unit\n• తేడా: +{pct}%\n\nOCR confidence 96% — సరఫరాదారు వివరణ వచ్చే వరకు invoice Review Required లో ఉంది.',
    ta: '{invoice} ({supplier}) விலை முரண்பாட்டிற்காக flagged:\n\n• PO விலை: {poPrice}/unit\n• Invoice விலை: {invPrice}/unit\n• வேறுபாடு: +{pct}%\n\nOCR confidence 96% — சப்ளையர் விளக்கம் வரும் வரை invoice Review Required-இல் உள்ளது.',
    kn: '{invoice} ({supplier}) ಬೆಲೆ ಅಸಹಜತೆಗಾಗಿ flagged ಆಗಿದೆ:\n\n• PO ಬೆಲೆ: {poPrice}/unit\n• Invoice ಬೆಲೆ: {invPrice}/unit\n• ವ್ಯತ್ಯಾಸ: +{pct}%\n\nOCR confidence 96% — ಪೂರೈಕೆದಾರರ ಸ್ಪಷ್ಟೀಕರಣದವರೆಗೆ invoice Review Required ನಲ್ಲಿ ಇದೆ.',
    ml: '{invoice} ({supplier}) വില അപാകതയ്ക്കായി flag ചെയ്തു:\n\n• PO വില: {poPrice}/unit\n• Invoice വില: {invPrice}/unit\n• വ്യത്യാസം: +{pct}%\n\nOCR confidence 96% — സപ്ലയർ വിശദീകരണം വരുന്നതുവരെ invoice Review Required ആണ്.',
    bn: '{invoice} ({supplier}) দামের অস্বাভাবিকতার জন্য flagged হয়েছিল:\n\n• PO দাম: {poPrice}/unit\n• Invoice দাম: {invPrice}/unit\n• পার্থক্য: +{pct}%\n\nOCR confidence 96% — সরবরাহকারীর ব্যাখ্যা না আসা পর্যন্ত invoice Review Required-এ আছে।',
    mr: '{invoice} ({supplier}) किंमत विसंगतीसाठी flagged केले गेले:\n\n• PO किंमत: {poPrice}/unit\n• Invoice किंमत: {invPrice}/unit\n• फरक: +{pct}%\n\nOCR confidence 96% — supplier कडून स्पष्टीकरण येईपर्यंत invoice Review Required मध्ये आहे.',
  },

  matching: {
    en: '3-way matching compares three documents for every order:\n\n1. Purchase Order — what you ordered\n2. Material Receipt — what actually arrived (CV-confirmed)\n3. Invoice — what the supplier billed\n\nIf material, quantity and price all agree, the match succeeds and payment is released automatically. Current match rate: 94%.',
    hi: '3-way matching हर order के लिए तीन documents की तुलना करता है:\n\n1. Purchase Order — आपने क्या order किया\n2. Material Receipt — वास्तव में क्या पहुंचा (CV-confirmed)\n3. Invoice — supplier ने क्या bill किया\n\nअगर material, quantity और price सब मेल खाते हैं तो match सफल होता है और payment अपने आप release हो जाता है। Current match rate: 94%।',
    te: '3-way matching ప్రతి ఆర్డర్కు మూడు పత్రాలను పోల్చుతుంది:\n\n1. Purchase Order — మీరు ఆర్డర్ చేసినది\n2. Material Receipt — వాస్తవంగా వచ్చినది (CV-confirmed)\n3. Invoice — సరఫరాదారు వసూలు చేసినది\n\nmaterial, quantity మరియు ధర సరిపోతే match విజయవంతమవుతుంది మరియు payment స్వయంచాలకంగా విడుదలవుతుంది. Current match rate: 94%.',
    ta: '3-way matching ஒவ்வொரு ஆர்டருக்கும் மூன்று ஆவணங்களை ஒப்பிடுகிறது:\n\n1. Purchase Order — நீங்கள் ஆர்டர் செய்தது\n2. Material Receipt — உண்மையில் வந்தது (CV-confirmed)\n3. Invoice — சப்ளையர் பில் செய்தது\n\nmaterial, quantity மற்றும் விலை அனைத்தும் ஒத்துப்போனால் match வெற்றி பெறும், payment தானாக வெளியிடப்படும். Current match rate: 94%.',
    kn: '3-way matching ಪ್ರತಿ ಆರ್ಡರ್ಗೆ ಮೂರು ದಾಖಲೆಗಳನ್ನು ಹೋಲಿಸುತ್ತದೆ:\n\n1. Purchase Order — ನೀವು ಆರ್ಡರ್ ಮಾಡಿದ್ದು\n2. Material Receipt — ನಿಜವಾಗಿ ಬಂದದ್ದು (CV-confirmed)\n3. Invoice — ಪೂರೈಕೆದಾರರು ಬಿಲ್ ಮಾಡಿದ್ದು\n\nmaterial, quantity ಮತ್ತು ಬೆಲೆ ಸರಿಹೊಂದಿದರೆ match ಯಶಸ್ವಿಯಾಗುತ್ತದೆ ಮತ್ತು payment ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಬಿಡುಗಡೆಯಾಗುತ್ತದೆ. Current match rate: 94%.',
    ml: '3-way matching ഓരോ ഓർഡറിനും മൂന്ന് രേഖകൾ താരതമ്യം ചെയ്യുന്നു:\n\n1. Purchase Order — നിങ്ങൾ ഓർഡർ ചെയ്തത്\n2. Material Receipt — യഥാർത്ഥത്തിൽ വന്നത് (CV-confirmed)\n3. Invoice — സപ്ലയർ ബിൽ ചെയ്തത്\n\nmaterial, quantity, വില എല്ലാം യോജിച്ചാൽ match വിജയിക്കുകയും payment യാന്ത്രികമായി റിലീസ് ചെയ്യപ്പെടുകയും ചെയ്യും. Current match rate: 94%.',
    bn: '3-way matching প্রতিটি অর্ডারের জন্য তিনটি নথি তুলনা করে:\n\n1. Purchase Order — আপনি যা অর্ডার করেছেন\n2. Material Receipt — আসলে কী পৌঁছেছে (CV-confirmed)\n3. Invoice — সরবরাহকারী কী বিল করেছে\n\nmaterial, quantity ও দাম সব মিললে match সফল হয় এবং payment স্বয়ংক্রিয়ভাবে release হয়। Current match rate: 94%।',
    mr: '3-way matching प्रत्येक ऑर्डरसाठी तीन कागदपत्रांची तुलना करते:\n\n1. Purchase Order — तुम्ही काय ऑर्डर केले\n2. Material Receipt — प्रत्यक्षात काय आले (CV-confirmed)\n3. Invoice — supplier ने काय बिल केले\n\nmaterial, quantity आणि किंमत सर्व जुळल्यास match यशस्वी होते आणि payment आपोआप release होते. Current match rate: 94%.',
  },

  payment: {
    en: '{count} payments are pending approval worth {amount}. Of these, {ready} are recommended to approve and {review} need review.',
    hi: '{count} payments approval के लिए pending हैं, total {amount}। इनमें से {ready} approve करने की सलाह है और {review} को review की ज़रूरत है।',
    te: '{count} చెల్లింపులు ఆమోదం కోసం పెండింగ్లో ఉన్నాయి, విలువ {amount}. వీటిలో {ready} ఆమోదించాలని సిఫార్సు, {review} సమీక్ష అవసరం.',
    ta: '{count} கட்டணங்கள் ஒப்புதலுக்காக pending-இல் உள்ளன, மதிப்பு {amount}. இவற்றில் {ready} அங்கீகரிக்க பரிந்துரைக்கப்படுகிறது, {review} மதிப்பாய்வு தேவை.',
    kn: '{count} ಪಾವತಿಗಳು ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇವೆ, ಮೌಲ್ಯ {amount}. ಇವುಗಳಲ್ಲಿ {ready} ಅನುಮೋದಿಸಲು ಶಿಫಾರಸು, {review} ಪರಿಶೀಲನೆ ಅಗತ್ಯ.',
    ml: '{count} പേയ്മെന്റുകൾ അംഗീകാരത്തിനായി തീർപ്പുകാത്തതാണ്, മൂല്യം {amount}. ഇതിൽ {ready} അംഗീകരിക്കാൻ ശുപാർശ, {review} അവലോകനം ആവശ്യമാണ്.',
    bn: '{count} পেমেন্ট অনুমোদনের জন্য pending আছে, মূল্য {amount}। এর মধ্যে {ready} অনুমোদনের পরামর্শ, {review} পর্যালোচনা প্রয়োজন।',
    mr: '{count} पेमेंट्स मंजुरीसाठी प्रलंबित आहेत, मूल्य {amount}. यापैकी {ready} मंजूर करण्याची शिफारस आहे, {review} पुनरावलोकन आवश्यक आहे.',
  },

  createRequest: {
    en: "I can create a material request. Please confirm:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nWould you like me to submit it?",
    hi: 'मैं material request बना सकता हूँ। कृपया confirm करें:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nक्या मैं इसे submit कर दूँ?',
    te: 'నేను material request సృష్టించగలను. దయచేసి confirm చేయండి:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nమీరు submit చేయాలనుకుంటున్నారా?',
    ta: 'நான் material request உருவாக்க முடியும். தயவுசெய்து confirm செய்யவும்:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nஇதை submit செய்ய விரும்புகிறீர்களா?',
    kn: 'ನಾನು material request ರಚಿಸಬಲ್ಲೆ. ದಯವಿಟ್ಟು confirm ಮಾಡಿ:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nsubmit ಮಾಡಬೇಕೇ?',
    ml: 'എനിക്ക് material request സൃഷ്ടിക്കാം. ദയവായി confirm ചെയ്യുക:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nഇത് submit ചെയ്യണോ?',
    bn: 'আমি material request তৈরি করতে পারি। অনুগ্রহ করে confirm করুন:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nআমি কি এটি submit করব?',
    mr: 'मी material request तयार करू शकतो. कृपया confirm करा:\n\n• Material: {material}\n• Quantity: {qty} units\n• Location: {location}\n• Required by: {date}\n\nमी हे submit करू का?',
  },

  analytics: {
    en: 'Procure-to-pay performance this quarter:\n\n• {auto}% of transactions fully automated\n• {spend} processed spend\n• 94% 3-way match rate\n• {anomalies} invoice anomalies flagged in August\n\nEvery stage — predict → plan → procure → receive → verify → pay → analyze — is automated.',
    hi: 'इस quarter की procure-to-pay performance:\n\n• {auto}% transactions पूरी तरह automated\n• {spend} processed spend\n• 94% 3-way match rate\n• August में {anomalies} invoice anomalies flagged\n\nहर stage — predict → plan → procure → receive → verify → pay → analyze — automated है।',
    te: 'ఈ త్రైమాసిక procure-to-pay పనితీరు:\n\n• {auto}% లావాదేవీలు పూర్తిగా ఆటోమేటెడ్\n• {spend} processed spend\n• 94% 3-way match rate\n• ఆగస్టులో {anomalies} invoice anomalies గుర్తించబడ్డాయి\n\nప్రతి దశ — predict → plan → procure → receive → verify → pay → analyze — AI సహాయంతో.',
    ta: 'இந்த காலாண்டின் procure-to-pay செயல்திறன்:\n\n• {auto}% பரிவர்த்தனைகள் முழுமையாக தானியங்கி\n• {spend} processed spend\n• 94% 3-way match rate\n• ஆகஸ்டில் {anomalies} invoice anomalies கண்டறியப்பட்டன\n\nஒவ்வொரு நிலையும் — predict → plan → procure → receive → verify → pay → analyze — AI உதவியுடன்.',
    kn: 'ಈ ತ್ರೈಮಾಸಿಕ procure-to-pay ಕಾರ್ಯಕ್ಷಮತೆ:\n\n• {auto}% ವಹಿವಾಟುಗಳು ಸಂಪೂರ್ಣವಾಗಿ ಸ್ವಯಂಚಾಲಿತ\n• {spend} processed spend\n• 94% 3-way match rate\n• ಆಗಸ್ಟ್ನಲ್ಲಿ {anomalies} invoice anomalies ಗುರುತಿಸಲಾಗಿದೆ\n\nಪ್ರತಿ ಹಂತ — predict → plan → procure → receive → verify → pay → analyze — AI-ಸಹಾಯದಿಂದ.',
    ml: 'ഈ പാദത്തിലെ procure-to-pay പ്രകടനം:\n\n• {auto}% ഇടപാടുകൾ പൂർണ്ണമായി ഓട്ടോമേറ്റഡ്\n• {spend} processed spend\n• 94% 3-way match rate\n• ഓഗസ്റ്റിൽ {anomalies} invoice anomalies കണ്ടെത്തി\n\nഓരോ ഘട്ടവും — predict → plan → procure → receive → verify → pay → analyze — AI-സഹായത്തോടെ.',
    bn: 'এই ত্রৈমাসিকের procure-to-pay কর্মক্ষমতা:\n\n• {auto}% লেনদেন সম্পূর্ণ স্বয়ংক্রিয়\n• {spend} processed spend\n• 94% 3-way match rate\n• আগস্টে {anomalies} invoice anomalies ধরা পড়েছে\n\nপ্রতিটি ধাপ — predict → plan → procure → receive → verify → pay → analyze — AI-সহায়তায়।',
    mr: 'या तिमाहीची procure-to-pay कामगिरी:\n\n• {auto}% व्यवहार पूर्णपणे स्वयंचलित\n• {spend} processed spend\n• 94% 3-way match rate\n• ऑगस्टमध्ये {anomalies} invoice anomalies आढळल्या\n\nप्रत्येक टप्पा — predict → plan → procure → receive → verify → pay → analyze — AI-सहाय्याने.',
  },

  notifications: {
    en: 'You have {unread} unread notifications:\n\n{list}',
    hi: 'आपके पास {unread} unread notifications हैं:\n\n{list}',
    te: 'మీకు {unread} చదవని నోటిఫికేషన్లు ఉన్నాయి:\n\n{list}',
    ta: 'உங்களுக்கு {unread} படிக்காத அறிவிப்புகள் உள்ளன:\n\n{list}',
    kn: 'ನಿಮಗೆ {unread} ಓದದ ಅಧಿಸೂಚನೆಗಳಿವೆ:\n\n{list}',
    ml: 'നിങ്ങൾക്ക് {unread} വായിക്കാത്ത അറിയിപ്പുകൾ ഉണ്ട്:\n\n{list}',
    bn: 'আপনার {unread}টি অপঠিত বিজ্ঞপ্তি আছে:\n\n{list}',
    mr: 'तुमच्याकडे {unread} न वाचलेल्या सूचना आहेत:\n\n{list}',
  },

  default: {
    en: `I can help with inventory, demand forecasts, expiry, material requests, suppliers, purchase orders, invoices, 3-way matching, payments and analytics. Try:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
    hi: `मैं inventory, demand forecast, expiry, material request, suppliers, purchase orders, invoices, 3-way matching, payments और analytics में मदद कर सकता हूँ। Try करें:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
    te: `నేను inventory, demand forecast, expiry, material request, suppliers, purchase orders, invoices, 3-way matching, payments, analytics లో సహాయం చేయగలను. Try:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
    ta: `inventory, demand forecast, expiry, material request, suppliers, purchase orders, invoices, 3-way matching, payments, analytics-இல் உதவ முடியும். Try:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
    kn: `ನಾನು inventory, demand forecast, expiry, material request, suppliers, purchase orders, invoices, 3-way matching, payments, analytics ನಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. Try:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
    ml: `inventory, demand forecast, expiry, material request, suppliers, purchase orders, invoices, 3-way matching, payments, analytics എന്നിവയിൽ സഹായിക്കാം. Try:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
    bn: `আমি inventory, demand forecast, expiry, material request, suppliers, purchase orders, invoices, 3-way matching, payments ও analytics-এ সাহায্য করতে পারি। Try:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
    mr: `मी inventory, demand forecast, expiry, material request, suppliers, purchase orders, invoices, 3-way matching, payments, analytics मध्ये मदत करू शकतो. Try:\n\n• "Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?"\n• "Which medicines expire soon?"\n• "Status of PO-10452"\n• "Create a request for 200 ${medicineNameById('MED-0002')} in Mumbai"\n• "Do we need to reorder ${medicineNameById('MED-0001')}?"`,
  },
};

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

function t(key: string, lang: Lang, vars: Record<string, string | number> = {}): string {
  return fill(T[key][lang] ?? T[key].en, vars);
}

const recommendedSupplier = suppliers.find((s) => s.recommended) ?? suppliers[0];

function inventoryList(lines: string[]): string {
  return lines.join('\n');
}

export function craftReply(input: string, activeLang: Lang): AiReply {
  const detected = detectLanguage(input);
  const lang: Lang = detected !== 'en' ? detected : activeLang;
  const q = input.toLowerCase();

  const nameMatch = inventory.find((i) => q.includes(i.medicine.toLowerCase()));
  const nameText = nameMatch?.medicine;
  const locInQuery = q.includes('delhi')
    ? 'Delhi'
    : q.includes('mumbai')
      ? 'Mumbai'
      : q.includes('chennai')
        ? 'Chennai'
        : q.includes('bengaluru') || q.includes('bangalore')
          ? 'Bengaluru'
          : q.includes('hyderabad')
            ? 'Hyderabad'
            : q.includes('kolkata')
              ? 'Kolkata'
              : null;

  // stock query (Hindi or English) for a specific medicine
  if (nameMatch) {
    const item = inventory.find(
      (i) => i.medicine === nameMatch.medicine && (!locInQuery || i.location === locInQuery),
    ) ?? nameMatch;

    const isReorder = /reorder|re-order|buy more|order more|kharidna|reorder करना|ഓർഡർ|order कर/ .test(q);
    const vars = {
      item: item.medicine,
      city: item.location,
      stock: item.currentStock,
      days: item.daysRemaining,
      demand: item.predictedDemand,
      rec: Math.max(0, item.predictedDemand - item.currentStock),
      lead: 5,
      safety: item.safetyStock,
    };
    if (isReorder) {
      return {
        text: t('reorder', lang, vars),
        buttons: [
          { label: 'Create Request', action: 'create-request' },
          { label: 'Open Inventory', action: 'view-inventory' },
        ],
      };
    }
    return {
      text: t('fluStock', lang, vars),
      buttons: [
        { label: 'Create Request', action: 'create-request' },
        { label: 'Demand Chart', action: 'view-demand' },
      ],
    };
  }

  if (q.includes('po-10452') || q.includes('po-10451') || q.includes('po-10449') || q.includes('po-10448') || /po-?\d+/.test(q)) {
    const poMatch = q.match(/po-?\d+/)?.[0].replace('-', '-').toUpperCase() ?? 'PO-10452';
    const po = purchaseOrders.find((p) => p.poNumber.toLowerCase() === poMatch.toLowerCase()) ?? purchaseOrders[0];
    return {
      text: t('poStatus', lang, {
        po: po.poNumber,
        supplier: po.supplier,
        material: po.material,
        qty: po.quantity,
        amount: formatINR(po.totalAmount),
        status: po.status,
        delivery: po.expectedDelivery,
        extra: po.aiRecommended ? 'Recommended order.' : '',
      }),
      buttons: [
        { label: 'View PO', action: 'view-po' },
        { label: 'Send Order', action: 'send-po' },
      ],
    };
  }

  if (q.includes('invoice') || q.includes('inv-20452') || q.includes('inv-20448') || q.includes('anomal') || q.includes('flag') || q.includes('ocr')) {
    const flagged = invoices.find((v) => v.anomalies.length > 0);
    if (flagged && (q.includes('anomal') || q.includes('flag') || q.includes('ocr') || q.includes(flagged.invoiceNumber.toLowerCase()))) {
      const po = purchaseOrders.find((p) => p.poNumber === flagged.poNumber);
      const received = po?.receivedQty ?? 0;
      const text =
        po && received < flagged.quantity
          ? `${flagged.invoiceNumber} from ${flagged.supplier} was flagged for a quantity mismatch:\n\n• PO ordered: ${po.quantity} units\n• Material received: ${received} units\n• Invoice billed: ${flagged.quantity} units\n\nPay only for the ${received} units actually received and request a credit note for the shortfall.`
          : t('invoiceAnomaly', lang, {
              invoice: flagged.invoiceNumber,
              supplier: flagged.supplier,
              poPrice: purchaseOrders.find((p) => p.poNumber === flagged.poNumber)?.unitPrice ?? 0,
              invPrice: flagged.unitPrice,
              pct: flagged.unitPrice && purchaseOrders.find((p) => p.poNumber === flagged.poNumber)?.unitPrice
                ? Math.round(((flagged.unitPrice - (purchaseOrders.find((p) => p.poNumber === flagged.poNumber)?.unitPrice ?? 0)) / (purchaseOrders.find((p) => p.poNumber === flagged.poNumber)?.unitPrice ?? 0)) * 100)
                : 0,
            });
      return {
        text,
        buttons: [
          { label: 'Review Invoice', action: 'view-invoice' },
          { label: 'Send for Review', action: 'review-invoice' },
        ],
      };
    }
    const inv = invoices.find((v) => v.invoiceNumber.toLowerCase() === 'inv-20452') ?? invoices.find((v) => q.includes(v.invoiceNumber.toLowerCase()));
    if (inv && inv.anomalies.length === 0) {
      const po = purchaseOrders.find((p) => p.poNumber === inv.poNumber);
      return {
        text: `${inv.invoiceNumber} from ${inv.supplier} is verified:\n\n• Material: ${inv.material}\n• Quantity invoiced: ${inv.quantity} units\n• Invoice amount: ${formatINR(inv.totalAmount)}\n• Status: Verified\n\nIt matches the quantity received on ${inv.poNumber} — a valid partial match. The remaining ${Math.max(0, (po?.quantity ?? inv.quantity) - inv.quantity)} units are still pending delivery.`,
        buttons: [{ label: 'Review Invoice', action: 'view-invoice' }],
      };
    }
  }

  if (q.includes('expiry') || q.includes('expire') || q.includes('fefo') || q.includes('khatam hone')) {
    const sorted = [...expiryItems].sort((a, b) => a.daysRemaining - b.daysRemaining);
    const list = sorted
      .slice(0, 3)
      .map((e) => `• ${e.product} (${e.warehouse}) — ${e.quantity} units · expires ${e.expiryDate} (${e.daysRemaining} days) · ${formatINR(e.valueAtRisk)} at risk`)
      .join('\n');
    return {
      text: t('expiry', lang, { list, item: sorted[0].product }),
      buttons: [
        { label: 'Manage Expiry', action: 'view-expiry' },
        { label: 'Prioritize Dispatch', action: 'dispatch' },
      ],
    };
  }

  if (q.includes('supplier') || q.includes('best for') || q.includes('compare') || q.includes('kis') || q.includes('vendor')) {
    const sup = nameMatch ? suppliers.find((s) => s.recommended) ?? recommendedSupplier : recommendedSupplier;
    return {
      text: t('supplier', lang, {
        item: nameText ?? 'this item',
        supplier: sup.name,
        score: sup.aiScore,
        location: sup.location,
        caps: sup.products.slice(0, 3).join(', '),
      }),
      buttons: [{ label: 'Compare Suppliers', action: 'view-suppliers' }],
    };
  }

  if (q.includes('payment') || q.includes('pay') || q.includes('approve')) {
    const pending = paymentRequests.filter((p) => p.status === 'Pending');
    const ready = pending.filter((p) => p.recommendation === 'Approve').length;
    const review = pending.length - ready;
    return {
      text: t('payment', lang, {
        count: pending.length,
        amount: formatINR(pending.reduce((s, p) => s + p.amount, 0)),
        ready,
        review,
      }),
      buttons: [{ label: 'Review Payments', action: 'view-payments' }],
    };
  }

  if (q.includes('3-way') || q.includes('matching') || q.includes('three way') || q.includes('match')) {
    return {
      text: t('matching', lang),
      buttons: [
        { label: 'Open Matching', action: 'view-matching' },
        { label: 'Run Batch Match', action: 'batch-match' },
      ],
    };
  }

  if (q.includes('request') || q.includes('create') || q.includes('want') || q.includes('need 500') || q.includes('chahiye')) {
    const material = nameText ?? 'this item';
    const qtyMatch = q.match(/\d+/);
    const qty = qtyMatch ? Number(qtyMatch[0]) : 360;
    return {
      text: t('createRequest', lang, {
        material,
        qty,
        location: locInQuery ?? 'Delhi',
        date: '2026-08-22',
      }),
      buttons: [
        { label: 'Create Request', action: 'create-request' },
        { label: 'Cancel', action: 'cancel' },
      ],
    };
  }

  if (q.includes('analytics') || q.includes('automation') || q.includes('p2p') || q.includes('procure-to-pay') || q.includes('cycle')) {
    return {
      text: t('analytics', lang, { auto: 78, spend: '₹18.1L', anomalies: 3 }),
      buttons: [{ label: 'Open Control Tower', action: 'view-analytics' }],
    };
  }

  if (q.includes('notification') || q.includes('alert') || q.includes('notify')) {
    const unread = notifications.filter((n) => !n.read);
    const list = unread.slice(0, 3).map((n) => `• ${n.title} — ${n.message}`).join('\n');
    return {
      text: t('notifications', lang, { unread: unread.length, list }),
      buttons: [{ label: 'Open Notifications', action: 'view-notifications' }],
    };
  }

  if (q.includes('inventory') || q.includes('stock') || q.includes('levels') || q.includes('inventory ka')) {
    const list = inventoryList(
      inventory
        .slice(0, 5)
        .map(
          (i) =>
            `• ${i.medicine} (${i.location}) — ${i.currentStock} units · ${i.status.toUpperCase()} (${i.daysRemaining} days)`,
        ),
    );
    return {
      text: t('inventory', lang, { list, count: inventory.filter((i) => i.status === 'Critical').length }),
      buttons: [
        { label: 'Open Inventory', action: 'view-inventory' },
        { label: 'Replenishment Plan', action: 'view-replenishment' },
      ],
    };
  }

  if (q.includes('forecast') || q.includes('demand') || q.includes('predict')) {
    const item = inventory.find((i) => i.status === 'Critical') ?? inventory[0];
    return {
      text: t('demand', lang, {
        item: item.medicine,
        city: item.location,
        demand: item.predictedDemand,
        pct: 60,
        stock: item.currentStock,
        days: item.daysRemaining,
        rec: Math.max(0, item.predictedDemand - item.currentStock),
      }),
      buttons: [
        { label: 'Demand Chart', action: 'view-demand' },
        { label: 'Review Recommendation', action: 'view-replenishment' },
      ],
    };
  }

  if (q.includes('hi') || q.includes('hello') || q.includes('namaste') || q.includes('help') || q.includes('namaskar') || q.includes('vanakkam')) {
    return { text: t('greeting', lang) };
  }

  return {
    text: t('default', lang),
  };
}

export function initialGreeting(lang: Lang): string {
  return t('greeting', lang);
}

export const CHAT_SUGGESTIONS = [
  `Delhi mein ${medicineNameById('MED-0001')} ka stock kitna hai?`,
  `Do we need to reorder ${medicineNameById('MED-0001')}?`,
  'Which medicines expire soon?',
  'What is the status of PO-10452?',
  `Which supplier is best for ${medicineNameById('MED-0001')}?`,
  'Why was invoice INV-20448 flagged?',
  'Show current inventory levels',
  'How does 3-way matching work?',
];

export const DEMO_ALERT_COUNT = alerts.length;
export const ACTIVE_MATERIAL_REQUESTS = materialRequests.filter((m) => m.status === 'Under Review').length;
export const PENDING_PO_COUNT = purchaseOrders.filter((p) => p.status === 'Draft' || p.status === 'Approved').length;
export const PENDING_PAYMENT_SUM = formatINR(paymentRequests.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0));
