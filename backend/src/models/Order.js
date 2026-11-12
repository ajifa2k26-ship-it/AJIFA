import mongoose from 'mongoose';

export const PAYMENT_METHODS = ['cash', 'orange_money', 'wave', 'free_money'];
export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    slug: String,
    image: String,
    price: { type: Number, required: true, min: 0 },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, max: 20 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      city: { type: String, required: true, trim: true, maxlength: 80 },
      address: { type: String, required: true, trim: true, maxlength: 400 },
      note: { type: String, default: '', trim: true, maxlength: 600 },
    },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryZone: { type: String, enum: ['dakar', 'regions'], required: true },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    // Référence de transaction saisie par la cliente après un paiement mobile (Orange Money, Wave…)
    paymentReference: { type: String, default: '', trim: true, maxlength: 80 },
    status: { type: String, enum: ORDER_STATUSES, default: 'new', index: true },
    adminNote: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.set('toJSON', { versionKey: false });

export const Order = mongoose.model('Order', orderSchema);

// Compteur pour des numéros de commande courts et lisibles : AJ-1001, AJ-1002…
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
const Counter = mongoose.model('Counter', counterSchema);

export async function nextOrderNumber() {
  const c = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  // seq vaut 1, 2, 3… : on décale pour commencer à AJ-1001
  return `AJ-${1000 + c.seq}`;
}
