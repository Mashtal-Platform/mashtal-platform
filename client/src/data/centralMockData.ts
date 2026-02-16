import { UserRole } from "../contexts/AuthContext";

// Import threadComments from threadsCommentsData
import { threadComments as importedThreadComments } from "./threadsCommentsData";

export interface MockUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar: string;
  verified: boolean;
  bio: string;
  location: string;
  phone: string;
  followers: number;
  following: number;
  businessId?: string;
  companyName?: string;
  joinDate: string;
  specialization?: string;
  yearsExperience?: number;
  rating?: number;
  reviewsCount?: number;
  hours?: string[];
  specialties?: string[];
  logo?: string;
  name?: string;
  reviews?: number;
}

export interface MockPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  image: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  shares: number;
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
}

export interface MockThread {
  id: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  shares: number;
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
}

export interface MockComment {
  id: string;
  parentId: string; // post or thread id
  authorId: string;
  content: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
}

export interface MockNotification {
  id: string;
  type:
    | "message"
    | "mention"
    | "follow"
    | "comment"
    | "like"
    | "order"
    | "system";
  message: string;
  read: boolean;
  time: string;
  timestamp: string;
  relatedUserId?: string;
  postId?: string;
  threadId?: string;
  commentId?: string;
  authorId?: string;
  openComments?: boolean;
}

export interface MockProduct {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category:
    | "seeds"
    | "tools"
    | "fertilizers"
    | "plants"
    | "irrigation";
  stock: number;
  rating: number;
  reviewsCount: number;
}

export interface MockChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface MockChat {
  id: string;
  participants: string[]; // user IDs
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// --- DATA ---

export const currentUser: MockUser = {
  id: "me",
  fullName: "Ahmed Al-Mansour",
  email: "ahmed.mansour@example.com",
  role: "user",
  avatar:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  verified: false,
  bio: "Passionate farmer & agricultural enthusiast. Looking to modernize my family farm in Riyadh with new technologies.",
  location: "Riyadh, Saudi Arabia",
  phone: "+966 50 123 4567",
  followers: 124,
  following: 56,
  joinDate: "Jan 2024",
};

export const otherUsers: MockUser[] = [
  // ENGINEERS (8 total)
  {
    id: "eng1",
    fullName: "Engineer Hassan Al-Fahad",
    email: "hassan.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    verified: true,
    bio: "Agricultural Engineer specializing in smart irrigation and greenhouse automation. 10+ years of experience.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 55 111 2222",
    followers: 1890,
    following: 342,
    joinDate: "Mar 2020",
    specialization: "Irrigation & Smart Farming",
    yearsExperience: 12,
    rating: 4.9,
    reviewsCount: 156,
  },
  {
    id: "eng2",
    fullName: "Eng. Abdullah Al-Dosari",
    email: "abdullah.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
    verified: true,
    bio: "Mechanical Engineer specializing in agricultural machinery and equipment optimization.",
    location: "Dammam, Saudi Arabia",
    phone: "+966 13 111 2222",
    followers: 2100,
    following: 289,
    joinDate: "Jul 2019",
    specialization: "Agricultural Machinery",
    yearsExperience: 8,
    rating: 4.7,
    reviewsCount: 98,
  },
  {
    id: "eng3",
    fullName: "Eng. Nora Al-Subaie",
    email: "nora.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300",
    verified: true,
    bio: "Water resources engineer focused on sustainable irrigation and water conservation in arid regions.",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 12 222 3333",
    followers: 1567,
    following: 234,
    joinDate: "Sep 2020",
    specialization: "Water Conservation",
    yearsExperience: 9,
    rating: 4.8,
    reviewsCount: 124,
  },
  {
    id: "eng4",
    fullName: "Eng. Tariq Al-Harbi",
    email: "tariq.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300",
    verified: true,
    bio: "IoT and automation specialist for modern farming. Building the future of agriculture.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 333 4444",
    followers: 2345,
    following: 412,
    joinDate: "Jan 2021",
    specialization: "IoT & Automation",
    yearsExperience: 6,
    rating: 4.9,
    reviewsCount: 187,
  },
  {
    id: "eng5",
    fullName: "Eng. Reem Al-Ghamdi",
    email: "reem.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300",
    verified: true,
    bio: "Renewable energy engineer specializing in solar-powered agricultural systems.",
    location: "Mecca, Saudi Arabia",
    phone: "+966 12 444 5555",
    followers: 1823,
    following: 198,
    joinDate: "May 2020",
    specialization: "Renewable Energy",
    yearsExperience: 7,
    rating: 4.8,
    reviewsCount: 143,
  },
  {
    id: "eng6",
    fullName: "Eng. Faisal Al-Shehri",
    email: "faisal.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    verified: true,
    bio: "Greenhouse climate control expert. Optimizing growing conditions year-round.",
    location: "Al-Khobar, Saudi Arabia",
    phone: "+966 13 555 6666",
    followers: 1456,
    following: 267,
    joinDate: "Nov 2019",
    specialization: "Greenhouse Technology",
    yearsExperience: 10,
    rating: 4.7,
    reviewsCount: 156,
  },
  {
    id: "eng7",
    fullName: "Eng. Salma Al-Otaibi",
    email: "salma.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
    verified: true,
    bio: "Agricultural systems engineer with focus on hydroponics and vertical farming.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 666 7777",
    followers: 2012,
    following: 345,
    joinDate: "Mar 2021",
    specialization: "Hydroponics & Vertical Farming",
    yearsExperience: 5,
    rating: 4.9,
    reviewsCount: 98,
  },
  {
    id: "eng8",
    fullName: "Eng. Omar Al-Zahrani",
    email: "omar.eng@mashtal.sa",
    role: "engineer",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    verified: false,
    bio: "Junior engineer learning about precision agriculture and drone technology.",
    location: "Taif, Saudi Arabia",
    phone: "+966 12 777 8888",
    followers: 567,
    following: 423,
    joinDate: "Aug 2022",
    specialization: "Precision Agriculture",
    yearsExperience: 2,
    rating: 4.5,
    reviewsCount: 34,
  },

  // AGRONOMISTS (8 total)
  {
    id: "agr1",
    fullName: "Dr. Fatima Al-Rashid",
    email: "fatima.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    verified: true,
    bio: "Soil scientist and crop health specialist. Expert in organic fertilization and sustainable pest control.",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 55 333 4444",
    followers: 3450,
    following: 128,
    joinDate: "Jun 2019",
    specialization: "Soil Science & Organic Farming",
    yearsExperience: 15,
    rating: 4.8,
    reviewsCount: 210,
  },
  {
    id: "agr2",
    fullName: "Dr. Khalid Al-Mutairi",
    email: "khalid.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    verified: true,
    bio: "Plant pathologist with expertise in desert agriculture and drought-resistant crops.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 222 3333",
    followers: 2890,
    following: 167,
    joinDate: "Jan 2018",
    specialization: "Plant Pathology & Desert Agriculture",
    yearsExperience: 11,
    rating: 4.9,
    reviewsCount: 167,
  },
  {
    id: "agr3",
    fullName: "Dr. Maha Al-Balawi",
    email: "maha.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300",
    verified: true,
    bio: "Crop nutrition specialist helping farmers maximize yields through proper fertilization.",
    location: "Buraydah, Saudi Arabia",
    phone: "+966 16 333 4444",
    followers: 2567,
    following: 198,
    joinDate: "Apr 2019",
    specialization: "Crop Nutrition",
    yearsExperience: 13,
    rating: 4.7,
    reviewsCount: 178,
  },
  {
    id: "agr4",
    fullName: "Dr. Ibrahim Al-Shamrani",
    email: "ibrahim.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    verified: true,
    bio: "Integrated pest management expert. Reducing chemical use while protecting crops.",
    location: "Dammam, Saudi Arabia",
    phone: "+966 13 444 5555",
    followers: 2134,
    following: 234,
    joinDate: "Sep 2018",
    specialization: "Integrated Pest Management",
    yearsExperience: 14,
    rating: 4.8,
    reviewsCount: 192,
  },
  {
    id: "agr5",
    fullName: "Dr. Hessa Al-Qahtani",
    email: "hessa.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300",
    verified: true,
    bio: "Seed technology and breeding specialist working on heat-tolerant varieties.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 555 6666",
    followers: 1978,
    following: 156,
    joinDate: "Feb 2020",
    specialization: "Seed Technology & Breeding",
    yearsExperience: 10,
    rating: 4.9,
    reviewsCount: 145,
  },
  {
    id: "agr6",
    fullName: "Dr. Youssef Al-Harthy",
    email: "youssef.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    verified: true,
    bio: "Organic farming consultant. Helping transition conventional farms to organic methods.",
    location: "Al-Ahsa, Saudi Arabia",
    phone: "+966 13 666 7777",
    followers: 2456,
    following: 189,
    joinDate: "Jul 2019",
    specialization: "Organic Farming",
    yearsExperience: 12,
    rating: 4.8,
    reviewsCount: 201,
  },
  {
    id: "agr7",
    fullName: "Dr. Nouf Al-Subhi",
    email: "nouf.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
    verified: true,
    bio: "Post-harvest technology expert minimizing losses and extending shelf life.",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 12 777 8888",
    followers: 1789,
    following: 167,
    joinDate: "Oct 2020",
    specialization: "Post-Harvest Technology",
    yearsExperience: 8,
    rating: 4.7,
    reviewsCount: 134,
  },
  {
    id: "agr8",
    fullName: "Dr. Saad Al-Amoudi",
    email: "saad.agr@mashtal.sa",
    role: "agronomist",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
    verified: false,
    bio: "Young agronomist passionate about sustainable farming practices and climate adaptation.",
    location: "Tabuk, Saudi Arabia",
    phone: "+966 14 888 9999",
    followers: 678,
    following: 345,
    joinDate: "Jan 2023",
    specialization: "Climate-Smart Agriculture",
    yearsExperience: 3,
    rating: 4.6,
    reviewsCount: 45,
  },

  // BUSINESSES (20 total)
  {
    id: "biz1",
    fullName: "Green Valley Nursery",
    email: "sales@greenvalley.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1619077130450-baea09efa355?w=300",
    logo: "https://images.unsplash.com/photo-1619077130450-baea09efa355?w=300",
    name: "Green Valley Nursery",
    verified: true,
    bio: "Saudi Arabia's leading provider of organic seedlings, exotic plants, and premium garden supplies. Established in 2015, we pride ourselves on quality and customer satisfaction.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 222 3333",
    followers: 12500,
    following: 89,
    businessId: "1",
    companyName: "Green Valley Nursery",
    joinDate: "Jan 2015",
    rating: 4.7,
    reviewsCount: 1240,
    reviews: 1240,
    hours: [
      "Saturday - Wednesday: 8:00 AM - 6:00 PM",
      "Thursday: 8:00 AM - 8:00 PM",
      "Friday: 2:00 PM - 10:00 PM",
    ],
    specialties: [
      "Date Palms",
      "Citrus Trees",
      "Organic Seedlings",
      "Garden Supplies",
      "Landscaping",
    ],
  },
  {
    id: "biz2",
    fullName: "AgriTools Pro",
    email: "info@agritools.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?w=300",
    logo: "https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?w=300",
    name: "AgriTools Pro",
    verified: true,
    bio: "Heavy machinery and professional farming tools for modern industrial farms. Authorized dealer of international brands with local support.",
    location: "Dammam, Saudi Arabia",
    phone: "+966 13 444 5555",
    followers: 8900,
    following: 45,
    businessId: "2",
    companyName: "AgriTools Pro",
    joinDate: "Feb 2018",
    rating: 4.6,
    reviewsCount: 850,
    reviews: 850,
    hours: [
      "Sunday - Thursday: 7:00 AM - 5:00 PM",
      "Saturday: 9:00 AM - 2:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "Tractors",
      "Irrigation Systems",
      "Smart Sensors",
      "Greenhouse Equipment",
      "Maintenance",
    ],
  },
  {
    id: "biz3",
    fullName: "Desert Bloom Seeds",
    email: "contact@desertbloom.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=300",
    logo: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=300",
    name: "Desert Bloom Seeds",
    verified: true,
    bio: "Premium agricultural seeds adapted for Saudi climate. We import and cultivate heat-resistant varieties perfect for the Gulf region.",
    location: "Al-Khobar, Saudi Arabia",
    phone: "+966 13 777 8888",
    followers: 6700,
    following: 56,
    businessId: "3",
    companyName: "Desert Bloom Seeds",
    joinDate: "Aug 2019",
    rating: 4.8,
    reviewsCount: 567,
    reviews: 567,
    hours: [
      "Saturday - Thursday: 8:00 AM - 5:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "Vegetable Seeds",
      "Wheat Seeds",
      "Heat-Resistant Varieties",
      "Heirloom Seeds",
      "Bulk Orders",
    ],
  },
  {
    id: "biz4",
    fullName: "Oasis Organic Fertilizers",
    email: "info@oasisorganic.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300",
    logo: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300",
    name: "Oasis Organic",
    verified: true,
    bio: "Certified organic fertilizers and soil amendments. We believe in sustainable farming that protects our environment for future generations.",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 12 333 4444",
    followers: 9800,
    following: 125,
    businessId: "4",
    companyName: "Oasis Organic Fertilizers",
    joinDate: "Mar 2017",
    rating: 4.9,
    reviewsCount: 1045,
    reviews: 1045,
    hours: [
      "Saturday - Wednesday: 8:30 AM - 6:30 PM",
      "Thursday: 8:30 AM - 8:00 PM",
      "Friday: 3:00 PM - 9:00 PM",
    ],
    specialties: [
      "Organic Compost",
      "Bio-Fertilizers",
      "Soil Conditioners",
      "Pest Control",
      "Consultation",
    ],
  },
  {
    id: "biz5",
    fullName: "SmartFarm Technologies",
    email: "hello@smartfarmtech.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300",
    logo: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300",
    name: "SmartFarm Tech",
    verified: true,
    bio: "Leading provider of IoT sensors, automation systems, and AI-powered farm management software for precision agriculture.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 999 0000",
    followers: 15200,
    following: 234,
    businessId: "5",
    companyName: "SmartFarm Technologies",
    joinDate: "Jan 2020",
    rating: 4.9,
    reviewsCount: 892,
    reviews: 892,
    hours: [
      "Sunday - Thursday: 9:00 AM - 6:00 PM",
      "Saturday: 10:00 AM - 3:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "IoT Sensors",
      "Farm Management Software",
      "Weather Stations",
      "Automated Irrigation",
      "24/7 Support",
    ],
  },
  {
    id: "biz6",
    fullName: "Palm Paradise",
    email: "sales@palmparadise.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=300",
    logo: "https://images.unsplash.com/photo-1590004953392-5aba2e72269a?w=300",
    name: "Palm Paradise",
    verified: true,
    bio: "Specialists in date palms and palm tree cultivation. Over 50 varieties of date palms from around the world, grown in Saudi soil.",
    location: "Al-Ahsa, Saudi Arabia",
    phone: "+966 13 555 6666",
    followers: 7800,
    following: 78,
    businessId: "6",
    companyName: "Palm Paradise",
    joinDate: "May 2016",
    rating: 4.7,
    reviewsCount: 678,
    reviews: 678,
    hours: [
      "Daily: 7:00 AM - 7:00 PM",
      "Friday: 2:00 PM - 8:00 PM",
    ],
    specialties: [
      "Medjool Dates",
      "Ajwa Dates",
      "Sukkari Dates",
      "Date Syrup",
      "Palm Consultation",
    ],
  },
  {
    id: "biz7",
    fullName: "Greenhouse Solutions KSA",
    email: "info@greenhouseksa.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300",
    logo: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300",
    name: "Greenhouse KSA",
    verified: true,
    bio: "Complete greenhouse construction and climate control systems. From small hobby greenhouses to commercial scale operations.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 666 7777",
    followers: 5600,
    following: 92,
    businessId: "7",
    companyName: "Greenhouse Solutions KSA",
    joinDate: "Jul 2018",
    rating: 4.6,
    reviewsCount: 234,
    reviews: 234,
    hours: [
      "Sunday - Thursday: 8:00 AM - 5:00 PM",
      "Saturday: By Appointment",
      "Friday: Closed",
    ],
    specialties: [
      "Custom Greenhouses",
      "Climate Control",
      "Hydroponic Systems",
      "Maintenance",
      "Installation",
    ],
  },
  {
    id: "biz8",
    fullName: "Arabian Harvest Equipment",
    email: "contact@arabianharvest.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300",
    logo: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300",
    name: "Arabian Harvest",
    verified: true,
    bio: "Industrial farming equipment, harvesters, and post-harvest processing machinery. Serving large farms across the Kingdom.",
    location: "Dammam, Saudi Arabia",
    phone: "+966 13 888 9999",
    followers: 4200,
    following: 67,
    businessId: "8",
    companyName: "Arabian Harvest Equipment",
    joinDate: "Nov 2017",
    rating: 4.5,
    reviewsCount: 189,
    reviews: 189,
    hours: [
      "Sunday - Thursday: 7:30 AM - 4:30 PM",
      "Friday & Saturday: Closed",
    ],
    specialties: [
      "Combine Harvesters",
      "Threshers",
      "Grain Storage",
      "Parts & Service",
      "Training",
    ],
  },
  {
    id: "biz9",
    fullName: "Garden Delights",
    email: "hello@gardendelights.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300",
    logo: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300",
    name: "Garden Delights",
    verified: false,
    bio: "Your neighborhood garden center for home gardening supplies, pots, decorative plants, and landscaping materials.",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 12 444 5555",
    followers: 3400,
    following: 145,
    businessId: "9",
    companyName: "Garden Delights",
    joinDate: "Sep 2021",
    rating: 4.4,
    reviewsCount: 312,
    reviews: 312,
    hours: ["Daily: 9:00 AM - 9:00 PM"],
    specialties: [
      "Decorative Plants",
      "Pots & Planters",
      "Garden Tools",
      "Landscaping",
      "Home Delivery",
    ],
  },
  {
    id: "biz10",
    fullName: "Riyadh Drip Systems",
    email: "info@riyadhdrip.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=300",
    logo: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=300",
    name: "Riyadh Drip",
    verified: true,
    bio: "Drip irrigation specialists. We design, install, and maintain water-efficient irrigation systems for farms and gardens of all sizes.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 777 8888",
    followers: 6100,
    following: 89,
    businessId: "10",
    companyName: "Riyadh Drip Systems",
    joinDate: "Apr 2019",
    rating: 4.8,
    reviewsCount: 445,
    reviews: 445,
    hours: [
      "Saturday - Thursday: 8:00 AM - 6:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "Drip Irrigation",
      "Sprinkler Systems",
      "Water Conservation",
      "System Design",
      "Repairs",
    ],
  },
  {
    id: "biz11",
    fullName: "Al-Fanar Agricultural Supplies",
    email: "sales@alfanar-agri.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=300",
    logo: "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=300",
    name: "Al-Fanar Agri",
    verified: true,
    bio: "Complete agricultural supplies including seeds, fertilizers, pesticides, and farming equipment. Serving farmers since 2010.",
    location: "Buraydah, Saudi Arabia",
    phone: "+966 16 111 2222",
    followers: 5890,
    following: 134,
    businessId: "11",
    companyName: "Al-Fanar Agricultural Supplies",
    joinDate: "Mar 2010",
    rating: 4.6,
    reviewsCount: 567,
    reviews: 567,
    hours: [
      "Saturday - Thursday: 7:00 AM - 6:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "Seeds",
      "Fertilizers",
      "Pesticides",
      "Farm Tools",
      "Consultation",
    ],
  },
  {
    id: "biz12",
    fullName: "Kingdom Livestock Feed",
    email: "info@kingdomfeed.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=300",
    logo: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=300",
    name: "Kingdom Feed",
    verified: true,
    bio: "Premium livestock feed and animal nutrition products. Quality feed for healthy livestock.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 333 4444",
    followers: 4567,
    following: 89,
    businessId: "12",
    companyName: "Kingdom Livestock Feed",
    joinDate: "Jun 2016",
    rating: 4.7,
    reviewsCount: 423,
    reviews: 423,
    hours: [
      "Saturday - Thursday: 6:00 AM - 5:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "Cattle Feed",
      "Poultry Feed",
      "Sheep Feed",
      "Supplements",
      "Bulk Orders",
    ],
  },
  {
    id: "biz13",
    fullName: "Saudi Aquaponics Co.",
    email: "hello@saudiaquaponics.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1535379453347-1ffd615e2e08?w=300",
    logo: "https://images.unsplash.com/photo-1535379453347-1ffd615e2e08?w=300",
    name: "Saudi Aquaponics",
    verified: true,
    bio: "Innovative aquaponics systems combining fish farming with hydroponic plant production. Future of sustainable farming.",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 12 555 6666",
    followers: 3890,
    following: 178,
    businessId: "13",
    companyName: "Saudi Aquaponics Co.",
    joinDate: "Jan 2021",
    rating: 4.8,
    reviewsCount: 234,
    reviews: 234,
    hours: [
      "Sunday - Thursday: 9:00 AM - 5:00 PM",
      "Saturday: By Appointment",
      "Friday: Closed",
    ],
    specialties: [
      "Aquaponic Systems",
      "Fish Farming",
      "Training Courses",
      "System Maintenance",
      "Consulting",
    ],
  },
  {
    id: "biz14",
    fullName: "Desert Rose Landscaping",
    email: "contact@desertrosescape.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=300",
    logo: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=300",
    name: "Desert Rose",
    verified: false,
    bio: "Professional landscaping services for residential and commercial properties. Creating beautiful outdoor spaces.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 222 3333",
    followers: 2890,
    following: 234,
    businessId: "14",
    companyName: "Desert Rose Landscaping",
    joinDate: "May 2020",
    rating: 4.5,
    reviewsCount: 178,
    reviews: 178,
    hours: [
      "Saturday - Thursday: 8:00 AM - 4:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "Garden Design",
      "Plant Installation",
      "Irrigation Setup",
      "Maintenance",
      "Hardscaping",
    ],
  },
  {
    id: "biz15",
    fullName: "Organic Valley Farm",
    email: "sales@organicvalley.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=300",
    logo: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=300",
    name: "Organic Valley",
    verified: true,
    bio: "Certified organic farm producing fresh vegetables, herbs, and fruits. Farm-to-table freshness guaranteed.",
    location: "Al-Kharj, Saudi Arabia",
    phone: "+966 11 444 5555",
    followers: 6780,
    following: 123,
    businessId: "15",
    companyName: "Organic Valley Farm",
    joinDate: "Feb 2017",
    rating: 4.9,
    reviewsCount: 890,
    reviews: 890,
    hours: ["Daily: 6:00 AM - 2:00 PM"],
    specialties: [
      "Organic Vegetables",
      "Fresh Herbs",
      "Seasonal Fruits",
      "Farm Tours",
      "Delivery Service",
    ],
  },
  {
    id: "biz16",
    fullName: "Modern Agri Drones",
    email: "info@agridrones.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300",
    logo: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300",
    name: "Agri Drones",
    verified: true,
    bio: "Agricultural drone services for crop monitoring, spraying, and field mapping. Precision agriculture from above.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 666 7777",
    followers: 4567,
    following: 189,
    businessId: "16",
    companyName: "Modern Agri Drones",
    joinDate: "Sep 2020",
    rating: 4.8,
    reviewsCount: 312,
    reviews: 312,
    hours: [
      "Sunday - Thursday: 8:00 AM - 6:00 PM",
      "Friday & Saturday: Closed",
    ],
    specialties: [
      "Crop Monitoring",
      "Precision Spraying",
      "Field Mapping",
      "Drone Sales",
      "Training",
    ],
  },
  {
    id: "biz17",
    fullName: "Gulf Mushroom Farm",
    email: "sales@gulfmushroom.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    name: "Gulf Mushroom",
    verified: false,
    bio: "Specialty mushroom cultivation. Growing oyster, shiitake, and medicinal mushrooms in climate-controlled facilities.",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 12 777 8888",
    followers: 2345,
    following: 156,
    businessId: "17",
    companyName: "Gulf Mushroom Farm",
    joinDate: "Nov 2021",
    rating: 4.6,
    reviewsCount: 156,
    reviews: 156,
    hours: [
      "Saturday - Thursday: 9:00 AM - 5:00 PM",
      "Friday: Closed",
    ],
    specialties: [
      "Oyster Mushrooms",
      "Shiitake",
      "Growing Kits",
      "Fresh Delivery",
      "Wholesale",
    ],
  },
  {
    id: "biz18",
    fullName: "Saudi Bee Products",
    email: "info@saudibee.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1587049352846-4a222e784578?w=300",
    logo: "https://images.unsplash.com/photo-1587049352846-4a222e784578?w=300",
    name: "Saudi Bee",
    verified: true,
    bio: "Pure honey, royal jelly, bee pollen, and beekeeping supplies. Supporting local beekeepers and pollination.",
    location: "Taif, Saudi Arabia",
    phone: "+966 12 888 9999",
    followers: 5670,
    following: 98,
    businessId: "18",
    companyName: "Saudi Bee Products",
    joinDate: "Apr 2015",
    rating: 4.9,
    reviewsCount: 678,
    reviews: 678,
    hours: ["Daily: 8:00 AM - 8:00 PM"],
    specialties: [
      "Pure Honey",
      "Royal Jelly",
      "Beekeeping Equipment",
      "Bee Colonies",
      "Training",
    ],
  },
  {
    id: "biz19",
    fullName: "Najd Agricultural Bank",
    email: "loans@najdagribank.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=300",
    logo: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=300",
    name: "Najd Agri Bank",
    verified: true,
    bio: "Agricultural financing and microloans for farmers. Helping grow Saudi agriculture through accessible credit.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 999 0000",
    followers: 3456,
    following: 67,
    businessId: "19",
    companyName: "Najd Agricultural Bank",
    joinDate: "Jan 2012",
    rating: 4.4,
    reviewsCount: 234,
    reviews: 234,
    hours: [
      "Sunday - Thursday: 9:00 AM - 3:00 PM",
      "Friday & Saturday: Closed",
    ],
    specialties: [
      "Farm Loans",
      "Equipment Financing",
      "Insurance",
      "Financial Consulting",
      "Government Programs",
    ],
  },
  {
    id: "biz20",
    fullName: "Arabian Herbs & Spices",
    email: "sales@arabianherbs.sa",
    role: "business",
    avatar:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300",
    logo: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300",
    name: "Arabian Herbs",
    verified: false,
    bio: "Dried herbs, medicinal plants, and traditional spices. From our farm to your kitchen.",
    location: "Al-Baha, Saudi Arabia",
    phone: "+966 17 111 2222",
    followers: 4890,
    following: 145,
    businessId: "20",
    companyName: "Arabian Herbs & Spices",
    joinDate: "Jul 2019",
    rating: 4.7,
    reviewsCount: 456,
    reviews: 456,
    hours: [
      "Saturday - Thursday: 10:00 AM - 7:00 PM",
      "Friday: 3:00 PM - 9:00 PM",
    ],
    specialties: [
      "Dried Herbs",
      "Medicinal Plants",
      "Traditional Spices",
      "Herb Seeds",
      "Gift Packages",
    ],
  },

  // REGULAR VISITORS (20 total)
  {
    id: "user1",
    fullName: "Farmer Ali",
    email: "ali.farmer@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    verified: false,
    bio: "Small farm owner in Riyadh. Growing organic tomatoes and vegetables. Always learning new farming techniques.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 50 789 1234",
    followers: 234,
    following: 567,
    joinDate: "Jul 2021",
  },
  {
    id: "user2",
    fullName: "Sarah Ahmed",
    email: "sarah.ahmed@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    verified: false,
    bio: "Urban gardening enthusiast. Just started my rooftop garden journey in Jeddah. Love connecting with other gardeners!",
    location: "Jeddah, Saudi Arabia",
    phone: "+966 50 890 1234",
    followers: 156,
    following: 432,
    joinDate: "Jan 2022",
  },
  {
    id: "user3",
    fullName: "Mohammed Hassan",
    email: "mhhassan@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
    verified: false,
    bio: "Passionate about sustainable agriculture. Learning from the best in the community.",
    location: "Dammam, Saudi Arabia",
    phone: "+966 55 901 2345",
    followers: 89,
    following: 234,
    joinDate: "Mar 2021",
  },
  {
    id: "user4",
    fullName: "Fatima Al-Zahrani",
    email: "fatima.z@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    verified: false,
    bio: "Home gardener and plant lover. Growing herbs and flowers in my backyard.",
    location: "Taif, Saudi Arabia",
    phone: "+966 12 012 3456",
    followers: 312,
    following: 189,
    joinDate: "Aug 2021",
  },
  {
    id: "user5",
    fullName: "Ahmad",
    email: "ahmad@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    verified: false,
    bio: "Interested in smart farming technology. Planning to upgrade my family farm.",
    location: "Khobar, Saudi Arabia",
    phone: "+966 13 123 4567",
    followers: 145,
    following: 398,
    joinDate: "Oct 2021",
  },
  {
    id: "user6",
    fullName: "Layla Ibrahim",
    email: "layla.ibrahim@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    verified: false,
    bio: "Small-scale farmer focusing on organic practices. Always seeking advice from experienced farmers.",
    location: "Hail, Saudi Arabia",
    phone: "+966 16 234 5678",
    followers: 201,
    following: 445,
    joinDate: "Dec 2020",
  },
  {
    id: "user7",
    fullName: "Omar Abdullah",
    email: "omar.abdullah@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=300",
    verified: false,
    bio: "Farm owner in Riyadh looking to improve soil quality and crop yield through modern techniques.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 345 6789",
    followers: 178,
    following: 312,
    joinDate: "Apr 2021",
  },
  {
    id: "user8",
    fullName: "Nora Salem",
    email: "nora.salem@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300",
    verified: false,
    bio: "Gardening hobbyist and plant collector. Love sharing tips and learning from the community.",
    location: "Medina, Saudi Arabia",
    phone: "+966 14 456 7890",
    followers: 267,
    following: 523,
    joinDate: "Jun 2021",
  },
  {
    id: "user9",
    fullName: "Aisha Al-Ghamdi",
    email: "aisha.ghamdi@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300",
    verified: false,
    bio: "Organic food blogger sharing recipes and gardening tips.",
    location: "Mecca, Saudi Arabia",
    phone: "+966 12 666 7777",
    followers: 678,
    following: 345,
    joinDate: "Apr 2023",
  },
  {
    id: "user10",
    fullName: "Khalid Al-Dosari",
    email: "khalid.dosari@hotmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300",
    verified: false,
    bio: "Retired engineer now enjoying farming as a hobby. Never too late to start!",
    location: "Khobar, Saudi Arabia",
    phone: "+966 13 777 8888",
    followers: 234,
    following: 178,
    joinDate: "Jun 2022",
  },
  {
    id: "user11",
    fullName: "Noura Al-Subaie",
    email: "noura.subaie@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    verified: false,
    bio: "Mother of three teaching my kids about where food comes from.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 50 888 9999",
    followers: 145,
    following: 267,
    joinDate: "Oct 2023",
  },
  {
    id: "user12",
    fullName: "Tariq Al-Mutairi",
    email: "tariq.mutairi@yahoo.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    verified: false,
    bio: "Livestock farmer interested in better grazing management and feed quality.",
    location: "Hail, Saudi Arabia",
    phone: "+966 16 999 0000",
    followers: 312,
    following: 145,
    joinDate: "Feb 2022",
  },
  {
    id: "user13",
    fullName: "Reem Al-Balawi",
    email: "reem.balawi@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300",
    verified: false,
    bio: "Flower enthusiast growing roses and exotic blooms in my greenhouse.",
    location: "Tabuk, Saudi Arabia",
    phone: "+966 14 111 2222",
    followers: 523,
    following: 234,
    joinDate: "May 2023",
  },
  {
    id: "user14",
    fullName: "Omar Al-Shehri",
    email: "omar.shehri@outlook.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
    verified: false,
    bio: "Coffee farm owner experimenting with growing coffee in Saudi Arabia.",
    location: "Jazan, Saudi Arabia",
    phone: "+966 17 222 3333",
    followers: 789,
    following: 312,
    joinDate: "Jul 2021",
  },
  {
    id: "user15",
    fullName: "Fatima Al-Amoudi",
    email: "fatima.amoudi@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    verified: false,
    bio: "Herbs and medicinal plants grower. Natural remedies from my garden.",
    location: "Medina, Saudi Arabia",
    phone: "+966 14 333 4444",
    followers: 423,
    following: 298,
    joinDate: "Nov 2022",
  },
  {
    id: "user16",
    fullName: "Yousef Al-Harthy",
    email: "yousef.harthy@hotmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    verified: false,
    bio: "Beginner farmer seeking advice on starting a small vegetable farm.",
    location: "Najran, Saudi Arabia",
    phone: "+966 17 444 5555",
    followers: 67,
    following: 423,
    joinDate: "Jan 2025",
  },
  {
    id: "user17",
    fullName: "Salma Al-Qassim",
    email: "salma.qassim@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
    verified: false,
    bio: "Rooftop gardener in the city. Maximizing small spaces for big harvests!",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 50 555 6666",
    followers: 234,
    following: 345,
    joinDate: "Aug 2023",
  },
  {
    id: "user18",
    fullName: "Mansour Al-Shamrani",
    email: "mansour.shamrani@yahoo.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    verified: false,
    bio: "Date palm farmer maintaining family traditions while embracing new technology.",
    location: "Al-Ahsa, Saudi Arabia",
    phone: "+966 13 666 7777",
    followers: 456,
    following: 234,
    joinDate: "Apr 2022",
  },
  {
    id: "user19",
    fullName: "Abeer Al-Thani",
    email: "abeer.thani@gmail.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300",
    verified: false,
    bio: "School teacher with a passion for teaching kids about plants and nature.",
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 777 8888",
    followers: 189,
    following: 456,
    joinDate: "Sep 2023",
  },
  {
    id: "user20",
    fullName: "Hassan Al-Fayez",
    email: "hassan.fayez@outlook.com",
    role: "visitor",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
    verified: false,
    bio: "Greenhouse hobbyist growing tomatoes and cucumbers year-round.",
    location: "Dammam, Saudi Arabia",
    phone: "+966 13 888 9999",
    followers: 312,
    following: 289,
    joinDate: "Dec 2022",
  },
];

// Import extended data
import {
  extendedMockPosts,
  extendedMockThreads,
  extendedMockProducts,
  extendedMockComments,
} from "./mockDataExtension";

// POSTS DATA - combining base posts with extended posts
export const mockPosts: MockPost[] = [
  {
    id: "p1",
    authorId: "biz1",
    title: "Seasonal Promotion: 20% Off All Seedlings",
    content:
      "We are excited to announce our seasonal sale! Get 20% off all organic date palm and citrus seedlings this week only. Perfect for the upcoming planting season.",
    image:
      "https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?w=1080",
    tags: ["Sale", "Nursery", "Plants"],
    likes: 245,
    commentsCount: 12,
    shares: 45,
    timeAgo: "2 hours ago",
    isLiked: false,
    isSaved: false,
    timestamp: "2026-02-10T08:00:00Z",
  },
  {
    id: "p2",
    authorId: "eng1",
    title: "Smart Irrigation Tip: Use Soil Moisture Sensors",
    content:
      "Stop guessing when to water! Soil moisture sensors connected to your smart hub can save up to 30% of your water consumption while keeping your plants at optimal health.",
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1080",
    tags: ["Tech", "Irrigation", "Efficiency"],
    likes: 189,
    commentsCount: 8,
    shares: 23,
    timeAgo: "5 hours ago",
    isLiked: true,
    isSaved: false,
    timestamp: "2026-02-10T05:00:00Z",
  },
  {
    id: "p3",
    authorId: "me",
    title: "My First Harvest!",
    content:
      "Finally harvested my organic tomatoes today. The results are incredible thanks to the advice from Engineer Hassan. The taste is unlike anything from the supermarket!",
    image:
      "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1080",
    tags: ["Harvest", "Organic", "Happy"],
    likes: 342,
    commentsCount: 28,
    shares: 45,
    timeAgo: "1 day ago",
    isLiked: false,
    isSaved: true,
    timestamp: "2026-02-09T14:00:00Z",
  },
  {
    id: "p4",
    authorId: "agr1",
    title: "Dealing with Whiteflies Naturally",
    content:
      "Whiteflies can be a nightmare for greenhouse crops. Instead of harsh chemicals, try using neem oil or introducing ladybugs.",
    image:
      "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1080",
    tags: ["PestControl", "Organic", "Education"],
    likes: 312,
    commentsCount: 15,
    shares: 88,
    timeAgo: "2 days ago",
    isLiked: false,
    isSaved: false,
    timestamp: "2026-02-08T10:00:00Z",
  },
  {
    id: "p5",
    authorId: "biz2",
    title: "New IoT Sensor Line Launched",
    content:
      "Introducing our latest smart farming sensors with 5-year battery life and real-time cloud monitoring. Agriculture 4.0 is here!",
    image:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1080",
    tags: ["IoT", "Technology", "SmartFarming"],
    likes: 334,
    commentsCount: 19,
    shares: 67,
    timeAgo: "4 hours ago",
    isLiked: false,
    isSaved: true,
    timestamp: "2026-02-10T06:00:00Z",
  },
  ...extendedMockPosts,
];

export const mockThreads: MockThread[] = [
  {
    id: "t1",
    authorId: "me",
    title: "Best time for planting wheat in Riyadh?",
    content:
      "I'm planning my next cycle and wanted to get some advice on the exact dates for planting wheat this year. Any engineers have tips?",
    tags: ["Advice", "Wheat", "Riyadh"],
    likes: 12,
    commentsCount: 5,
    shares: 2,
    timeAgo: "1 day ago",
    isLiked: false,
    isSaved: false,
    timestamp: "2026-02-09T09:00:00Z",
  },
  {
    id: "t2",
    authorId: "user1",
    title: "How to start a hydroponic system at home?",
    content:
      "I have a small balcony and I want to start a hydroponic system. What is the minimum equipment I need?",
    tags: ["Hydroponics", "Beginner", "HomeGardening"],
    likes: 24,
    commentsCount: 18,
    shares: 10,
    timeAgo: "3 days ago",
    isLiked: false,
    isSaved: true,
    timestamp: "2026-02-07T11:00:00Z",
  },
  ...extendedMockThreads,
];

export const mockComments: MockComment[] = [
  {
    id: "c1",
    parentId: "p3",
    authorId: "eng1",
    content:
      "Great job Ahmed! Those tomatoes look healthy. Make sure to keep the soil moisture consistent during the final ripening phase.",
    timeAgo: "20 hours ago",
    likes: 28,
    isLiked: true,
  },
  {
    id: "c2",
    parentId: "t1",
    authorId: "eng1",
    content:
      "Typically, mid-November to early December is the sweet spot for Riyadh. The temperature profile fits the growth stages perfectly.",
    timeAgo: "22 hours ago",
    likes: 45,
    isLiked: true,
  },
  {
    id: "c3",
    parentId: "t1",
    authorId: "agr1",
    content:
      "I agree with Hassan. Also, consider the soil preparation at least two weeks before. Have you done a soil test recently?",
    timeAgo: "21 hours ago",
    likes: 32,
    isLiked: false,
  },
  ...extendedMockComments,
];

export const mockProducts: MockProduct[] = [
  {
    id: "prod1",
    businessId: "1",
    name: "Organic Date Palm Seedling",
    description:
      "High-quality Medjool date palm seedling, 2 years old, nursery raised in Saudi soil.",
    price: 150,
    image:
      "https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?w=800",
    category: "plants",
    stock: 50,
    rating: 4.8,
    reviewsCount: 45,
  },
  {
    id: "prod2",
    businessId: "1",
    name: "Liquid Organic Fertilizer",
    description:
      "Concentrated organic fertilizer rich in nitrogen and potassium for leafy greens.",
    price: 85,
    image:
      "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=800",
    category: "fertilizers",
    stock: 100,
    rating: 4.5,
    reviewsCount: 12,
  },
  {
    id: "prod3",
    businessId: "2",
    name: "Pro Moisture Sensor Hub",
    description:
      "IoT-enabled soil moisture sensor with smartphone integration and automated alerts.",
    price: 450,
    image:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800",
    category: "tools",
    stock: 15,
    rating: 4.9,
    reviewsCount: 38,
  },
  ...extendedMockProducts,
];

export const mockNotifications: MockNotification[] = [
  {
    id: "n1",
    type: "message",
    message:
      "Engineer Hassan sent you a message about your irrigation setup.",
    read: false,
    time: "10 mins ago",
    timestamp: "2026-02-10T11:50:00Z",
    relatedUserId: "eng1",
  },
  {
    id: "n2",
    type: "comment",
    message:
      'Engineer Hassan commented on your post "My First Harvest!"',
    read: false,
    time: "20 hours ago",
    timestamp: "2026-02-09T16:00:00Z",
    relatedUserId: "eng1",
    postId: "p3",
    authorId: "me",
    commentId: "c1",
    openComments: true,
  },
  {
    id: "n3",
    type: "follow",
    message: "Green Valley Nursery started following you.",
    read: false,
    time: "1 day ago",
    timestamp: "2026-02-09T08:00:00Z",
    relatedUserId: "biz1",
  },
  {
    id: "n4",
    type: "like",
    message:
      "Dr. Fatima Al-Rashid liked your thread about wheat planting.",
    read: true,
    time: "2 days ago",
    timestamp: "2026-02-08T12:00:00Z",
    relatedUserId: "agr1",
    threadId: "t1",
  },
];

export const mockChats: MockChat[] = [
  {
    id: "chat1",
    participants: ["me", "eng1"],
    lastMessage:
      "The sensors are arriving tomorrow. I can help with setup.",
    lastMessageTime: "10 mins ago",
    unreadCount: 1,
  },
  {
    id: "chat2",
    participants: ["me", "biz1"],
    lastMessage: "Your order #1234 has been confirmed.",
    lastMessageTime: "1 day ago",
    unreadCount: 0,
  },
];

export const mockChatMessages: MockChatMessage[] = [
  {
    id: "m1",
    chatId: "chat1",
    senderId: "eng1",
    text: "Hello Ahmed, how is the irrigation system doing?",
    timestamp: "2026-02-10T10:00:00Z",
    read: true,
  },
  {
    id: "m2",
    chatId: "chat1",
    senderId: "me",
    text: "It is working well, but I think the pressure is a bit low in the north section.",
    timestamp: "2026-02-10T10:05:00Z",
    read: true,
  },
  {
    id: "m3",
    chatId: "chat1",
    senderId: "eng1",
    text: "The sensors are arriving tomorrow. I can help with setup.",
    timestamp: "2026-02-10T11:50:00Z",
    read: false,
  },
];

export const analyticsData = {
  profileViews: [
    { name: "Mon", value: 45 },
    { name: "Tue", value: 52 },
    { name: "Wed", value: 38 },
    { name: "Thu", value: 65 },
    { name: "Fri", value: 48 },
    { name: "Sat", value: 30 },
    { name: "Sun", value: 40 },
  ],
  engagement: [
    { name: "Likes", value: 450 },
    { name: "Comments", value: 120 },
    { name: "Shares", value: 55 },
  ],
  sales: [
    { name: "Jan", value: 1200 },
    { name: "Feb", value: 1800 },
    { name: "Mar", value: 2200 },
  ],
};

// Helper functions
export function getTotalCommentCount(postId: string): number {
  const comments = mockComments.filter(
    (c) => c.parentId === postId,
  );
  return comments.length;
}

export function getPostsByAuthorId(
  authorId: string,
): MockPost[] {
  return mockPosts.filter((post) => post.authorId === authorId);
}

export function getThreadsByAuthorId(
  authorId: string,
): MockThread[] {
  return mockThreads.filter(
    (thread) => thread.authorId === authorId,
  );
}

export function getUserById(
  userId: string,
): MockUser | undefined {
  if (userId === "me") return currentUser;
  return otherUsers.find((u) => u.id === userId);
}

export function getPostById(
  postId: string,
): MockPost | undefined {
  return mockPosts.find((p) => p.id === postId);
}

export function getThreadById(
  threadId: string,
): MockThread | undefined {
  return mockThreads.find((t) => t.id === threadId);
}

// Re-export threadComments from threadsCommentsData
export { importedThreadComments as threadComments };