/**
 * Mashtal presentation seed
 *
 * Creates:
 * - 12 regular users
 * - 10 verified Lebanese business accounts
 * - 60 products (6 per business)
 * - 40 marketing/informational posts (business-authored only)
 * - 24 agricultural discussion threads (business-authored only)
 * - realistic followers, following, likes, shares, ratings and stock
 *
 * Orders are intentionally not seeded. Create them naturally through the website
 * during the presentation so the checkout/order flow remains credible.
 *
 * Run:
 *   npm i bcryptjs
 *   MONGODB_URI="your-connection-string" node scripts/seedMashtalDemo.js
 *
 * Optional:
 *   MODEL_DIR=./models
 *   DEMO_PASSWORD=Mashtal@2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const MODEL_DIR = path.resolve(process.cwd(), process.env.MODEL_DIR || './src/models');
const User = require(path.join(MODEL_DIR, 'User'));
const Product = require(path.join(MODEL_DIR, 'Product'));
const Post = require(path.join(MODEL_DIR, 'Post'));
const Thread = require(path.join(MODEL_DIR, 'Thread'));
const Comment = require(path.join(MODEL_DIR, 'Comment'));
const Follow = require(path.join(MODEL_DIR, 'Follow'));

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch {
  bcrypt = require('bcrypt');
}

const DEMO_DOMAIN = 'mashtal-demo.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Mashtal@2026';

const imagePools = {
  avatars: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  ],
  covers: [
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1600&q=85',
    'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1600&q=85',
  ],
  products: [
    'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=900&q=85',
  ],
  posts: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1400&q=85',
  ],
};

const regularUsers = [
  ['Karim Haddad', 'karim.haddad', 'Beirut', 'Home gardener interested in herbs, balcony farming, and sustainable food.'],
  ['Maya Khoury', 'maya.khoury', 'Achrafieh, Beirut', 'Plant lover building a small urban garden at home.'],
  ['Ali Daher', 'ali.daher', 'Nabatieh', 'Olive grower interested in irrigation and crop protection.'],
  ['Rana Saad', 'rana.saad', 'Sidon, South Lebanon', 'Interested in organic vegetables and seasonal planting.'],
  ['Jad Nassar', 'jad.nassar', 'Byblos, Jbeil', 'Landscape enthusiast searching for reliable nurseries and tools.'],
  ['Nour Hamdan', 'nour.hamdan', 'Tripoli, North Lebanon', 'Beginner gardener learning how to care for indoor and outdoor plants.'],
  ['Hussein Abbas', 'hussein.abbas', 'Baalbek, Baalbek-Hermel', 'Farmer focused on potatoes, grains, and soil health.'],
  ['Sara Mansour', 'sara.mansour', 'Zahle, Bekaa', 'Agriculture student interested in crop diseases and farm technology.'],
  ['Elie Gerges', 'elie.gerges', 'Batroun, North Lebanon', 'Grows citrus, figs, and herbs for family use.'],
  ['Dima Farhat', 'dima.farhat', 'Aley, Mount Lebanon', 'Enjoys flowers, landscaping, and eco-friendly gardening.'],
  ['Omar Khalil', 'omar.khalil', 'Tyre, South Lebanon', 'Small farm owner looking for dependable equipment and irrigation solutions.'],
  ['Lynn Choueiry', 'lynn.choueiry', 'Jounieh, Keserwan', 'Creates green spaces for balconies and small homes.'],
];

const businesses = [
  {
    fullName: 'Green Cedar Nursery',
    slug: 'green.cedar',
    location: 'Jounieh, Keserwan',
    address: 'Coastal Garden Road, Jounieh',
    phone: '+961 9 410 225',
    specialties: ['Fruit trees', 'Ornamental plants', 'Indoor plants'],
    bio: 'A family-run Lebanese nursery supplying healthy plants, fruit trees, and practical growing advice.',
    website: 'https://greencedarnursery.example',
    rating: 4.8,
    reviewsCount: 126,
    about: { established: '2008', delivery: 'Across Mount Lebanon', languages: 'English, Arabic, French' },
    products: [
      ['Arbequina Olive Tree', 'Young Arbequina olive tree suitable for Lebanese gardens and productive orchards.', 18, 'trees', 42],
      ['Eureka Lemon Tree', 'Healthy grafted lemon tree selected for strong growth and reliable fruiting.', 24, 'trees', 28],
      ['Rosemary Plant', 'Aromatic rosemary plant for gardens, balconies, and culinary use.', 4.5, 'plants', 95],
      ['Lavender Plant', 'Fragrant lavender with good tolerance to dry Mediterranean conditions.', 5, 'plants', 70],
      ['Monstera Deliciosa', 'Decorative indoor plant supplied in a nursery pot with care guidance.', 22, 'plants', 31],
      ['Organic Potting Mix 20L', 'Balanced potting mix for indoor plants, herbs, and balcony containers.', 7.5, 'other', 120],
    ],
  },
  {
    fullName: 'Bekaa Agro Supplies',
    slug: 'bekaa.agro',
    location: 'Chtaura, Bekaa',
    address: 'Agricultural Market Street, Chtaura',
    phone: '+961 8 543 910',
    specialties: ['Fertilizers', 'Seeds', 'Crop nutrition'],
    bio: 'Agricultural inputs selected for Bekaa farms, greenhouses, orchards, and home growers.',
    website: 'https://bekaaagro.example',
    rating: 4.7,
    reviewsCount: 214,
    about: { established: '2012', serviceArea: 'Bekaa Valley', technicalSupport: 'Available' },
    products: [
      ['Balanced NPK Fertilizer 20-20-20', 'Water-soluble balanced fertilizer for vegetables, flowers, and young fruit trees.', 16, 'fertilizers', 160],
      ['Calcium Nitrate 5kg', 'Fast-acting calcium and nitrogen source supporting stronger plant growth.', 13.5, 'fertilizers', 85],
      ['Hybrid Tomato Seeds', 'High-germination tomato seeds selected for greenhouse and open-field production.', 8, 'seeds', 110],
      ['Lebanese Cucumber Seeds', 'Productive cucumber seed pack suitable for spring and summer planting.', 6.5, 'seeds', 92],
      ['Sweet Pepper Seeds', 'Uniform sweet pepper seeds for protected and open cultivation.', 7, 'seeds', 75],
      ['Seaweed Plant Tonic 1L', 'Liquid plant tonic that supports root growth and recovery from stress.', 11, 'fertilizers', 64],
    ],
  },
  {
    fullName: 'Cedar Irrigation Solutions',
    slug: 'cedar.irrigation',
    location: 'Zahle, Bekaa',
    address: 'Industrial Agriculture Zone, Zahle',
    phone: '+961 8 812 760',
    specialties: ['Drip irrigation', 'Water filtration', 'Farm automation'],
    bio: 'Efficient irrigation products and field-ready solutions for farms, orchards, nurseries, and gardens.',
    website: 'https://cedarirrigation.example',
    rating: 4.9,
    reviewsCount: 173,
    about: { installation: 'Available', warranty: 'Up to 2 years', consultation: 'Farm visits by appointment' },
    products: [
      ['Drip Irrigation Starter Kit', 'Complete starter kit for a small garden or greenhouse row.', 39, 'irrigation', 48],
      ['16mm Drip Line 100m', 'Durable drip line for vegetables, orchards, and landscape irrigation.', 28, 'irrigation', 90],
      ['Automatic Water Timer', 'Programmable timer with multiple watering schedules for efficient irrigation.', 31, 'irrigation', 45],
      ['120 Mesh Disc Filter', 'Reusable irrigation filter that protects emitters from sediment and debris.', 19, 'irrigation', 72],
      ['Adjustable Micro Sprinkler Pack', 'Pack of adjustable micro sprinklers for nurseries and small plots.', 14, 'irrigation', 105],
      ['Pressure Regulator', 'Maintains stable pressure in low-volume drip irrigation networks.', 12, 'irrigation', 83],
    ],
  },
  {
    fullName: 'South Lebanon Farm Tools',
    slug: 'south.tools',
    location: 'Nabatieh',
    address: 'Farmers Cooperative Road, Nabatieh',
    phone: '+961 7 765 340',
    specialties: ['Hand tools', 'Sprayers', 'Harvest equipment'],
    bio: 'Reliable agricultural tools for pruning, spraying, harvesting, and everyday farm maintenance.',
    website: 'https://southfarmtools.example',
    rating: 4.6,
    reviewsCount: 98,
    about: { repairs: 'Selected tools', spareParts: 'Available', wholesale: 'Available for farms' },
    products: [
      ['Professional Pruning Shears', 'Sharp bypass pruning shears with comfortable handles for orchard work.', 17, 'tools', 77],
      ['Backpack Sprayer 16L', 'Manual backpack sprayer for foliar feeding and crop protection applications.', 46, 'equipment', 36],
      ['Garden Hand Trowel', 'Strong hand trowel for planting, transplanting, and soil preparation.', 6, 'tools', 140],
      ['Folding Pruning Saw', 'Compact pruning saw for branches and routine orchard maintenance.', 15, 'tools', 66],
      ['Harvest Crate 25kg', 'Ventilated reusable crate for vegetables and fruit transport.', 8.5, 'equipment', 180],
      ['Heavy-Duty Garden Hose 30m', 'Flexible reinforced hose for farms, nurseries, and large gardens.', 29, 'irrigation', 54],
    ],
  },
  {
    fullName: 'Akkar Seeds Cooperative',
    slug: 'akkar.seeds',
    location: 'Halba, Akkar',
    address: 'Cooperative Centre, Halba',
    phone: '+961 6 694 118',
    specialties: ['Vegetable seeds', 'Field crops', 'Farmer support'],
    bio: 'A cooperative helping growers access dependable seeds adapted to northern Lebanese conditions.',
    website: 'https://akkarseeds.example',
    rating: 4.7,
    reviewsCount: 141,
    about: { members: '85 local growers', training: 'Seasonal workshops', bulkOrders: 'Available' },
    products: [
      ['Roma Tomato Seeds', 'Reliable Roma tomato seeds for sauce, processing, and fresh market use.', 5.5, 'seeds', 135],
      ['Green Bean Seeds 500g', 'Productive green bean variety with consistent pod quality.', 9, 'seeds', 84],
      ['Zucchini Seeds', 'Fast-growing zucchini seed pack for spring and early summer production.', 6, 'seeds', 102],
      ['Potato Seed Tubers 10kg', 'Certified seed tubers selected for uniform establishment and healthy growth.', 22, 'seeds', 58],
      ['Parsley Seeds', 'High-germination flat-leaf parsley seeds for garden and commercial use.', 3.5, 'seeds', 190],
      ['Spinach Seeds', 'Cool-season spinach seeds suitable for autumn and winter planting.', 4, 'seeds', 155],
    ],
  },
  {
    fullName: 'Mount Lebanon Garden Centre',
    slug: 'mount.garden',
    location: 'Baabda, Mount Lebanon',
    address: 'Pine View Road, Baabda',
    phone: '+961 5 921 480',
    specialties: ['Landscaping', 'Garden supplies', 'Decorative plants'],
    bio: 'Plants, containers, soil products, and practical solutions for residential and commercial gardens.',
    website: 'https://mountgardencentre.example',
    rating: 4.8,
    reviewsCount: 188,
    about: { designService: 'Available', delivery: 'Greater Beirut and Mount Lebanon', projects: 'Residential and commercial' },
    products: [
      ['Terracotta Pot 30cm', 'Classic breathable terracotta pot for herbs, flowers, and decorative plants.', 12, 'other', 95],
      ['Decorative Ceramic Planter', 'Modern glazed planter designed for indoor and covered outdoor spaces.', 26, 'other', 38],
      ['Ficus Benjamina', 'Popular indoor tree with elegant foliage, supplied with care instructions.', 28, 'plants', 26],
      ['Bougainvillea Plant', 'Colourful climbing plant well suited to sunny Lebanese balconies and gardens.', 14, 'plants', 49],
      ['Premium Garden Soil 40L', 'Rich garden soil blend for planting beds, shrubs, and landscaping projects.', 10, 'other', 112],
      ['Slow-Release Fertilizer', 'Controlled-release nutrition for potted plants and garden beds.', 9.5, 'fertilizers', 88],
    ],
  },
  {
    fullName: 'Tyre Organic Farms',
    slug: 'tyre.organic',
    location: 'Tyre, South Lebanon',
    address: 'Coastal Agricultural Road, Tyre',
    phone: '+961 7 348 662',
    specialties: ['Organic seedlings', 'Compost', 'Sustainable farming'],
    bio: 'Organic seedlings and soil products grown with a focus on healthy crops and responsible farming.',
    website: 'https://tyreorganicfarms.example',
    rating: 4.9,
    reviewsCount: 156,
    about: { certification: 'Local organic practices', farmVisits: 'By appointment', workshops: 'Monthly' },
    products: [
      ['Organic Tomato Seedlings Pack', 'Tray of healthy organic tomato seedlings ready for transplanting.', 12, 'plants', 65],
      ['Organic Lettuce Seedlings Pack', 'Fresh lettuce seedlings for garden beds and small farms.', 9, 'plants', 80],
      ['Mature Compost 25kg', 'Well-finished compost that improves soil structure and biological activity.', 11, 'fertilizers', 125],
      ['Vermicompost 10kg', 'Nutrient-rich worm compost for seedlings, vegetables, and potted plants.', 13, 'fertilizers', 70],
      ['Neem-Based Plant Care 500ml', 'Botanical plant-care solution for integrated garden management.', 10, 'medicament', 57],
      ['Organic Basil Seedlings', 'Aromatic basil seedlings suitable for sunny gardens and balconies.', 5, 'plants', 120],
    ],
  },
  {
    fullName: 'North Coast Agricultural Equipment',
    slug: 'north.equipment',
    location: 'Tripoli, North Lebanon',
    address: 'Industrial Boulevard, Tripoli',
    phone: '+961 6 442 593',
    specialties: ['Agricultural equipment', 'Power tools', 'Maintenance'],
    bio: 'Practical farm equipment and maintenance support for professional growers and agricultural businesses.',
    website: 'https://northcoastequipment.example',
    rating: 4.5,
    reviewsCount: 87,
    about: { serviceCentre: 'Tripoli', warranty: 'Manufacturer warranty', delivery: 'Northern Lebanon' },
    products: [
      ['Electric Hedge Trimmer', 'Lightweight electric trimmer for hedges, shrubs, and landscape maintenance.', 79, 'equipment', 24],
      ['Battery Pruning Shears', 'Rechargeable pruning shears designed for repeated orchard work.', 135, 'equipment', 17],
      ['Portable Water Pump', 'Compact pump for irrigation transfer and emergency farm use.', 118, 'equipment', 20],
      ['Soil Moisture Meter', 'Simple field meter for checking soil moisture before irrigation.', 21, 'tools', 62],
      ['Digital pH Meter', 'Portable meter for quick soil-solution and irrigation-water checks.', 29, 'tools', 41],
      ['Wheelbarrow 90L', 'Reinforced wheelbarrow for soil, compost, harvest, and farm materials.', 67, 'equipment', 28],
    ],
  },
  {
    fullName: 'Chouf Orchard Care',
    slug: 'chouf.orchard',
    location: 'Deir El Qamar, Chouf',
    address: 'Orchard Lane, Deir El Qamar',
    phone: '+961 5 508 734',
    specialties: ['Orchard care', 'Fruit trees', 'Crop protection'],
    bio: 'Products and field guidance for maintaining productive olive, apple, stone-fruit, and citrus orchards.',
    website: 'https://chouforchardcare.example',
    rating: 4.8,
    reviewsCount: 119,
    about: { fieldSupport: 'Chouf and nearby areas', pruningAdvice: 'Available', seasonalProgrammes: 'Available' },
    products: [
      ['Copper Fungicide 1kg', 'Copper-based crop protection product for labelled orchard and vegetable uses.', 15, 'medicament', 76],
      ['White Trunk Paint 5kg', 'Protective trunk coating for young and established orchard trees.', 12, 'medicament', 68],
      ['Fruit Tree Fertilizer 10kg', 'Granular nutrition blend formulated for fruit-bearing trees.', 24, 'fertilizers', 59],
      ['Grafting Knife', 'Sharp compact knife for grafting and nursery propagation work.', 18, 'tools', 44],
      ['Tree Tie Roll 50m', 'Flexible tree tie that supports young trees without damaging stems.', 9, 'tools', 81],
      ['Pheromone Trap Kit', 'Monitoring kit supporting integrated orchard pest-management programmes.', 14, 'medicament', 52],
    ],
  },
  {
    fullName: 'Beirut Urban Garden',
    slug: 'beirut.urban',
    location: 'Hamra, Beirut',
    address: 'Verdant Street, Hamra',
    phone: '+961 1 748 305',
    specialties: ['Balcony gardening', 'Indoor plants', 'Urban farming'],
    bio: 'Compact gardening products and plant guidance created for apartments, rooftops, balconies, and offices.',
    website: 'https://beiruturbangarden.example',
    rating: 4.7,
    reviewsCount: 202,
    about: { workshops: 'Weekend sessions', delivery: 'Greater Beirut', corporatePlants: 'Available' },
    products: [
      ['Balcony Herb Kit', 'Complete starter kit with basil, mint, parsley, pots, and growing guidance.', 24, 'plants', 54],
      ['Self-Watering Planter', 'Compact self-watering planter designed for busy urban gardeners.', 19, 'other', 73],
      ['Snake Plant', 'Low-maintenance indoor plant suitable for homes and offices.', 17, 'plants', 61],
      ['Mini Gardening Tool Set', 'Three-piece hand-tool set for pots, balconies, and raised beds.', 11, 'tools', 96],
      ['Coco Coir Block', 'Compressed growing medium for seed starting and lightweight container mixes.', 6, 'other', 130],
      ['Indoor Plant Fertilizer 500ml', 'Gentle liquid feed formulated for common indoor foliage plants.', 8.5, 'fertilizers', 89],
    ],
  },
];

const postTemplates = [
  {
    title: 'Five signs your plants need a watering adjustment',
    content: 'Wilting does not always mean a plant needs more water. Check soil moisture, drainage, leaf texture, pot weight, and recent weather before changing the schedule. Consistent observation prevents both drought stress and root problems.',
    tags: ['plant-care', 'irrigation', 'gardening'],
  },
  {
    title: 'Prepare your garden for a hot Lebanese week',
    content: 'Water early in the morning, add a light mulch layer, protect newly transplanted seedlings, and inspect drip emitters. Avoid heavy fertilising during severe heat because stressed roots may not use nutrients efficiently.',
    tags: ['summer', 'water-management', 'lebanon'],
  },
  {
    title: 'New seasonal stock now available',
    content: 'Our latest seasonal selection has arrived with healthy plants and practical supplies for home gardens and farms. Contact our team for availability, delivery areas, and product recommendations.',
    tags: ['new-arrivals', 'seasonal', 'local-business'],
  },
  {
    title: 'Why soil drainage matters',
    content: 'Healthy roots need both water and oxygen. Compacted or constantly saturated soil can reduce root activity. Improve structure with suitable organic matter and select containers or beds that allow excess water to leave.',
    tags: ['soil-health', 'roots', 'education'],
  },
  {
    title: 'A simple checklist before buying a fruit tree',
    content: 'Consider local climate, available space, sunlight, pollination needs, mature tree size, and irrigation access. Choosing the right tree at the beginning is easier than correcting a poor site match later.',
    tags: ['fruit-trees', 'orchard', 'buying-guide'],
  },
  {
    title: 'Drip irrigation maintenance reminder',
    content: 'Inspect filters, flush main lines, check pressure, clean blocked emitters, and look for leaks. A short maintenance routine can improve water distribution and protect crop uniformity.',
    tags: ['drip-irrigation', 'maintenance', 'water-saving'],
  },
  {
    title: 'How to transplant seedlings with less stress',
    content: 'Water seedlings before transplanting, handle them by the leaves rather than the stem, keep the root ball intact, transplant during a cooler part of the day, and water gently after planting.',
    tags: ['seedlings', 'transplanting', 'growing-tips'],
  },
  {
    title: 'Support Lebanese agricultural businesses',
    content: 'Buying from local nurseries, cooperatives, growers, and agricultural suppliers strengthens knowledge-sharing and makes reliable products easier to access across Lebanese regions.',
    tags: ['support-local', 'lebanese-agriculture', 'community'],
  },
];

const threadTemplates = [
  ['Best irrigation schedule for young olive trees', 'How often should young olive trees be irrigated during their first two summers in a dry inland location? Share the soil type, tree age, and irrigation method when answering.', ['olive', 'irrigation', 'orchard']],
  ['Yellowing tomato leaves: what should be checked first?', 'Before choosing a treatment, which factors should growers inspect when lower tomato leaves begin turning yellow?', ['tomato', 'diagnosis', 'plant-health']],
  ['Recommended vegetables for autumn planting in Lebanon', 'Which vegetables perform well when planted in early autumn in coastal and inland Lebanese areas?', ['seasonal-planting', 'vegetables', 'lebanon']],
  ['Mulch options for fruit orchards', 'What locally available mulch materials have growers used successfully around fruit trees without creating moisture or pest problems?', ['mulch', 'orchard', 'soil']],
  ['Greenhouse ventilation during warm weather', 'What practical ventilation routine helps reduce excessive humidity and heat in small greenhouses?', ['greenhouse', 'humidity', 'ventilation']],
  ['Improving clay soil before planting', 'Which amendments and preparation methods are most useful for compact clay soil in a new garden bed?', ['soil', 'compost', 'garden']],
];

function standardHours() {
  return [
    { day: 'monday', open: [{ from: '08:00', to: '17:30' }], closed: false },
    { day: 'tuesday', open: [{ from: '08:00', to: '17:30' }], closed: false },
    { day: 'wednesday', open: [{ from: '08:00', to: '17:30' }], closed: false },
    { day: 'thursday', open: [{ from: '08:00', to: '17:30' }], closed: false },
    { day: 'friday', open: [{ from: '08:00', to: '17:30' }], closed: false },
    { day: 'saturday', open: [{ from: '08:00', to: '15:00' }], closed: false },
    { day: 'sunday', open: [], closed: true },
  ];
}

function pickUnique(items, count, offset = 0) {
  if (!items.length) return [];
  const result = [];
  for (let i = 0; i < Math.min(count, items.length); i += 1) {
    result.push(items[(offset + i * 3) % items.length]);
  }
  return [...new Set(result.map(String))].map(id => new mongoose.Types.ObjectId(id));
}

async function cleanPreviousDemo() {
  const demoUsers = await User.find({ email: { $regex: `@${DEMO_DOMAIN}$`, $options: 'i' } }).select('_id');
  const ids = demoUsers.map(user => user._id);

  if (ids.length) {
    await Promise.all([
      Product.deleteMany({ business: { $in: ids } }),
      Post.deleteMany({ author: { $in: ids } }),
      Thread.deleteMany({ author: { $in: ids } }),
      Comment.deleteMany({ author: { $in: ids } }),
      Follow.deleteMany({ $or: [{ follower: { $in: ids } }, { following: { $in: ids } }] }),
      User.deleteMany({ _id: { $in: ids } }),
    ]);
  }
}

async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI (or MONGO_URI) in the environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  await cleanPreviousDemo();
  console.log('Removed previous Mashtal demo records only.');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const userDocs = await User.insertMany(
    regularUsers.map(([fullName, slug, location, bio], index) => ({
      fullName,
      email: `${slug}@${DEMO_DOMAIN}`,
      passwordHash,
      role: 'visitor',
      avatar: imagePools.avatars[index % imagePools.avatars.length],
      coverImage: imagePools.covers[index % imagePools.covers.length],
      verified: true,
      subscriptionStatus: 'inactive',
      phone: `+961 ${70 + (index % 9)} ${String(320000 + index * 731).padStart(6, '0')}`,
      location,
      bio,
      preferredLanguage: 'en',
      followers: [],
      following: [],
      blockedUsers: [],
    }))
  );

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 60);

  const businessDocs = await User.insertMany(
    businesses.map((business, index) => ({
      fullName: business.fullName,
      email: `${business.slug}@${DEMO_DOMAIN}`,
      passwordHash,
      role: 'business',
      avatar: imagePools.products[(index + 2) % imagePools.products.length],
      coverImage: imagePools.covers[(index + 1) % imagePools.covers.length],
      verified: true,
      subscriptionStatus: 'active',
      subscriptionStartedAt: now,
      subscriptionExpiresAt: expires,
      phone: business.phone,
      location: business.location,
      bio: business.bio,
      preferredLanguage: 'en',
      followers: [],
      following: [],
      blockedUsers: [],
      businessProfile: {
        companyName: business.fullName,
        bio: business.bio,
        location: business.location,
        phone: business.phone,
        specialties: business.specialties,
        address: business.address,
        contactEmail: `contact@${business.slug.replace('.', '')}.example`,
        website: business.website,
        rating: business.rating,
        reviewsCount: business.reviewsCount,
        hours: standardHours(),
        about: business.about,
        wishPhone: business.phone.replace(/\s/g, ''),
        wishAccountNumber: `WISH-${String(520000 + index * 417).padStart(6, '0')}`,
      },
    }))
  );

  const allUsers = [...userDocs, ...businessDocs];

  // Realistic follow graph. The embedded arrays stay mutually consistent.
  for (let i = 0; i < allUsers.length; i += 1) {
    const current = allUsers[i];
    const desired = current.role === 'business' ? 8 : 6;
    const following = pickUnique(
      allUsers.filter(user => !user._id.equals(current._id)).map(user => user._id),
      desired,
      i
    );

    current.following = following;
  }

  const followerMap = new Map(allUsers.map(user => [String(user._id), []]));
  for (const user of allUsers) {
    for (const followedId of user.following) {
      followerMap.get(String(followedId)).push(user._id);
    }
  }

  for (const user of allUsers) {
    user.followers = followerMap.get(String(user._id));
    await user.save();
  }

  // Store the same relationships in the Follow collection.
  const followDocs = [];
  for (const user of allUsers) {
    for (const followedId of user.following) {
      followDocs.push({ follower: user._id, following: followedId });
    }
  }
  if (followDocs.length) await Follow.insertMany(followDocs, { ordered: false });

  const createdProducts = [];
  for (let businessIndex = 0; businessIndex < businessDocs.length; businessIndex += 1) {
    const businessUser = businessDocs[businessIndex];
    const source = businesses[businessIndex];

    for (let productIndex = 0; productIndex < source.products.length; productIndex += 1) {
      const [name, description, price, category, stock] = source.products[productIndex];
      createdProducts.push({
        business: businessUser._id,
        name,
        description,
        price,
        image: imagePools.products[(businessIndex + productIndex) % imagePools.products.length],
        category,
        stock,
        rating: Number((4.2 + ((businessIndex + productIndex) % 8) * 0.1).toFixed(1)),
        reviewsCount: 8 + ((businessIndex * 11 + productIndex * 7) % 74),
        businessExternalId: source.slug,
      });
    }
  }
  await Product.insertMany(createdProducts);

  const postDocs = [];
  for (let businessIndex = 0; businessIndex < businessDocs.length; businessIndex += 1) {
    for (let postIndex = 0; postIndex < 4; postIndex += 1) {
      const template = postTemplates[(businessIndex + postIndex) % postTemplates.length];
      const author = businessDocs[businessIndex];
      const likerPool = allUsers.filter(user => !user._id.equals(author._id)).map(user => user._id);

      postDocs.push({
        title: template.title,
        content: `${template.content}\n\nShared by ${author.fullName} in ${author.location}.`,
        image: imagePools.posts[(businessIndex + postIndex) % imagePools.posts.length],
        tags: [...template.tags, businesses[businessIndex].specialties[0].toLowerCase().replace(/\s+/g, '-')],
        author: author._id,
        likes: pickUnique(likerPool, 5 + ((businessIndex + postIndex) % 8), businessIndex + postIndex),
        commentsCount: 0,
        shares: 2 + ((businessIndex * 7 + postIndex * 3) % 18),
        isLiked: false,
        isSaved: false,
        createdAt: new Date(Date.now() - (businessIndex * 4 + postIndex) * 86400000),
        updatedAt: new Date(Date.now() - (businessIndex * 4 + postIndex) * 86400000),
      });
    }
  }
  const insertedPosts = await Post.insertMany(postDocs);

  const threadDocs = [];
  for (let businessIndex = 0; businessIndex < businessDocs.length; businessIndex += 1) {
    const count = businessIndex < 4 ? 3 : 2; // 24 total
    for (let threadIndex = 0; threadIndex < count; threadIndex += 1) {
      const template = threadTemplates[(businessIndex * 2 + threadIndex) % threadTemplates.length];
      const author = businessDocs[businessIndex];
      const likerPool = allUsers.filter(user => !user._id.equals(author._id)).map(user => user._id);

      threadDocs.push({
        title: template[0],
        content: `${template[1]}\n\nDiscussion started by ${author.fullName}.`,
        tags: template[2],
        author: author._id,
        likes: pickUnique(likerPool, 4 + ((businessIndex + threadIndex) % 7), threadIndex + businessIndex),
        commentsCount: 0,
        shares: 1 + ((businessIndex * 3 + threadIndex) % 10),
        isLiked: false,
        isSaved: false,
        createdAt: new Date(Date.now() - (45 + businessIndex * 2 + threadIndex) * 86400000),
        updatedAt: new Date(Date.now() - (45 + businessIndex * 2 + threadIndex) * 86400000),
      });
    }
  }
  const insertedThreads = await Thread.insertMany(threadDocs);


  const commentTexts = [
    'This is useful information. I will apply it in my garden this week.',
    'Thank you for sharing. Does this advice also apply to coastal areas?',
    'We had a similar situation last season and better drainage made a clear difference.',
    'Can you recommend a suitable product for a small balcony garden?',
    'Very helpful explanation, especially for beginners.',
    'I agree that checking the soil first is better than watering on a fixed schedule.',
    'Would this method work for young citrus trees as well?',
    'This is an important reminder for farmers before the hot season.',
    'I tried this approach in the Bekaa and the results were encouraging.',
    'Could you share more details about the correct timing?',
    'Good discussion. Local climate and soil type definitely need to be considered.',
    'Thank you. I saved this information for the next planting season.',
  ];

  const replyTexts = [
    'Yes, but the frequency should be adjusted according to temperature, wind, and soil drainage.',
    'For a small space, start with a simple option and monitor the plant response before increasing anything.',
    'That is a good point. Coastal humidity can change how quickly the soil dries.',
    'Please send us the plant type and your location so we can suggest the most suitable option.',
    'Exactly. Observation is more reliable than using the same schedule in every location.',
    'For young trees, use smaller amounts more consistently and avoid keeping the roots saturated.',
  ];

  async function seedCommentsForTargets(targetType, targets, startOffset = 0) {
    let totalCreated = 0;

    for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
      const target = targets[targetIndex];
      const topLevelCount = 2 + (targetIndex % 3); // 2-4 visible comments
      const topLevelDocs = [];

      for (let commentIndex = 0; commentIndex < topLevelCount; commentIndex += 1) {
        const author = userDocs[(targetIndex + commentIndex + startOffset) % userDocs.length];
        const possibleLikers = allUsers
          .filter(user => !user._id.equals(author._id))
          .map(user => user._id);

        topLevelDocs.push({
          targetType,
          targetId: target._id,
          parentComment: null,
          author: author._id,
          content: commentTexts[(targetIndex * 2 + commentIndex + startOffset) % commentTexts.length],
          likes: pickUnique(possibleLikers, 1 + ((targetIndex + commentIndex) % 5), targetIndex + commentIndex),
          createdAt: new Date(target.createdAt.getTime() + (commentIndex + 1) * 3600000),
          updatedAt: new Date(target.createdAt.getTime() + (commentIndex + 1) * 3600000),
        });
      }

      const insertedTopLevel = await Comment.insertMany(topLevelDocs);
      totalCreated += insertedTopLevel.length;

      // Add one realistic business reply to every second target.
      if (targetIndex % 2 === 0 && insertedTopLevel.length) {
        const targetAuthor = businessDocs.find(business => business._id.equals(target.author));
        if (targetAuthor) {
          const parent = insertedTopLevel[targetIndex % insertedTopLevel.length];
          const replyLikerPool = allUsers
            .filter(user => !user._id.equals(targetAuthor._id))
            .map(user => user._id);

          await Comment.create({
            targetType,
            targetId: target._id,
            parentComment: parent._id,
            author: targetAuthor._id,
            content: replyTexts[(targetIndex + startOffset) % replyTexts.length],
            likes: pickUnique(replyLikerPool, 1 + (targetIndex % 4), targetIndex),
            createdAt: new Date(parent.createdAt.getTime() + 1800000),
            updatedAt: new Date(parent.createdAt.getTime() + 1800000),
          });
          totalCreated += 1;
        }
      }

      // commentsCount includes both top-level comments and replies.
      const actualCount = await Comment.countDocuments({ targetType, targetId: target._id });
      if (targetType === 'post') {
        await Post.updateOne({ _id: target._id }, { $set: { commentsCount: actualCount } });
      } else {
        await Thread.updateOne({ _id: target._id }, { $set: { commentsCount: actualCount } });
      }
    }

    return totalCreated;
  }

  const postCommentsCount = await seedCommentsForTargets('post', insertedPosts, 0);
  const threadCommentsCount = await seedCommentsForTargets('thread', insertedThreads, 5);

  console.log('\nMashtal demo seed completed.');
  console.log(`Regular users: ${userDocs.length}`);
  console.log(`Businesses: ${businessDocs.length}`);
  console.log(`Products: ${createdProducts.length}`);
  console.log(`Posts: ${postDocs.length}`);
  console.log(`Threads: ${threadDocs.length}`);
  console.log(`Follow relationships: ${followDocs.length}`);
  console.log(`Comments and replies: ${postCommentsCount + threadCommentsCount}`);
  console.log(`\nDemo password for every account: ${DEMO_PASSWORD}`);
  console.log('\nRecommended presentation accounts:');
  console.log(`Customer: ${regularUsers[0][1]}@${DEMO_DOMAIN}`);
  console.log(`Business: ${businesses[0].slug}@${DEMO_DOMAIN}`);
}

seed()
  .catch(error => {
    console.error('\nSeed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
