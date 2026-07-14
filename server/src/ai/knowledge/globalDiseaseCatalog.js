function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const crops = [
  { en: 'Tomato', ar: 'الطماطم' },
  { en: 'Potato', ar: 'البطاطا' },
  { en: 'Pepper', ar: 'الفلفل' },
  { en: 'Cucumber', ar: 'الخيار' },
  { en: 'Eggplant', ar: 'الباذنجان' },
  { en: 'Onion', ar: 'البصل' },
  { en: 'Garlic', ar: 'الثوم' },
  { en: 'Lettuce', ar: 'الخس' },
  { en: 'Carrot', ar: 'الجزر' },
  { en: 'Cabbage', ar: 'الملفوف' },
  { en: 'Cauliflower', ar: 'القرنبيط' },
  { en: 'Broccoli', ar: 'البروكلي' },
  { en: 'Bean', ar: 'الفاصولياء' },
  { en: 'Pea', ar: 'البازلاء' },
  { en: 'Chickpea', ar: 'الحمص' },
  { en: 'Lentil', ar: 'العدس' },
  { en: 'Soybean', ar: 'فول الصويا' },
  { en: 'Corn', ar: 'الذرة' },
  { en: 'Wheat', ar: 'القمح' },
  { en: 'Barley', ar: 'الشعير' },
  { en: 'Rice', ar: 'الأرز' },
  { en: 'Sorghum', ar: 'الذرة الرفيعة' },
  { en: 'Sunflower', ar: 'دوار الشمس' },
  { en: 'Peanut', ar: 'الفول السوداني' },
  { en: 'Cotton', ar: 'القطن' },
  { en: 'Grape', ar: 'العنب' },
  { en: 'Strawberry', ar: 'الفراولة' },
  { en: 'Blueberry', ar: 'التوت الأزرق' },
  { en: 'Raspberry', ar: 'توت العليق' },
  { en: 'Apple', ar: 'التفاح' },
  { en: 'Pear', ar: 'الإجاص' },
  { en: 'Peach', ar: 'الخوخ' },
  { en: 'Plum', ar: 'البرقوق' },
  { en: 'Cherry', ar: 'الكرز' },
  { en: 'Citrus', ar: 'الحمضيات' },
  { en: 'Orange', ar: 'البرتقال' },
  { en: 'Lemon', ar: 'الليمون' },
  { en: 'Olive', ar: 'الزيتون' },
  { en: 'Banana', ar: 'الموز' },
  { en: 'Coffee', ar: 'القهوة' },
  { en: 'Cocoa', ar: 'الكاكاو' },
  { en: 'Date Palm', ar: 'نخيل التمر' },
  { en: 'Avocado', ar: 'الأفوكادو' },
  { en: 'Mango', ar: 'المانجو' },
  { en: 'Papaya', ar: 'البابايا' },
  { en: 'Guava', ar: 'الجوافة' },
  { en: 'Pomegranate', ar: 'الرمان' },
  { en: 'Fig', ar: 'التين' },
  { en: 'Watermelon', ar: 'البطيخ' },
  { en: 'Melon', ar: 'الشمام' },
  { en: 'Pumpkin', ar: 'اليقطين' },
  { en: 'Zucchini', ar: 'الكوسا' },
  { en: 'Cassava', ar: 'الكسافا' },
  { en: 'Sweet Potato', ar: 'البطاطا الحلوة' },
  { en: 'Sugarcane', ar: 'قصب السكر' },
  { en: 'Alfalfa', ar: 'البرسيم' },
  { en: 'Canola', ar: 'الكانولا' },
  { en: 'Mustard', ar: 'الخردل' },
  { en: 'Sesame', ar: 'السمسم' },
  { en: 'Tea', ar: 'الشاي' },
  { en: 'Tobacco', ar: 'التبغ' },
  { en: 'Quinoa', ar: 'الكينوا' },
];

const diseaseProfiles = [
  {
    name: 'Powdery Mildew',
    aliases: ['powdery mildew', 'oidium'],
    description: {
      en: 'A fungal disease with white powdery growth that reduces photosynthesis and crop vigor.',
      ar: 'مرض فطري يظهر بنمو أبيض مسحوقي يقلل التمثيل الضوئي وحيوية النبات.',
    },
    treatment: {
      en: 'Remove heavily affected tissues and apply sulfur or bicarbonate-based fungicides according to label guidance.',
      ar: 'أزل الأجزاء شديدة الإصابة واستخدم مبيدات فطرية كبريتية أو بيكربوناتية حسب تعليمات الملصق.',
    },
    prevention: {
      en: 'Improve airflow, avoid dense canopies, and use preventive programs in high-risk conditions.',
      ar: 'حسّن التهوية وتجنب الكثافة النباتية واعتمد برامج وقائية عند ارتفاع خطر الإصابة.',
    },
    recommendedProducts: ['Sulfur fungicide', 'Potassium bicarbonate', 'Bacillus subtilis bio-fungicide'],
  },
  {
    name: 'Downy Mildew',
    aliases: ['downy mildew'],
    description: {
      en: 'A fungal-like disease causing chlorotic lesions and gray downy growth under humid conditions.',
      ar: 'مرض شبيه بالفطريات يسبب بقعًا مصفرة ونموًا زغبيًا رماديًا في الظروف الرطبة.',
    },
    treatment: {
      en: 'Apply downy-mildew-specific fungicides with active ingredient rotation and remove infected foliage quickly.',
      ar: 'استخدم مبيدات مخصصة للبياض الزغبي مع تدوير المواد الفعالة وأزل الأوراق المصابة بسرعة.',
    },
    prevention: {
      en: 'Reduce leaf wetness duration, use drip irrigation, and maintain good canopy ventilation.',
      ar: 'قلل مدة ابتلال الأوراق واستخدم الري بالتنقيط وحافظ على تهوية جيدة للمجموع الخضري.',
    },
    recommendedProducts: ['Copper hydroxide', 'Metalaxyl + mancozeb', 'Phosphite fungicide'],
  },
  {
    name: 'Leaf Spot',
    aliases: ['leaf spot', 'foliar spot'],
    description: {
      en: 'A disease complex causing necrotic spots that reduce green leaf area and productivity.',
      ar: 'مجموعة أمراض تسبب بقعًا نخرية تقلل المساحة الخضراء والإنتاجية.',
    },
    treatment: {
      en: 'Remove heavily affected leaves and apply protectant fungicides based on field scouting.',
      ar: 'أزل الأوراق شديدة الإصابة واستخدم مبيدات وقائية بناءً على المتابعة الحقلية.',
    },
    prevention: {
      en: 'Improve sanitation, manage irrigation splash, and maintain balanced plant nutrition.',
      ar: 'حافظ على النظافة الزراعية وقلل تناثر مياه الري وطبّق تغذية متوازنة.',
    },
    recommendedProducts: ['Mancozeb', 'Chlorothalonil', 'Copper fungicide'],
  },
  {
    name: 'Anthracnose',
    aliases: ['anthracnose'],
    description: {
      en: 'A fungal disease causing dark sunken lesions on leaves, stems, and fruits.',
      ar: 'مرض فطري يسبب آفات داكنة غائرة على الأوراق والسيقان والثمار.',
    },
    treatment: {
      en: 'Prune infected tissues and use labeled fungicide rotations to manage disease pressure.',
      ar: 'أزل الأنسجة المصابة واستخدم تدويرًا لمبيدات معتمدة للسيطرة على ضغط المرض.',
    },
    prevention: {
      en: 'Avoid prolonged humidity, improve airflow, and remove infected residues after harvest.',
      ar: 'تجنب الرطوبة الممتدة وحسّن التهوية وتخلص من المخلفات المصابة بعد الحصاد.',
    },
    recommendedProducts: ['Copper fungicide', 'Mancozeb', 'Azoxystrobin'],
  },
  {
    name: 'Rust',
    aliases: ['rust', 'leaf rust'],
    description: {
      en: 'A fungal disease producing orange to brown pustules and reducing photosynthetic performance.',
      ar: 'مرض فطري يسبب بثرات برتقالية إلى بنية ويقلل كفاءة التمثيل الضوئي.',
    },
    treatment: {
      en: 'Apply rust-active fungicides early at symptom onset and repeat according to pressure and label.',
      ar: 'استخدم مبيدات فعالة ضد الصدأ مبكرًا عند ظهور الأعراض وكرر حسب شدة المرض وتعليمات الملصق.',
    },
    prevention: {
      en: 'Use resistant cultivars and avoid excessive vegetative growth through balanced fertilization.',
      ar: 'استخدم أصنافًا مقاومة وتجنب النمو الخضري المفرط عبر تسميد متوازن.',
    },
    recommendedProducts: ['Propiconazole', 'Azoxystrobin', 'Triazole + strobilurin mix'],
  },
  {
    name: 'Early Blight',
    aliases: ['early blight', 'alternaria blight'],
    description: {
      en: 'A fungal disease with concentric lesions, often starting on older foliage.',
      ar: 'مرض فطري ببقع حلقية غالبًا يبدأ على الأوراق الأكبر عمرًا.',
    },
    treatment: {
      en: 'Remove lower infected foliage and apply protectant fungicides at regular intervals.',
      ar: 'أزل الأوراق السفلية المصابة واستخدم مبيدات وقائية على فترات منتظمة.',
    },
    prevention: {
      en: 'Rotate crops, avoid overhead irrigation, and keep canopy dry and open.',
      ar: 'اتبع الدورة الزراعية وتجنب الري بالرش وحافظ على جفاف وتهوية المجموع الخضري.',
    },
    recommendedProducts: ['Chlorothalonil', 'Mancozeb', 'Bacillus subtilis'],
  },
  {
    name: 'Late Blight',
    aliases: ['late blight', 'phytophthora blight'],
    description: {
      en: 'A rapidly destructive disease under cool wet weather causing water-soaked lesions and collapse.',
      ar: 'مرض مدمر سريع الانتشار في الطقس البارد الرطب يسبب آفات مائية وانهيار الأنسجة.',
    },
    treatment: {
      en: 'Use anti-oomycete fungicides promptly and remove severe infection sources to limit spread.',
      ar: 'استخدم مبيدات موجهة للأوميستات بسرعة وأزل مصادر الإصابة الشديدة للحد من الانتشار.',
    },
    prevention: {
      en: 'Use healthy planting material and weather-based preventive fungicide scheduling.',
      ar: 'استخدم مواد زراعة سليمة واعتمد جدولة وقائية للمبيدات بناءً على الطقس.',
    },
    recommendedProducts: ['Cymoxanil + mancozeb', 'Copper fungicide', 'Zoxamide'],
  },
  {
    name: 'Bacterial Spot',
    aliases: ['bacterial spot'],
    description: {
      en: 'A bacterial disease causing small dark lesions on leaves and fruits with splash-mediated spread.',
      ar: 'مرض بكتيري يسبب آفات داكنة صغيرة على الأوراق والثمار وينتشر عبر تناثر الماء.',
    },
    treatment: {
      en: 'Apply copper-based bactericides and remove heavily infected tissues under dry conditions.',
      ar: 'استخدم مبيدات بكتيرية نحاسية وأزل الأجزاء شديدة الإصابة في ظروف جافة.',
    },
    prevention: {
      en: 'Use clean seedling material, sanitize tools, and avoid handling plants when wet.',
      ar: 'استخدم شتلات سليمة وطهّر الأدوات وتجنب التعامل مع النباتات عندما تكون مبللة.',
    },
    recommendedProducts: ['Copper hydroxide', 'Mancozeb partner', 'Tool disinfectant'],
  },
  {
    name: 'Bacterial Blight',
    aliases: ['bacterial blight'],
    description: {
      en: 'A bacterial disease complex causing tissue blight, wilting, and productivity decline.',
      ar: 'مجموعة أمراض بكتيرية تسبب لفحات وذبولًا وتراجعًا في الإنتاجية.',
    },
    treatment: {
      en: 'Remove severe infection sources and apply approved bactericides where locally recommended.',
      ar: 'أزل مصادر الإصابة الشديدة واستخدم مبيدات بكتيرية معتمدة حسب التوصيات المحلية.',
    },
    prevention: {
      en: 'Use clean seed, rotate crops, and prevent mechanical spread through contaminated tools and water.',
      ar: 'استخدم بذورًا سليمة وطبق دورة زراعية وامنع الانتشار الميكانيكي عبر الأدوات والمياه الملوثة.',
    },
    recommendedProducts: ['Copper bactericide', 'Biological Bacillus product', 'Plant defense inducer'],
  },
  {
    name: 'Fusarium Wilt',
    aliases: ['fusarium wilt'],
    description: {
      en: 'A soil-borne vascular disease causing yellowing, wilting, and eventual collapse in susceptible crops.',
      ar: 'مرض وعائي من التربة يسبب اصفرارًا وذبولًا ثم انهيار النبات في المحاصيل الحساسة.',
    },
    treatment: {
      en: 'Rogue severe plants and improve soil/root health using biological amendments and drainage correction.',
      ar: 'أزل النباتات شديدة الإصابة وحسّن صحة التربة والجذور باستخدام إضافات حيوية وتصحيح الصرف.',
    },
    prevention: {
      en: 'Use resistant varieties/rootstocks and long rotations with non-host crops.',
      ar: 'استخدم أصنافًا/أصولًا مقاومة وطبق دورات زراعية طويلة بمحاصيل غير عائلة.',
    },
    recommendedProducts: ['Trichoderma inoculant', 'Potassium phosphite', 'Humic substances'],
  },
  {
    name: 'Verticillium Wilt',
    aliases: ['verticillium wilt'],
    description: {
      en: 'A soil-borne vascular wilt causing gradual chlorosis and branch or plant decline.',
      ar: 'ذبول وعائي من التربة يسبب اصفرارًا تدريجيًا وتدهور الأفرع أو النبات.',
    },
    treatment: {
      en: 'Remove heavily affected plants and reduce stress by optimizing irrigation and soil aeration.',
      ar: 'أزل النباتات شديدة الإصابة وقلل الإجهاد بتحسين الري وتهوية التربة.',
    },
    prevention: {
      en: 'Use tolerant varieties and avoid repeated planting of susceptible hosts in infested soils.',
      ar: 'استخدم أصنافًا متحملة وتجنب تكرار زراعة العوائل الحساسة في الترب الموبوءة.',
    },
    recommendedProducts: ['Trichoderma product', 'Compost amendment', 'Seaweed biostimulant'],
  },
  {
    name: 'Root Rot',
    aliases: ['root rot', 'damping off'],
    description: {
      en: 'A root-zone disease associated with poor drainage and overwatering, causing root decay and stunting.',
      ar: 'مرض منطقة الجذور يرتبط بسوء الصرف وزيادة الري ويسبب تعفن الجذور وتقزم النبات.',
    },
    treatment: {
      en: 'Correct irrigation, improve drainage, and apply labeled root-zone products targeting causal organisms.',
      ar: 'صحح برنامج الري وحسن الصرف واستخدم منتجات معتمدة لمنطقة الجذور ضد المسبب المرضي.',
    },
    prevention: {
      en: 'Avoid waterlogging, sanitize containers/tools, and use healthy propagation media.',
      ar: 'تجنب تغدق التربة وطهّر الحاويات/الأدوات واستخدم أوساط إكثار سليمة.',
    },
    recommendedProducts: ['Phosphonate', 'Trichoderma drench', 'Soil conditioner'],
  },
  {
    name: 'Scab',
    aliases: ['scab'],
    description: {
      en: 'A disease causing corky or scabby lesions on fruits, tubers, or leaves depending on the crop.',
      ar: 'مرض يسبب آفات فلينية/جربية على الثمار أو الدرنات أو الأوراق حسب المحصول.',
    },
    treatment: {
      en: 'Use crop-specific fungicide programs and remove highly affected plant material where practical.',
      ar: 'استخدم برامج مبيدات خاصة بالمحصول وأزل الأجزاء شديدة الإصابة عند الإمكان.',
    },
    prevention: {
      en: 'Use tolerant varieties and optimize irrigation and pH/soil management by crop requirements.',
      ar: 'استخدم أصنافًا متحملة وحسن إدارة الري ودرجة حموضة التربة وفق متطلبات المحصول.',
    },
    recommendedProducts: ['Captan', 'Mancozeb', 'Copper fungicide'],
  },
  {
    name: 'Black Rot',
    aliases: ['black rot'],
    description: {
      en: 'A fungal disease causing dark fruit rot and necrotic foliar lesions with quality losses.',
      ar: 'مرض فطري يسبب تعفنًا داكنًا للثمار وبقعًا نخرية على الأوراق مع خسائر في الجودة.',
    },
    treatment: {
      en: 'Remove infected fruits/shoots and apply fungicide rotations to suppress new infection cycles.',
      ar: 'أزل الثمار/الأفرع المصابة واستخدم تدويرًا للمبيدات لكبح دورات العدوى الجديدة.',
    },
    prevention: {
      en: 'Enhance orchard/field sanitation and reduce canopy humidity through pruning and spacing.',
      ar: 'حسن نظافة الحقل/البستان وخفّض رطوبة المجموع الخضري عبر التقليم والتباعد.',
    },
    recommendedProducts: ['Mancozeb', 'Myclobutanil', 'Copper fungicide'],
  },
  {
    name: 'Mosaic Virus',
    aliases: ['mosaic virus'],
    description: {
      en: 'A viral disease causing mosaic mottling, deformities, and growth suppression.',
      ar: 'مرض فيروسي يسبب تبقعًا فسيفسائيًا وتشوهات وتثبيطًا في النمو.',
    },
    treatment: {
      en: 'No curative treatment; remove infected plants and manage vectors and contamination sources quickly.',
      ar: 'لا يوجد علاج شافٍ؛ أزل النباتات المصابة وأدر النواقل ومصادر التلوث بسرعة.',
    },
    prevention: {
      en: 'Use virus-free planting material and strict hygiene with vector management programs.',
      ar: 'استخدم مواد زراعة خالية من الفيروس والتزم بنظافة صارمة مع برامج مكافحة النواقل.',
    },
    recommendedProducts: ['Yellow sticky traps', 'Mineral oil spray', 'Insecticidal soap'],
  },
  {
    name: 'Leaf Curl Virus',
    aliases: ['leaf curl virus', 'yellow leaf curl virus'],
    description: {
      en: 'A vector-borne viral disease causing leaf curling, chlorosis, and severe yield reduction.',
      ar: 'مرض فيروسي منقول بالنواقل يسبب التفاف الأوراق والاصفرار وانخفاضًا شديدًا في المحصول.',
    },
    treatment: {
      en: 'Rogue infected plants and intensify vector control using integrated physical and chemical approaches.',
      ar: 'أزل النباتات المصابة وشدد مكافحة النواقل بدمج الوسائل الفيزيائية والكيميائية.',
    },
    prevention: {
      en: 'Use tolerant varieties, insect-proof nurseries, and reflective mulches where suitable.',
      ar: 'استخدم أصنافًا متحملة ومشاتل محمية من الحشرات وملشًا عاكسًا عند الملاءمة.',
    },
    recommendedProducts: ['Reflective mulch', 'Insect net', 'Vector-target insecticide'],
  },
  {
    name: 'Canker',
    aliases: ['canker'],
    description: {
      en: 'A disease syndrome causing corky/necrotic lesions on stems, branches, leaves, or fruits.',
      ar: 'متلازمة مرضية تسبب آفات فلينية/نخرية على السيقان أو الأفرع أو الأوراق أو الثمار.',
    },
    treatment: {
      en: 'Prune infected tissues with clean cuts and protect wounds; apply suitable bactericide/fungicide per diagnosis.',
      ar: 'اقلم الأجزاء المصابة بقطع نظيفة واحمِ الجروح واستخدم مبيدًا مناسبًا (بكتيري/فطري) حسب التشخيص.',
    },
    prevention: {
      en: 'Use clean nursery material and strict tool sanitation while avoiding movement of infected tissues.',
      ar: 'استخدم شتلات سليمة مع نظافة صارمة للأدوات وتجنب نقل الأنسجة المصابة.',
    },
    recommendedProducts: ['Copper-based protectant', 'Pruning wound sealant', 'Sanitation disinfectant'],
  },
  {
    name: 'Fire Blight',
    aliases: ['fire blight'],
    description: {
      en: 'A bacterial pome fruit disease causing blossom and shoot blight with scorched appearance.',
      ar: 'مرض بكتيري في التفاحيات يسبب لفحة الأزهار والأفرع بمظهر احتراق مميز.',
    },
    treatment: {
      en: 'Prune infected shoots below symptom margins and disinfect tools between cuts.',
      ar: 'اقلم الأفرع المصابة أسفل حدود الأعراض وطهّر الأدوات بين كل عملية قطع.',
    },
    prevention: {
      en: 'Manage tree vigor and use bloom-risk forecasting with preventive bloom protection where recommended.',
      ar: 'أدر حيوية الأشجار واستخدم توقعات خطر الإزهار مع الحماية الوقائية عند التوصية.',
    },
    recommendedProducts: ['Copper bactericide', 'Biological bloom protectant', 'Disinfectant'],
  },
  {
    name: 'Rice Blast',
    aliases: ['rice blast', 'blast'],
    description: {
      en: 'A major cereal disease causing characteristic lesions and panicle damage with yield losses.',
      ar: 'مرض رئيسي في الحبوب يسبب آفات مميزة وأضرارًا في السنابل مع خسائر محصول.',
    },
    treatment: {
      en: 'Apply blast-specific fungicides at the correct growth stages and avoid late excessive nitrogen.',
      ar: 'استخدم مبيدات متخصصة للّفحة في المراحل الصحيحة وتجنب النيتروجين الزائد المتأخر.',
    },
    prevention: {
      en: 'Use resistant cultivars and balanced nutrition with careful water management.',
      ar: 'استخدم أصنافًا مقاومة وتغذية متوازنة مع إدارة دقيقة للمياه.',
    },
    recommendedProducts: ['Tricyclazole', 'Azoxystrobin', 'Balanced NPK program'],
  },
  {
    name: 'Sheath Blight',
    aliases: ['sheath blight'],
    description: {
      en: 'A disease causing sheath lesions and canopy spread in humid dense crop stands.',
      ar: 'مرض يسبب آفات على الأغمدة وينتشر في المجموع الخضري الكثيف عالي الرطوبة.',
    },
    treatment: {
      en: 'Treat at first lesion appearance with effective fungicides and maintain canopy aeration.',
      ar: 'ابدأ العلاج عند أول ظهور للآفات بمبيدات فعالة مع الحفاظ على تهوية المجموع الخضري.',
    },
    prevention: {
      en: 'Avoid excessive nitrogen and optimize spacing/irrigation to reduce humidity build-up.',
      ar: 'تجنب الإفراط في النيتروجين وحسن التباعد والري لتقليل تراكم الرطوبة.',
    },
    recommendedProducts: ['Validamycin', 'Azoxystrobin', 'Nitrogen management tools'],
  },
  {
    name: 'Healthy Plant',
    aliases: ['healthy'],
    description: {
      en: 'No clear severe disease indicators are visible; crop appears generally healthy.',
      ar: 'لا تظهر مؤشرات واضحة على إصابة مرضية شديدة؛ يبدو المحصول سليمًا بشكل عام.',
    },
    treatment: {
      en: 'No curative treatment is needed. Continue best-practice irrigation, nutrition, and scouting.',
      ar: 'لا يلزم علاج مرضي حاليًا. استمر في أفضل ممارسات الري والتغذية والمتابعة الدورية.',
    },
    prevention: {
      en: 'Maintain preventive scouting and sanitation to keep disease pressure low.',
      ar: 'حافظ على المتابعة الوقائية والنظافة الزراعية لإبقاء الضغط المرضي منخفضًا.',
    },
    recommendedProducts: ['Balanced NPK fertilizer', 'Micronutrient foliar spray', 'Seaweed biostimulant'],
  },
];

const pathogenTypeByDisease = {
  'Powdery Mildew': 'fungal',
  'Downy Mildew': 'oomycete',
  'Leaf Spot': 'fungal',
  Anthracnose: 'fungal',
  Rust: 'fungal',
  'Early Blight': 'fungal',
  'Late Blight': 'oomycete',
  'Bacterial Spot': 'bacterial',
  'Bacterial Blight': 'bacterial',
  'Fusarium Wilt': 'fungal',
  'Verticillium Wilt': 'fungal',
  'Root Rot': 'complex',
  Scab: 'fungal',
  'Black Rot': 'fungal',
  'Mosaic Virus': 'viral',
  'Leaf Curl Virus': 'viral',
  Canker: 'complex',
  'Fire Blight': 'bacterial',
  'Rice Blast': 'fungal',
  'Sheath Blight': 'fungal',
  'Healthy Plant': 'healthy',
};

function buildGlobalDiseaseCatalogEntries() {
  const entries = [];
  for (const crop of crops) {
    for (const disease of diseaseProfiles) {
      const canonical = `${crop.en} ${disease.name}`;
      const pathogenType = pathogenTypeByDisease[disease.name] || 'other';
      const aliases = Array.from(
        new Set([
          ...disease.aliases,
          canonical.toLowerCase(),
          `${slug(crop.en)}___${slug(disease.name)}`,
          `${slug(crop.en)}_${slug(disease.name)}`,
        ])
      );

      entries.push({
        canonical,
        aliases,
        description: {
          en: `${disease.description.en} In ${crop.en}, monitor symptoms across key growth stages and confirm with field context.`,
          ar: `${disease.description.ar} في ${crop.ar} يجب متابعة الأعراض عبر المراحل الحرجة للنمو مع التأكيد الحقلي.`,
        },
        treatment: {
          en: `${disease.treatment.en} For ${crop.en}, follow label dose, pre-harvest interval, and rotation rules.`,
          ar: `${disease.treatment.ar} في ${crop.ar} التزم بجرعات الملصق وفترة ما قبل الحصاد وقواعد تدوير المواد الفعالة.`,
        },
        prevention: {
          en: `${disease.prevention.en} For ${crop.en}, integrate scouting, sanitation, and irrigation discipline.`,
          ar: `${disease.prevention.ar} في ${crop.ar} ادمج المتابعة الحقلية والنظافة الزراعية وانضباط الري.`,
        },
        recommendedProducts: disease.recommendedProducts,
        pathogenType,
        categoryTags: [pathogenType, slug(crop.en)],
      });
    }
  }
  return entries;
}

module.exports = { buildGlobalDiseaseCatalogEntries };

