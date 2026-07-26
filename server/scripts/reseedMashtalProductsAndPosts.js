/**
 * FINAL Mashtal Product + Post reseed
 *
 * This script:
 * - keeps all existing users and businesses;
 * - removes old Products and Posts only;
 * - removes Comments/SavedItems that point to the removed Posts;
 * - creates fresh Products and Posts linked to the existing business accounts;
 * - fetches a unique, real photograph for every record from Wikimedia Commons;
 * - stores the final HTTPS image URL directly in MongoDB;
 * - does not need public/uploads or Express static;
 * - checks every selected image URL before inserting the record;
 * - refuses to insert a Product/Post without a working image.
 *
 * Run from backend root:
 *   node scripts/reseedMashtalProductsAndPosts.js
 *
 * Node 18+ is required.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const path = require('path');

const MODEL_DIR = path.resolve(
  process.cwd(),
  process.env.MODEL_DIR || './src/models'
);

const User = require(path.join(MODEL_DIR, 'User'));
const Product = require(path.join(MODEL_DIR, 'Product'));
const Post = require(path.join(MODEL_DIR, 'Post'));

function optionalModel(name) {
  try {
    return require(path.join(MODEL_DIR, name));
  } catch {
    return null;
  }
}

const Comment = optionalModel('Comment');
const SavedItem = optionalModel('SavedItem');
const Review = optionalModel('Review');
const Notification = optionalModel('Notification');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ||
  'MashtalEducationalSeeder/2.0 (agriculture demo platform)';

const REQUEST_DELAY = 250;
const SEARCH_LIMIT = 35;
const MIN_WIDTH = 850;
const MIN_HEIGHT = 520;

const BLOCKED_IMAGE_WORDS = [
  'logo', 'icon', 'diagram', 'drawing', 'illustration', 'painting',
  'map', 'flag', 'coat of arms', 'poster', 'screenshot', 'chart',
  'graph', 'symbol', 'clipart', 'herbarium', 'museum specimen',
  'microscope', 'microscopic', 'black and white', 'monochrome',
  'book', 'document', 'stamp', 'portrait', 'person',
];

const BUSINESS_BLUEPRINTS = [
  {
    match: ['hadi', 'nursury', 'nursery', 'mashtalee', 'mashtal'],
    categories: ['Plants', 'Seedlings', 'Trees'],
  },
  {
    match: ['green cedar', 'nursery'],
    categories: ['Plants', 'Seedlings', 'Trees'],
  },
  {
    match: ['bekaa agro', 'agro supplies'],
    categories: ['Seeds', 'Fertilizers', 'Soil'],
  },
  {
    match: ['irrigation'],
    categories: ['Irrigation', 'Watering Equipment'],
  },
  {
    match: ['farm tools', 'agricultural equipment', 'equipment'],
    categories: ['Tools', 'Equipment'],
  },
  {
    match: ['seeds cooperative', 'akkar seeds'],
    categories: ['Seeds', 'Seedlings'],
  },
  {
    match: ['garden centre', 'garden center'],
    categories: ['Plants', 'Garden Supplies', 'Soil'],
  },
  {
    match: ['organic farms'],
    categories: ['Organic Produce', 'Seeds', 'Compost'],
  },
  {
    match: ['orchard care'],
    categories: ['Orchard Care', 'Crop Protection', 'Tools'],
  },
  {
    match: ['urban garden'],
    categories: ['Urban Gardening', 'Plants', 'Irrigation'],
  },
];

const PRODUCT_CATALOGUE = {
  Plants: [
    {
      name: 'Arbequina Olive Tree',
      description: 'Healthy nursery-grown Arbequina olive tree suitable for Lebanese gardens and small orchards.',
      price: 18,
      stock: 34,
      queries: ['Arbequina olive tree nursery photograph', 'young olive tree pot photograph'],
    },
    {
      name: 'Meyer Lemon Tree',
      description: 'Productive grafted Meyer lemon tree with healthy foliage for sunny Lebanese locations.',
      price: 22,
      stock: 28,
      queries: ['Meyer lemon tree nursery photograph', 'potted lemon tree fruit photograph'],
    },
    {
      name: 'Rosemary Plant',
      description: 'Aromatic rosemary plant for balconies, gardens and culinary use.',
      price: 5,
      stock: 75,
      queries: ['rosemary plant pot photograph', 'fresh rosemary plant nursery'],
    },
    {
      name: 'Lavender Plant',
      description: 'Fragrant lavender plant that attracts pollinators and tolerates dry conditions.',
      price: 6,
      stock: 60,
      queries: ['lavender plant pot photograph', 'lavender nursery plant'],
    },
    {
      name: 'Bougainvillea Plant',
      description: 'Colourful bougainvillea plant suitable for walls, terraces and sunny gardens.',
      price: 14,
      stock: 31,
      queries: ['bougainvillea potted plant photograph', 'bougainvillea nursery'],
    },
    {
      name: 'Basil Plant',
      description: 'Fresh sweet basil plant ready for kitchen gardens and balcony containers.',
      price: 3.5,
      stock: 92,
      queries: ['basil plant pot photograph', 'sweet basil nursery plant'],
    },
  ],
  Seedlings: [
    {
      name: 'Tomato Seedling Tray',
      description: 'Strong tomato seedlings with developed roots, ready for transplanting.',
      price: 7,
      stock: 46,
      queries: ['tomato seedling tray photograph', 'young tomato plants nursery tray'],
    },
    {
      name: 'Cucumber Seedling Tray',
      description: 'Healthy cucumber seedlings prepared for greenhouse or open-field planting.',
      price: 7,
      stock: 39,
      queries: ['cucumber seedlings tray photograph', 'young cucumber plants nursery'],
    },
    {
      name: 'Sweet Pepper Seedling Tray',
      description: 'Uniform sweet pepper seedlings grown for reliable transplant establishment.',
      price: 8,
      stock: 41,
      queries: ['pepper seedlings tray photograph', 'young bell pepper plants nursery'],
    },
    {
      name: 'Lettuce Seedling Tray',
      description: 'Fresh lettuce seedlings for seasonal garden and farm production.',
      price: 6,
      stock: 50,
      queries: ['lettuce seedling tray photograph', 'young lettuce plants nursery'],
    },
  ],
  Trees: [
    {
      name: 'Pomegranate Tree',
      description: 'Young pomegranate fruit tree adapted to Mediterranean growing conditions.',
      price: 19,
      stock: 25,
      queries: ['young pomegranate tree nursery photograph', 'pomegranate tree pot'],
    },
    {
      name: 'Fig Tree',
      description: 'Healthy fig tree suitable for sunny gardens and productive orchards.',
      price: 17,
      stock: 27,
      queries: ['young fig tree nursery photograph', 'potted fig tree'],
    },
  ],
  Seeds: [
    {
      name: 'Roma Tomato Seeds',
      description: 'Quality Roma tomato seeds for productive field and garden cultivation.',
      price: 3,
      stock: 120,
      queries: ['tomato seeds packet photograph', 'Roma tomato seeds packet'],
    },
    {
      name: 'Lebanese Cucumber Seeds',
      description: 'Cucumber seeds selected for crisp fruit and dependable warm-season production.',
      price: 3,
      stock: 110,
      queries: ['cucumber seeds packet photograph', 'cucumber seed packet agriculture'],
    },
    {
      name: 'Sweet Pepper Seeds',
      description: 'Sweet bell pepper seeds for greenhouse and open-field planting.',
      price: 3.5,
      stock: 95,
      queries: ['bell pepper seeds packet photograph', 'pepper seed packet agriculture'],
    },
    {
      name: 'Parsley Seeds',
      description: 'High-germination parsley seeds for home gardens and commercial herb production.',
      price: 2.5,
      stock: 140,
      queries: ['parsley seeds packet photograph', 'parsley seed packet'],
    },
    {
      name: 'Zucchini Seeds',
      description: 'Reliable zucchini seeds for vigorous plants and uniform summer crops.',
      price: 3,
      stock: 100,
      queries: ['zucchini seeds packet photograph', 'courgette seed packet'],
    },
    {
      name: 'Watermelon Seeds',
      description: 'Watermelon seeds selected for vigorous vines and quality summer fruit.',
      price: 4,
      stock: 85,
      queries: ['watermelon seeds packet photograph', 'watermelon seed packet agriculture'],
    },
  ],
  Fertilizers: [
    {
      name: 'Balanced NPK Fertilizer 20-20-20',
      description: 'Water-soluble balanced fertilizer for vegetables, flowers and fruit trees.',
      price: 12,
      stock: 78,
      queries: ['NPK fertilizer bag photograph', 'granular fertilizer package agriculture'],
    },
    {
      name: 'High Potassium Fertilizer',
      description: 'Potassium-rich fertilizer formulated to support flowering and fruit development.',
      price: 14,
      stock: 65,
      queries: ['potassium fertilizer bag photograph', 'agricultural fertilizer package'],
    },
    {
      name: 'Calcium Nitrate Fertilizer',
      description: 'Soluble calcium nitrate for crop nutrition and prevention of calcium deficiency.',
      price: 16,
      stock: 54,
      queries: ['calcium nitrate fertilizer bag photograph', 'fertilizer granules package'],
    },
    {
      name: 'Organic Seaweed Fertilizer',
      description: 'Liquid seaweed fertilizer for root development and plant stress support.',
      price: 11,
      stock: 58,
      queries: ['liquid seaweed fertilizer bottle photograph', 'organic plant fertilizer bottle'],
    },
  ],
  Soil: [
    {
      name: 'Premium Potting Mix 50 L',
      description: 'Professional potting mix for containers, seedlings and indoor plants.',
      price: 9,
      stock: 72,
      queries: ['potting soil bag photograph', 'potting mix package garden'],
    },
    {
      name: 'Coco Peat Block',
      description: 'Compressed coco peat growing medium for nurseries, seedlings and hydroponic mixes.',
      price: 4,
      stock: 105,
      queries: ['coco peat block photograph', 'coconut coir block gardening'],
    },
    {
      name: 'Perlite Growing Medium',
      description: 'Lightweight horticultural perlite for improved aeration and drainage.',
      price: 8,
      stock: 69,
      queries: ['horticultural perlite bag photograph', 'perlite growing medium package'],
    },
  ],
  Irrigation: [
    {
      name: 'Drip Irrigation Starter Kit',
      description: 'Complete drip irrigation starter kit for vegetable gardens and small farms.',
      price: 28,
      stock: 42,
      queries: ['drip irrigation kit product photograph', 'drip irrigation equipment kit'],
    },
    {
      name: 'Adjustable Dripper Pack',
      description: 'Adjustable irrigation drippers for precise water delivery to individual plants.',
      price: 6,
      stock: 130,
      queries: ['irrigation dripper pack photograph', 'adjustable drip emitter product'],
    },
    {
      name: '16 mm Drip Irrigation Pipe',
      description: 'Durable 16 mm polyethylene irrigation pipe for farm and garden drip systems.',
      price: 20,
      stock: 55,
      queries: ['drip irrigation pipe coil photograph', 'black irrigation tubing roll'],
    },
    {
      name: 'Irrigation Filter',
      description: 'Reusable irrigation filter that protects drippers from suspended particles.',
      price: 13,
      stock: 48,
      queries: ['irrigation filter product photograph', 'drip irrigation screen filter'],
    },
  ],
  'Watering Equipment': [
    {
      name: 'Oscillating Garden Sprinkler',
      description: 'Adjustable oscillating sprinkler for lawns, vegetable beds and garden areas.',
      price: 18,
      stock: 37,
      queries: ['oscillating garden sprinkler product photograph', 'garden sprinkler equipment'],
    },
    {
      name: 'Reinforced Garden Hose 25 m',
      description: 'Flexible reinforced garden hose for everyday watering and cleaning.',
      price: 24,
      stock: 32,
      queries: ['green garden hose coil photograph', 'garden hose product'],
    },
  ],
  Tools: [
    {
      name: 'Professional Pruning Shears',
      description: 'Sharp bypass pruning shears for clean cuts on branches and garden plants.',
      price: 15,
      stock: 44,
      queries: ['professional pruning shears product photograph', 'secateurs garden tool'],
    },
    {
      name: 'Steel Garden Shovel',
      description: 'Durable steel shovel for soil preparation, planting and farm maintenance.',
      price: 19,
      stock: 30,
      queries: ['steel garden shovel product photograph', 'garden spade tool'],
    },
    {
      name: 'Garden Hand Trowel',
      description: 'Comfortable hand trowel for planting, transplanting and container gardening.',
      price: 7,
      stock: 67,
      queries: ['garden hand trowel product photograph', 'planting trowel tool'],
    },
    {
      name: 'Garden Rake',
      description: 'Strong garden rake for levelling soil and collecting plant debris.',
      price: 17,
      stock: 35,
      queries: ['garden rake product photograph', 'metal garden rake tool'],
    },
    {
      name: 'Backpack Pressure Sprayer',
      description: 'Manual backpack sprayer for crop protection and foliar applications.',
      price: 38,
      stock: 21,
      queries: ['backpack agricultural sprayer product photograph', 'manual knapsack sprayer'],
    },
  ],
  Equipment: [
    {
      name: 'Battery Pruning Saw',
      description: 'Compact battery pruning saw for orchard branches and garden maintenance.',
      price: 85,
      stock: 14,
      queries: ['battery pruning saw product photograph', 'cordless pruning saw garden'],
    },
    {
      name: 'Electric Hedge Trimmer',
      description: 'Electric hedge trimmer for shaping garden shrubs and maintaining green areas.',
      price: 72,
      stock: 18,
      queries: ['electric hedge trimmer product photograph', 'hedge trimmer garden tool'],
    },
  ],
  'Garden Supplies': [
    {
      name: 'Rectangular Balcony Planter',
      description: 'Durable rectangular planter suitable for herbs, flowers and balcony vegetables.',
      price: 10,
      stock: 61,
      queries: ['rectangular balcony planter product photograph', 'window box planter'],
    },
    {
      name: 'Plant Support Stakes',
      description: 'Reusable support stakes for tomatoes, climbing plants and young trees.',
      price: 5,
      stock: 100,
      queries: ['plant support stakes product photograph', 'garden plant stakes'],
    },
  ],
  'Organic Produce': [
    {
      name: 'Organic Tomato Box',
      description: 'Fresh locally grown organic tomatoes packed for household use.',
      price: 8,
      stock: 38,
      queries: ['fresh organic tomatoes box photograph', 'tomatoes crate farm produce'],
    },
    {
      name: 'Organic Cucumber Box',
      description: 'Fresh crisp organic cucumbers harvested from Lebanese farms.',
      price: 7,
      stock: 35,
      queries: ['fresh cucumbers box photograph', 'cucumber crate farm produce'],
    },
    {
      name: 'Seasonal Herb Bundle',
      description: 'Fresh seasonal culinary herbs harvested and prepared as a mixed bundle.',
      price: 5,
      stock: 45,
      queries: ['fresh herb bundle photograph', 'mixed culinary herbs market'],
    },
  ],
  Compost: [
    {
      name: 'Organic Compost 25 kg',
      description: 'Mature organic compost for improving soil structure and nutrient availability.',
      price: 10,
      stock: 63,
      queries: ['organic compost bag photograph', 'compost soil package garden'],
    },
    {
      name: 'Vermicompost 10 kg',
      description: 'Nutrient-rich worm compost for seedlings, vegetables and potted plants.',
      price: 9,
      stock: 52,
      queries: ['vermicompost bag photograph', 'worm compost package'],
    },
  ],
  'Orchard Care': [
    {
      name: 'Tree Trunk Protection Paint',
      description: 'Protective white coating for fruit tree trunks exposed to sun and temperature stress.',
      price: 13,
      stock: 43,
      queries: ['tree trunk white paint orchard photograph', 'whitewashed fruit tree trunks'],
    },
    {
      name: 'Orchard Grafting Tape',
      description: 'Flexible grafting tape for fruit tree grafting and nursery propagation.',
      price: 6,
      stock: 88,
      queries: ['grafting tape product photograph', 'plant grafting tape roll'],
    },
  ],
  'Crop Protection': [
    {
      name: 'Yellow Sticky Trap Pack',
      description: 'Yellow sticky traps for monitoring and reducing flying greenhouse pests.',
      price: 7,
      stock: 90,
      queries: ['yellow sticky insect traps product photograph', 'greenhouse sticky traps'],
    },
    {
      name: 'Copper Fungicide',
      description: 'Copper-based crop protection product for preventive fungal disease programmes.',
      price: 15,
      stock: 49,
      queries: ['copper fungicide package photograph', 'agricultural fungicide bottle'],
    },
    {
      name: 'Neem Oil Plant Spray',
      description: 'Neem-based plant spray for integrated garden and crop protection.',
      price: 12,
      stock: 56,
      queries: ['neem oil plant spray bottle photograph', 'neem pesticide product'],
    },
  ],
  'Urban Gardening': [
    {
      name: 'Balcony Vegetable Growing Kit',
      description: 'Compact vegetable growing kit with containers and basic supplies for balconies.',
      price: 26,
      stock: 29,
      queries: ['balcony vegetable garden kit photograph', 'urban gardening planter kit'],
    },
    {
      name: 'Vertical Garden Pocket Planter',
      description: 'Vertical pocket planter for herbs and decorative plants in limited spaces.',
      price: 21,
      stock: 34,
      queries: ['vertical garden pocket planter photograph', 'wall pocket planter product'],
    },
  ],
};

const POST_CATALOGUE = [
  {
    title: 'How to Irrigate Olive Trees During the Dry Season',
    content: 'Olive trees tolerate drought, but controlled irrigation during fruit development can improve fruit size and reduce severe stress. Water deeply around the active root zone, avoid constantly wet soil, and adjust irrigation according to tree age, soil texture and weather conditions.',
    tags: ['olive', 'irrigation', 'orchard'],
    queries: ['olive orchard drip irrigation photograph', 'irrigating olive trees farm photograph'],
  },
  {
    title: 'Recognising Early Blight Symptoms on Tomato Plants',
    content: 'Early blight commonly appears as expanding brown leaf spots with ring-like patterns, beginning on older tomato leaves. Remove heavily affected leaves, improve airflow, avoid wetting foliage late in the day and follow an appropriate crop-protection programme.',
    tags: ['tomato', 'plant disease', 'crop protection'],
    queries: ['tomato early blight leaf photograph', 'tomato leaf fungal disease photograph'],
  },
  {
    title: 'Preparing Healthy Soil Before Planting Vegetables',
    content: 'Successful vegetable production starts with well-drained soil rich in organic matter. Break compacted layers, mix mature compost into the upper soil, remove perennial weeds and avoid planting when the soil is excessively wet.',
    tags: ['soil', 'compost', 'vegetables'],
    queries: ['farmer preparing vegetable soil photograph', 'compost vegetable garden soil photograph'],
  },
  {
    title: 'Why Drip Irrigation Saves Water',
    content: 'Drip irrigation applies water close to plant roots at a controlled rate. It reduces evaporation and wet foliage, supports consistent soil moisture and can make fertigation more efficient when the system is correctly filtered and maintained.',
    tags: ['drip irrigation', 'water saving', 'farming'],
    queries: ['drip irrigation vegetable field photograph', 'farm drip irrigation close up photograph'],
  },
  {
    title: 'Choosing Strong Tomato Seedlings',
    content: 'Select tomato seedlings with compact growth, green leaves, a sturdy stem and a healthy root system. Avoid weak, stretched or heavily root-bound seedlings. Harden plants gradually before moving them to full outdoor conditions.',
    tags: ['tomato', 'seedlings', 'nursery'],
    queries: ['healthy tomato seedlings nursery photograph', 'tomato seedling tray photograph'],
  },
  {
    title: 'The Correct Way to Use Pruning Shears',
    content: 'Clean and sharp pruning shears make smoother cuts and reduce unnecessary plant injury. Disinfect the blades between diseased plants, cut at the correct angle and avoid forcing small shears through branches that are too thick.',
    tags: ['pruning', 'tools', 'plant care'],
    queries: ['pruning shears cutting branch photograph', 'gardener pruning plant close up'],
  },
  {
    title: 'Improving Greenhouse Ventilation in Summer',
    content: 'High greenhouse temperatures reduce pollination and increase plant stress. Open side and roof vents early, use circulation fans where appropriate and keep vents clear. Shade materials can also help during periods of intense heat.',
    tags: ['greenhouse', 'ventilation', 'summer'],
    queries: ['greenhouse ventilation open vents photograph', 'modern greenhouse crops interior photograph'],
  },
  {
    title: 'When and How to Apply Compost',
    content: 'Mature compost can be incorporated before planting or applied as a surface layer around established plants. Keep compost away from direct contact with young stems and avoid using unfinished material that continues to heat or has a strong smell.',
    tags: ['compost', 'soil health', 'organic farming'],
    queries: ['applying compost garden photograph', 'mature compost soil agriculture photograph'],
  },
  {
    title: 'Protecting Citrus Trees from Water Stress',
    content: 'Citrus trees require regular moisture during flowering and fruit enlargement. Apply water deeply, check soil moisture below the surface and use organic mulch while keeping it away from the trunk.',
    tags: ['citrus', 'irrigation', 'fruit trees'],
    queries: ['citrus orchard irrigation photograph', 'lemon tree watering farm photograph'],
  },
  {
    title: 'Mulching Fruit Trees Correctly',
    content: 'Mulch helps reduce evaporation, control weeds and protect soil structure. Spread it over the root zone but leave a clear space around the trunk to reduce moisture-related bark problems.',
    tags: ['mulch', 'orchard', 'soil'],
    queries: ['mulch around fruit tree photograph', 'orchard organic mulch photograph'],
  },
  {
    title: 'Using Yellow Sticky Traps in Greenhouses',
    content: 'Yellow sticky traps help monitor whiteflies, aphids and other flying pests. Place traps slightly above the crop canopy and inspect them regularly. They are a monitoring tool and should be combined with wider integrated pest management.',
    tags: ['pest monitoring', 'greenhouse', 'sticky traps'],
    queries: ['yellow sticky traps greenhouse photograph', 'insect sticky trap among plants'],
  },
  {
    title: 'How to Prevent Blossom-End Rot in Tomatoes',
    content: 'Blossom-end rot is linked to inadequate calcium reaching developing tomato fruit, often because soil moisture changes sharply. Keep irrigation consistent, protect roots and avoid excessive fertiliser application.',
    tags: ['tomato', 'calcium', 'irrigation'],
    queries: ['tomato blossom end rot photograph', 'blossom end rot tomato fruit'],
  },
  {
    title: 'Simple Balcony Herb Garden Setup',
    content: 'Use containers with drainage holes, a quality growing medium and a sunny location for basil, parsley, mint and rosemary. Group plants with similar watering needs and harvest regularly to encourage new growth.',
    tags: ['urban gardening', 'herbs', 'balcony'],
    queries: ['balcony herb garden photograph', 'herbs in pots balcony photograph'],
  },
  {
    title: 'Seed Storage for Better Germination',
    content: 'Store seeds in a cool, dry and dark location. Keep packets sealed and clearly labelled with the crop and date. Moisture and high temperature can quickly reduce germination quality.',
    tags: ['seeds', 'storage', 'germination'],
    queries: ['vegetable seed packets storage photograph', 'agricultural seeds packets photograph'],
  },
  {
    title: 'Checking Drip Irrigation Emitters',
    content: 'Inspect emitters regularly for uneven flow, leaks and clogging. Clean filters, flush the lateral lines and replace damaged emitters before crop stress becomes visible.',
    tags: ['drip irrigation', 'maintenance', 'water'],
    queries: ['drip irrigation emitter close up photograph', 'checking drip irrigation farm'],
  },
  {
    title: 'Harvesting Fresh Herbs Without Damaging Plants',
    content: 'Harvest herbs using clean scissors and remove only part of the plant at one time. Cutting just above healthy leaf nodes encourages branching and continued production.',
    tags: ['herbs', 'harvest', 'plant care'],
    queries: ['harvesting fresh herbs scissors photograph', 'cutting basil herbs garden'],
  },
  {
    title: 'Why Crop Rotation Matters',
    content: 'Rotating crop families can reduce the build-up of soil-borne diseases and pests. It also helps distribute nutrient demand. Keep simple field records so the same crop family is not repeatedly planted in one bed.',
    tags: ['crop rotation', 'soil', 'vegetables'],
    queries: ['diverse vegetable crop rows farm photograph', 'crop rotation vegetable field photograph'],
  },
  {
    title: 'Preparing Young Trees for Transplanting',
    content: 'Water container-grown trees before transplanting, protect the root ball and prepare a planting hole wider than the root system. Plant at the original soil level and water thoroughly after planting.',
    tags: ['trees', 'transplanting', 'nursery'],
    queries: ['planting young tree photograph', 'transplanting nursery tree photograph'],
  },
  {
    title: 'Safe Fertiliser Application Around Young Plants',
    content: 'Measure fertiliser accurately and avoid placing concentrated material directly against young stems or roots. Apply to moist soil and follow the product rate for the crop and growth stage.',
    tags: ['fertilizer', 'seedlings', 'plant nutrition'],
    queries: ['applying granular fertilizer plants photograph', 'fertilizing vegetable plants photograph'],
  },
  {
    title: 'Managing Humidity Around Cucumber Plants',
    content: 'Excessive humidity and leaf wetness can increase disease pressure on cucumber crops. Improve ventilation, space plants correctly and irrigate early enough for surfaces to dry.',
    tags: ['cucumber', 'humidity', 'greenhouse'],
    queries: ['cucumber plants greenhouse photograph', 'greenhouse cucumber crop photograph'],
  },
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function text(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalise(value) {
  return text(value).toLowerCase();
}

function schemaHas(Model, pathName) {
  return Boolean(Model.schema.path(pathName));
}

function imageUpdateFor(Model, url) {
  const update = {};
  const candidates = ['image', 'images', 'imageUrl', 'photo', 'media', 'coverImage'];

  for (const field of candidates) {
    const schemaPath = Model.schema.path(field);
    if (!schemaPath) continue;
    update[field] = schemaPath.instance === 'Array' ? [url] : url;
  }

  if (!Object.keys(update).length) {
    throw new Error(
      `No image field found in ${Model.modelName}. Fields: ${Object.keys(Model.schema.paths).join(', ')}`
    );
  }

  return update;
}

function fillRequiredPaths(Model, document, context) {
  const result = { ...document };

  for (const [pathName, schemaPath] of Object.entries(Model.schema.paths)) {
    if (
      pathName === '_id' ||
      pathName === '__v' ||
      pathName.includes('.') ||
      result[pathName] !== undefined ||
      !schemaPath.isRequired
    ) {
      continue;
    }

    switch (schemaPath.instance) {
      case 'String':
        result[pathName] = context[pathName] || context.name || context.title || 'Mashtal demo';
        break;
      case 'Number':
        result[pathName] = context[pathName] ?? 0;
        break;
      case 'Boolean':
        result[pathName] = false;
        break;
      case 'Array':
        result[pathName] = [];
        break;
      case 'Date':
        result[pathName] = new Date();
        break;
      case 'ObjectID':
        result[pathName] =
          context[pathName] ||
          context.business ||
          context.author ||
          context.user;
        break;
      default:
        result[pathName] = {};
    }
  }

  return result;
}

function candidateBusinessName(user) {
  return normalise(
    user.businessProfile?.companyName ||
    user.companyName ||
    user.fullName ||
    user.name
  );
}

function categoriesForBusiness(user, index) {
  const name = candidateBusinessName(user);
  const blueprint = BUSINESS_BLUEPRINTS.find(item =>
    item.match.some(term => name.includes(term))
  );

  if (blueprint) return blueprint.categories;

  const fallbacks = [
    ['Plants', 'Seedlings'],
    ['Seeds', 'Fertilizers'],
    ['Irrigation', 'Watering Equipment'],
    ['Tools', 'Equipment'],
    ['Organic Produce', 'Compost'],
    ['Orchard Care', 'Crop Protection'],
  ];

  return fallbacks[index % fallbacks.length];
}

function productItemsForCategories(categories) {
  const output = [];
  const usedNames = new Set();

  for (const category of categories) {
    for (const item of PRODUCT_CATALOGUE[category] || []) {
      if (usedNames.has(item.name)) continue;
      output.push({
        ...item,
        // Keep catalogue label for image search relevance; map for Mongo enum.
        catalogueCategory: category,
        category: mapToProductCategory(category, item.name),
      });
      usedNames.add(item.name);
    }
  }

  return output.slice(0, 6);
}

/** Map human catalogue buckets → Product.schema enum */
function mapToProductCategory(catalogueCategory, productName = '') {
  const n = normalise(`${catalogueCategory} ${productName}`);
  if (n.includes('seed') && !n.includes('seedling')) return 'seeds';
  if (n.includes('fertiliz') || n.includes('soil') || n.includes('compost')) return 'fertilizers';
  if (n.includes('irrigat') || n.includes('water')) return 'irrigation';
  if (n.includes('tool') || n.includes('pruner') || n.includes('hoe') || n.includes('shovel')) return 'tools';
  if (n.includes('equipment') || n.includes('protection') || n.includes('sprayer')) return 'equipment';
  if (n.includes('olive') || n.includes('lemon') || n.includes('tree') || n.includes('orchard') || n.includes('cedar')) return 'trees';
  if (n.includes('medic') || n.includes('pesticide') || n.includes('fungicide')) return 'medicament';
  if (
    n.includes('plant') ||
    n.includes('seedling') ||
    n.includes('organic') ||
    n.includes('garden') ||
    n.includes('urban') ||
    n.includes('herb') ||
    n.includes('flower')
  ) {
    return 'plants';
  }
  return 'other';
}

function metadataText(metadata, key) {
  return text(metadata?.[key]?.value);
}

function blocked(candidate) {
  const source = normalise(
    `${candidate.title} ${candidate.description} ${candidate.categories}`
  );

  return BLOCKED_IMAGE_WORDS.some(word => source.includes(word));
}

function words(value) {
  return [...new Set(
    normalise(value)
      .split(/[^a-z0-9]+/)
      .filter(word => word.length > 2)
  )];
}

function scoreCandidate(candidate, relevanceText, usedImages) {
  if (!candidate.url || !candidate.sha1) return -10000;
  if (usedImages.has(candidate.sha1)) return -10000;
  if (blocked(candidate)) return -10000;
  if (!candidate.mime?.startsWith('image/')) return -10000;
  if (candidate.mime === 'image/svg+xml') return -10000;
  if (candidate.width < MIN_WIDTH || candidate.height < MIN_HEIGHT) return -10000;

  const expected = new Set(words(relevanceText));
  const actual = new Set(
    words(`${candidate.title} ${candidate.description} ${candidate.categories}`)
  );

  let score = 0;

  for (const word of expected) {
    if (actual.has(word)) score += 10;
  }

  const ratio = candidate.width / candidate.height;
  if (ratio >= 1.15 && ratio <= 2.2) score += 8;
  if (candidate.width >= 1200) score += 5;
  if (candidate.height >= 700) score += 4;

  const description = normalise(candidate.description);
  if (description.includes('photograph') || description.includes('photo')) score += 7;

  return score;
}

async function searchCommons(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(SEARCH_LIMIT),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|sha1|extmetadata',
    iiurlwidth: '1600',
    origin: '*',
  });

  const response = await fetch(`${COMMONS_API}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Api-User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Image search failed with HTTP ${response.status}`);
  }

  const data = await response.json();

  return (data?.query?.pages || []).flatMap(page => {
    const info = page.imageinfo?.[0];
    if (!info) return [];

    const metadata = info.extmetadata || {};

    return [{
      title: text(page.title).replace(/^File:/i, ''),
      url: info.thumburl || info.url,
      originalUrl: info.url,
      descriptionUrl: info.descriptionurl,
      mime: info.mime,
      width: info.thumbwidth || info.width || 0,
      height: info.thumbheight || info.height || 0,
      sha1: info.sha1,
      description:
        metadataText(metadata, 'ImageDescription') ||
        metadataText(metadata, 'ObjectName'),
      categories: metadataText(metadata, 'Categories'),
      creator: metadataText(metadata, 'Artist'),
      licence:
        metadataText(metadata, 'LicenseShortName') ||
        metadataText(metadata, 'UsageTerms'),
      licenceUrl: metadataText(metadata, 'LicenseUrl'),
    }];
  });
}

async function urlIsWorkingImage(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/*',
        Range: 'bytes=0-2047',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';

    return response.ok && contentType.startsWith('image/');
  } catch {
    return false;
  }
}

async function chooseVerifiedImage(queries, relevanceText, usedImages) {
  let ranked = [];

  for (const query of queries) {
    console.log(`      Search: ${query}`);

    try {
      const candidates = await searchCommons(query);

      ranked.push(
        ...candidates.map(candidate => ({
          ...candidate,
          query,
          score: scoreCandidate(candidate, relevanceText, usedImages),
        }))
      );
    } catch (error) {
      console.warn(`      Search warning: ${error.message}`);
    }

    ranked = ranked
      .filter(candidate => candidate.score >= 0)
      .sort((a, b) => b.score - a.score);

    for (const candidate of ranked.slice(0, 12)) {
      if (await urlIsWorkingImage(candidate.url)) {
        return candidate;
      }
    }

    await wait(REQUEST_DELAY);
  }

  return null;
}

async function removeOldProductAndPostRelations(oldPostIds, oldProductIds) {
  if (Comment && oldPostIds.length) {
    await Comment.deleteMany({
      targetType: 'post',
      targetId: { $in: oldPostIds },
    });
  }

  if (SavedItem) {
    if (oldPostIds.length) {
      await SavedItem.deleteMany({
        type: 'post',
        refId: { $in: oldPostIds },
      });
    }

    if (oldProductIds.length) {
      await SavedItem.deleteMany({
        type: 'product',
        refId: { $in: oldProductIds },
      });
    }
  }

  if (Review && oldProductIds.length) {
    await Review.deleteMany({
      product: { $in: oldProductIds },
    });
  }

  if (Notification && oldPostIds.length) {
    await Notification.deleteMany({
      $or: [
        { post: { $in: oldPostIds } },
        { refId: { $in: oldPostIds } },
      ],
    }).catch(() => {});
  }
}

async function findBusinessUsers() {
  const roleQueries = [
    { role: 'business' },
    { accountType: 'business' },
    { userType: 'business' },
  ];

  let businesses = [];

  for (const query of roleQueries) {
    try {
      businesses = await User.find(query).sort({ createdAt: 1, _id: 1 });
      if (businesses.length) break;
    } catch {
      // Try next role field.
    }
  }

  if (!businesses.length) {
    businesses = await User.find({
      $or: [
        { businessProfile: { $exists: true, $ne: null } },
        { companyName: { $exists: true, $ne: '' } },
      ],
    }).sort({ createdAt: 1, _id: 1 });
  }

  return businesses;
}

async function createProducts(businesses, usedImages, attributions) {
  const created = [];

  for (let businessIndex = 0; businessIndex < businesses.length; businessIndex += 1) {
    const business = businesses[businessIndex];
    const categories = categoriesForBusiness(business, businessIndex);
    const products = productItemsForCategories(categories);

    console.log(
      `\nBusiness: ${
        business.businessProfile?.companyName ||
        business.companyName ||
        business.fullName ||
        business.email
      }`
    );

    for (const productData of products) {
      console.log(`  Product: ${productData.name}`);

      const image = await chooseVerifiedImage(
        productData.queries,
        `${productData.name} ${productData.catalogueCategory || productData.category} ${productData.description}`,
        usedImages
      );

      if (!image) {
        throw new Error(
          `No working relevant image found for Product "${productData.name}". Nothing was inserted for this product.`
        );
      }

      const base = {
        name: productData.name,
        title: productData.name,
        description: productData.description,
        category: productData.category,
        price: productData.price,
        stock: productData.stock,
        quantity: productData.stock,
        business: business._id,
        businessId: business._id,
        seller: business._id,
        owner: business._id,
        rating: 4 + ((created.length % 9) / 10),
        reviewsCount: 0,
        isAvailable: true,
        active: true,
        ...imageUpdateFor(Product, image.url),
      };

      const document = fillRequiredPaths(Product, base, {
        ...base,
        user: business._id,
      });

      const inserted = await Product.create(document);
      created.push(inserted);
      usedImages.add(image.sha1);

      attributions.push({
        type: 'product',
        recordId: String(inserted._id),
        title: productData.name,
        imageUrl: image.url,
        sourcePage: image.descriptionUrl,
        sourceTitle: image.title,
        creator: image.creator,
        licence: image.licence,
        licenceUrl: image.licenceUrl,
        matchedQuery: image.query,
      });
    }
  }

  return created;
}

async function createPosts(businesses, usedImages, attributions) {
  const created = [];
  const postCount = Math.max(20, businesses.length * 3);

  for (let index = 0; index < postCount; index += 1) {
    const business = businesses[index % businesses.length];
    const postData = POST_CATALOGUE[index % POST_CATALOGUE.length];

    const title =
      index < POST_CATALOGUE.length
        ? postData.title
        : `${postData.title} — Practical Tip ${Math.floor(index / POST_CATALOGUE.length) + 1}`;

    console.log(`\nPost: ${title}`);

    const image = await chooseVerifiedImage(
      postData.queries,
      `${title} ${postData.content} ${postData.tags.join(' ')}`,
      usedImages
    );

    if (!image) {
      throw new Error(
        `No working relevant image found for Post "${title}". Nothing was inserted for this post.`
      );
    }

    const base = {
      title,
      content: postData.content,
      description: postData.content,
      tags: postData.tags,
      author: business._id,
      user: business._id,
      business: business._id,
      likes: [],
      shares: 0,
      sharesCount: 0,
      commentsCount: 0,
      isPublished: true,
      active: true,
      ...imageUpdateFor(Post, image.url),
    };

    const document = fillRequiredPaths(Post, base, {
      ...base,
      name: title,
    });

    const inserted = await Post.create(document);
    created.push(inserted);
    usedImages.add(image.sha1);

    attributions.push({
      type: 'post',
      recordId: String(inserted._id),
      title,
      imageUrl: image.url,
      sourcePage: image.descriptionUrl,
      sourceTitle: image.title,
      creator: image.creator,
      licence: image.licence,
      licenceUrl: image.licenceUrl,
      matchedQuery: image.query,
    });
  }

  return created;
}

async function verifyInsertedImages(products, posts) {
  const records = [
    ...products.map(item => ({ type: 'Product', item })),
    ...posts.map(item => ({ type: 'Post', item })),
  ];

  const getUrl = item => {
    for (const field of ['image', 'images', 'imageUrl', 'photo', 'media', 'coverImage']) {
      const value = item[field];
      if (Array.isArray(value) && value[0]) return value[0];
      if (typeof value === 'string' && value) return value;
    }
    return null;
  };

  const seen = new Set();

  for (const record of records) {
    const url = getUrl(record.item);

    if (!url) {
      throw new Error(`${record.type} ${record.item._id} has no image URL.`);
    }

    if (seen.has(url)) {
      throw new Error(`Duplicate image URL detected: ${url}`);
    }

    if (!(await urlIsWorkingImage(url))) {
      throw new Error(
        `${record.type} ${record.item._id} has a non-working image: ${url}`
      );
    }

    seen.add(url);
  }

  return seen.size;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing from .env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const businesses = await findBusinessUsers();

  if (!businesses.length) {
    throw new Error(
      'No business users were found. Existing users were not modified.'
    );
  }

  console.log(`Business users found: ${businesses.length}`);

  const oldProducts = await Product.find({}).select('_id');
  const oldPosts = await Post.find({}).select('_id');

  const oldProductIds = oldProducts.map(item => item._id);
  const oldPostIds = oldPosts.map(item => item._id);

  console.log(`Old Products to remove: ${oldProductIds.length}`);
  console.log(`Old Posts to remove: ${oldPostIds.length}`);

  await removeOldProductAndPostRelations(oldPostIds, oldProductIds);
  await Product.deleteMany({});
  await Post.deleteMany({});

  console.log('Old Products and Posts removed.');

  const usedImages = new Set();
  const attributions = [];

  const products = await createProducts(
    businesses,
    usedImages,
    attributions
  );

  const posts = await createPosts(
    businesses,
    usedImages,
    attributions
  );

  const verifiedImages = await verifyInsertedImages(products, posts);

  console.log('\n======================================');
  console.log('FINAL RESEED COMPLETED');
  console.log('======================================');
  console.log(`Businesses kept: ${businesses.length}`);
  console.log(`Products created: ${products.length}`);
  console.log(`Posts created: ${posts.length}`);
  console.log(`Unique working images: ${verifiedImages}`);
  console.log('No users or businesses were created or deleted.');
  console.log('Every Product/Post is connected to an existing business.');
  console.log('Every image is an HTTPS URL verified before and after insert.');
  console.log('\nImage attribution data:');
  console.log(JSON.stringify(attributions, null, 2));
}

run()
  .catch(error => {
    console.error('\nFINAL RESEED FAILED:', error);
    console.error(
      'The script stopped because it refuses to insert records with missing or broken images.'
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
