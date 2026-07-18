const mongoose = require('mongoose');

const HoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ],
    },
    open: [
      {
        from: String,
        to: String,
      },
    ],
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const BusinessProfileSchema = new mongoose.Schema(
  {
    bio: String,
    location: String,
    phone: String,

    companyName: String,
    specialties: [String],

    /** Optional street / detailed address (city goes in location) */
    address: String,
    /** Optional public contact email (account email stays on User.email) */
    contactEmail: String,
    website: String,

    rating: { type: Number, default: 3.5, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },

    hours: [HoursSchema],

    about: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    /** Whish Money payout identity (phone required to sell) */
    wishPhone: String,
    wishAccountNumber: String,
  },
  { _id: false }
);

const ProfessionalProfileSchema = new mongoose.Schema(
  {
    bio: String,
    location: String,
    phone: String,

    specialization: String,
    yearsExperience: Number,
    specialties: [String],

    rating: { type: Number, default: 3.5, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },

    about: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    // Password is absent for accounts created exclusively through Google.
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },

    role: {
      type: String,
      enum: ['visitor', 'business', 'admin'],
      default: 'visitor',
    },

    avatar: String,
    /** Horizontal profile header / cover image */
    coverImage: String,
    verified: { type: Boolean, default: false },
    // Subscription status for business paid accounts.
    subscriptionStatus: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    /** When the current paid period began */
    subscriptionStartedAt: { type: Date },
    /** When the current paid period ends (default 60 days from start) */
    subscriptionExpiresAt: { type: Date, index: true },
    /** Last time we sent "expires tomorrow" reminder */
    subscriptionExpiryReminderSentAt: { type: Date },
    // Visitor base profile fields.
    // These exist at the top-level because the frontend edits visitor profiles
    // the same way it edits business/professional basics.
    phone: String,
    location: String,
    bio: String,
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    businessProfile: BusinessProfileSchema,
    /** Filled on convert/signup-as-business; applied to businessProfile only after fee payment */
    pendingBusinessProfile: BusinessProfileSchema,
    professionalProfile: ProfessionalProfileSchema,
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    delete ret.googleId;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);

