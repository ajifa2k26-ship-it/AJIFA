import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({ url: String, publicId: String, alt: String }, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '', maxlength: 5000 },
    // Prix en francs CFA (XOF), entier
    price: { type: Number, min: 0, default: null },
    compareAtPrice: { type: Number, min: 0, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    images: { type: [imageSchema], default: [] },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    fabric: { type: String, default: '', maxlength: 200 },
    featured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    seoTitle: { type: String, default: '', maxlength: 70 },
    seoDescription: { type: String, default: '', maxlength: 170 },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.set('toJSON', { versionKey: false });

export const Product = mongoose.model('Product', productSchema);
