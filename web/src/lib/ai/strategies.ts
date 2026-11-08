/**
 * Sabika strategy playbook. The model checks the chart against every strategy,
 * names the ones that are present, and builds the setup on the strongest confluence.
 * Every stored analysis keeps the strategy ids → per-strategy win rates later (M2 grading).
 * Rules are written fresh for this product; they describe widely known public techniques.
 */
export interface Strategy {
  id: string;
  family: "price_action" | "patterns" | "smc" | "indicators" | "sessions" | "structure";
  name_ar: string;
  name_en: string;
  styles: ("scalp" | "swing")[];
  rules: string; // condition → entry → stop → target, in compact Arabic
}

export const STRATEGIES: Strategy[] = [
  // ---------- price action
  { id: "sr_bounce", family: "price_action", name_ar: "ارتداد من دعم/مقاومة", name_en: "Support/resistance bounce", styles: ["scalp", "swing"],
    rules: "مستوى لمسه السعر مرتين أو أكثر. دخول عند رفض واضح (ذيل طويل أو ابتلاع) على المستوى. ستوب خلف المستوى بهامش. هدف أول عند المستوى المعاكس القريب." },
  { id: "breakout_retest", family: "price_action", name_ar: "كسر وإعادة اختبار", name_en: "Breakout and retest", styles: ["scalp", "swing"],
    rules: "إغلاق واضح خلف مستوى أفقي أو خط ترند، ثم رجوع للمستوى وتماسك. دخول بعد شمعة تأكيد على إعادة الاختبار. ستوب داخل النطاق القديم. هدف بمقدار ارتفاع النطاق." },
  { id: "trend_pullback", family: "price_action", name_ar: "تصحيح ضمن الترند", name_en: "Trend pullback", styles: ["scalp", "swing"],
    rules: "قمم وقيعان صاعدة (أو هابطة). دخول بنهاية التصحيح عند دعم ديناميكي أو مستوى سابق. ستوب خلف آخر قاع (أو قمة). هدف عند القمة السابقة وما بعدها." },
  { id: "range_trade", family: "price_action", name_ar: "التداول داخل النطاق", name_en: "Range trading", styles: ["scalp"],
    rules: "سعر عرضي بين حدين واضحين بدون ترند. بيع قرب الحد العلوي وشراء قرب السفلي بعد رفض. ستوب خارج الحد. هدف منتصف النطاق ثم الحد المقابل. يلغى عند إغلاق خارج النطاق." },
  { id: "trendline", family: "price_action", name_ar: "خط الترند", name_en: "Trendline", styles: ["scalp", "swing"],
    rules: "خط يمر بثلاث نقاط على الأقل. دخول مع الترند عند لمسة جديدة ورفض. كسر الخط بإغلاق قوي يلغي الفكرة أو يحولها إلى كسر وإعادة اختبار." },
  { id: "candlestick", family: "price_action", name_ar: "أنماط الشموع", name_en: "Candlestick patterns", styles: ["scalp", "swing"],
    rules: "ابتلاعية، مطرقة، شهاب، دوجي، نجمة صباح/مساء، داخلية. لها قيمة فقط على مستوى مهم. دخول بعد إغلاق النمط. ستوب خلف طرف النمط." },

  // ---------- classic chart patterns
  { id: "double_top_bottom", family: "patterns", name_ar: "قمة/قاع مزدوج", name_en: "Double top/bottom", styles: ["scalp", "swing"],
    rules: "قمتين (أو قاعين) متقاربتين ثم كسر خط العنق. دخول عند الكسر أو إعادة اختباره. ستوب خلف القمة/القاع الثاني. هدف بمقدار ارتفاع النموذج." },
  { id: "head_shoulders", family: "patterns", name_ar: "الرأس والكتفين", name_en: "Head and shoulders", styles: ["swing"],
    rules: "كتف، رأس أعلى، كتف أدنى من الرأس، ثم كسر خط العنق. دخول بعد الكسر. ستوب فوق الكتف الأيمن. هدف بمسافة الرأس عن العنق." },
  { id: "triangle_flag", family: "patterns", name_ar: "مثلث / علم / وتد", name_en: "Triangle / flag / wedge", styles: ["scalp", "swing"],
    rules: "انضغاط السعر بين خطين متقاربين بعد حركة قوية. دخول مع اتجاه الحركة السابقة عند الكسر. ستوب داخل النموذج. هدف بطول السارية أو أعرض جزء بالمثلث." },

  // ---------- smart money / ICT
  { id: "liquidity_sweep", family: "smc", name_ar: "سحب السيولة", name_en: "Liquidity sweep", styles: ["scalp", "swing"],
    rules: "السعر يكسر قمة/قاع واضح (قمم متساوية، قمة اليوم السابق، قمة آسيا) بذيل ثم يرجع بسرعة داخل النطاق. دخول عكس الكسر بعد شمعة رجوع. ستوب خلف طرف الذيل. هدف السيولة المقابلة." },
  { id: "order_block", family: "smc", name_ar: "منطقة الأوامر (Order Block)", name_en: "Order block", styles: ["scalp", "swing"],
    rules: "آخر شمعة معاكسة قبل حركة قوية كسرت الهيكل. دخول عند رجوع السعر للمنطقة. ستوب خلف المنطقة. هدف آخر قمة/قاع." },
  { id: "fvg", family: "smc", name_ar: "الفجوة السعرية (FVG)", name_en: "Fair value gap", styles: ["scalp", "swing"],
    rules: "ثلاث شموع، ذيل الأولى ما يلمس ذيل الثالثة. السعر يميل يرجع يملأ الفجوة. دخول عند ملء الفجوة باتجاه الحركة الأصلية. ستوب خلف الفجوة." },
  { id: "bos_choch", family: "smc", name_ar: "كسر الهيكل / تغيّر الطابع", name_en: "BOS / CHoCH", styles: ["scalp", "swing"],
    rules: "BOS: كسر قمة (أو قاع) مع الترند يؤكد الاستمرار. CHoCH: أول كسر عكس الترند ينذر بانعكاس. دخول بعد التصحيح التالي للكسر. ستوب خلف القاع/القمة اللي سببت الكسر." },
  { id: "supply_demand", family: "smc", name_ar: "العرض والطلب", name_en: "Supply and demand zones", styles: ["swing"],
    rules: "قاعدة صغيرة انطلق منها السعر بقوة. أول رجوع للمنطقة غالباً أقوى من الرجوع الثاني. دخول عند أول رجوع. ستوب خلف المنطقة." },

  // ---------- indicators (only if visible on the chart)
  { id: "ma_trend", family: "indicators", name_ar: "المتوسطات المتحركة", name_en: "Moving averages", styles: ["scalp", "swing"],
    rules: "فقط إذا ظاهرة بالصورة. السعر فوق المتوسط 50/200 = ميل للشراء والعكس. التقاطعات تأكيد متأخر. الرجوع للمتوسط ضمن الترند فرصة دخول." },
  { id: "rsi_divergence", family: "indicators", name_ar: "دايفرجنس RSI", name_en: "RSI divergence", styles: ["scalp", "swing"],
    rules: "فقط إذا RSI ظاهر. قمة سعرية أعلى ويا قمة RSI أدنى = ضعف صعود (والعكس للقيعان). يحتاج تأكيد بكسر هيكل صغير قبل الدخول." },
  { id: "macd", family: "indicators", name_ar: "الماكد", name_en: "MACD", styles: ["swing"],
    rules: "فقط إذا ظاهر. تقاطع الخطوط فوق/تحت الصفر ويا اتجاه الترند. الدايفرجنس ينذر بضعف الحركة." },
  { id: "bollinger", family: "indicators", name_ar: "البولينجر باند", name_en: "Bollinger Bands", styles: ["scalp"],
    rules: "فقط إذا ظاهر. انضغاط الحزام قبل انفجار حركة. بالنطاق: ارتداد من الحد الخارجي للوسط. بالترند: الركوب على الحزام." },
  { id: "fibonacci", family: "indicators", name_ar: "فيبوناتشي", name_en: "Fibonacci retracement", styles: ["swing"],
    rules: "من قاع إلى قمة الموجة الأخيرة. مناطق التصحيح 38.2–61.8% مع تلاقي دعم = منطقة دخول. ستوب خلف 78.6% أو بداية الموجة. أهداف عند القمة ثم 127%." },
  { id: "pivots", family: "indicators", name_ar: "نقاط البيفوت والمستويات اليومية", name_en: "Pivots / daily levels", styles: ["scalp"],
    rules: "قمة وقاع اليوم السابق، افتتاح اليوم، والبيفوت. السعر يتفاعل عندها كثيراً. تستخدم كأهداف وكمناطق رفض أو كسر." },

  // ---------- sessions / time (gold-specific, includes the user's tested ORB rules)
  { id: "orb_europe", family: "sessions", name_ar: "كسر صندوق أوروبا (ORB)", name_en: "Europe opening range breakout", styles: ["scalp"],
    rules: "صندوق 08:00–08:30 بتوقيت بغداد. دخول عند لمس حد الصندوق بعد إغلاق 5 دقائق داخله. ستوب 0.3×ATR يومي. هدف 2×ATR. مختبرة على 7 سنين ذهب. لها أولوية إذا الشارت بهذا الوقت." },
  { id: "orb_asia", family: "sessions", name_ar: "كسر صندوق 02:30", name_en: "02:30 box breakout", styles: ["scalp"],
    rules: "صندوق 02:30–02:45 بتوقيت بغداد. دخول عند لمس حد الصندوق. ستوب 10$ وتريلنگ على مسافة 2R. مختبرة." },
  { id: "asian_range", family: "sessions", name_ar: "نطاق آسيا وكسره بلندن", name_en: "Asian range → London breakout", styles: ["scalp"],
    rules: "نطاق جلسة آسيا. بداية لندن غالباً تكسر طرف أو تسحب سيولته ثم ترجع. كسر حقيقي = استمرار، سحب سيولة = انعكاس." },
  { id: "ny_open", family: "sessions", name_ar: "افتتاح نيويورك والأخبار", name_en: "New York open / news", styles: ["scalp"],
    rules: "حركة قوية بأول 15–30 دقيقة من نيويورك وبوقت الأخبار الأمريكية. تجنّب الدخول قبل الخبر مباشرة. بعد الخبر: انتظر إغلاق شمعة 5–15 دقيقة." },

  // ---------- market structure / multi-timeframe
  { id: "mtf_alignment", family: "structure", name_ar: "توافق الفريمات", name_en: "Multi-timeframe alignment", styles: ["scalp", "swing"],
    rules: "اتجاه الفريم الكبير يحدد الجهة، والصغير يحدد الدخول. صفقة ضد الفريم الكبير = ثقة أقل. إذا الصورة فريم واحد، استنتج الاتجاه الكبير من آخر موجات واضحة فقط." },
  { id: "wyckoff", family: "structure", name_ar: "وايكوف (تجميع/تصريف)", name_en: "Wyckoff accumulation/distribution", styles: ["swing"],
    rules: "نطاق طويل بعد ترند، ثم كسر كاذب (Spring/Upthrust) ثم خروج بالاتجاه المعاكس. دخول بعد تأكيد الخروج. نادرة؛ لا تفرضها." },
];

export const STRATEGY_IDS = STRATEGIES.map((s) => s.id);
export const strategyName = (id: string) => STRATEGIES.find((s) => s.id === id)?.name_ar ?? id;

/** Compact playbook text for the prompt (filtered by style, optionally one forced strategy). */
export function playbook(style: "scalp" | "swing", only?: string) {
  const list = STRATEGIES.filter((s) => (only ? s.id === only : s.styles.includes(style) || s.family === "structure"));
  return list.map((s) => `- [${s.id}] ${s.name_ar}: ${s.rules}`).join("\n");
}
