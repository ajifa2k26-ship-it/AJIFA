import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({ url: String, publicId: String, alt: String }, { _id: false });

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '', maxlength: 1000 },
    image: { type: imageSchema, default: null },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.set('toJSON', { versionKey: false });

export const Category = mongoose.model('Category', categorySchema);
