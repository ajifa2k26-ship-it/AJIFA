import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({ url: String, publicId: String, alt: String }, { _id: false });

// Document unique contenant les textes et coordonnées modifiables depuis l'admin
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'AJIFA' },
    tagline: { type: String, default: 'Élégance & savoir-faire' },
    heroTitle: { type: String, default: "L'élégance qui vous ressemble" },
    heroSubtitle: {
      type: String,
      default: 'Des pièces raffinées, pensées à Dakar pour sublimer chaque moment.',
    },
    heroImage: { type: imageSchema, default: null },
    aboutTitle: { type: String, default: 'La maison AJIFA' },
    aboutText: {
      type: String,
      default:
        "AJIFA est une maison de mode sénégalaise qui allie l'héritage du savoir-faire local à une élégance intemporelle. Chaque pièce est choisie avec soin pour sa coupe, sa matière et son caractère.",
    },
    aboutImage: { type: imageSchema, default: null },
    whatsapp: { type: String, default: '' }, // format international sans + ni espaces, ex : 221771234567
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: 'Dakar, Sénégal' },
    openingHours: { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    announcement: { type: String, default: '' }, // bandeau en haut du site
    seoDescription: {
      type: String,
      default: 'AJIFA, boutique de mode élégante à Dakar, Sénégal. Découvrez nos collections de vêtements raffinés.',
    },
  },
  { timestamps: true },
);

settingsSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.key;
    return ret;
  },
});

settingsSchema.statics.getSingleton = async function getSingleton() {
  return this.findOneAndUpdate({ key: 'site' }, { $setOnInsert: { key: 'site' } }, { upsert: true, returnDocument: 'after' });
};

export const Settings = mongoose.model('Settings', settingsSchema);
