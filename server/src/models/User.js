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

    rating: { type: Number, default: 3.5, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },

    hours: [HoursSchema],

    about: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
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
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['visitor', 'agronomist', 'engineer', 'business', 'admin'],
      default: 'visitor',
    },

    avatar: String,
    verified: { type: Boolean, default: false },
    // Subscription status for engineer/business paid accounts.
    subscriptionStatus: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
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
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);

