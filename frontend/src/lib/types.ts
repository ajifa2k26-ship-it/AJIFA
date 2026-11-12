export type ImageAsset = { url: string; publicId?: string; alt?: string };

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: ImageAsset | null;
  order: number;
  visible: boolean;
  productCount?: number;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number | null;
  compareAtPrice: number | null;
  category: Pick<Category, '_id' | 'name' | 'slug'> | null;
  images: ImageAsset[];
  sizes: string[];
  colors: string[];
  fabric: string;
  featured: boolean;
  isNewArrival: boolean;
  available: boolean;
  published: boolean;
  order: number;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: ImageAsset | null;
  aboutTitle: string;
  aboutText: string;
  aboutImage: ImageAsset | null;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  announcement: string;
  seoDescription: string;
  codEnabled: boolean;
  orangeMoneyNumber: string;
  waveNumber: string;
  waveLink: string;
  freeMoneyNumber: string;
  paymentUpdatedAt?: string | null;
  allowedOrigins?: string[];
  deliveryFeeDakar: number;
  deliveryFeeRegions: number;
  freeDeliveryFrom: number;
  deliveryInfo: string;
  updatedAt?: string;
};

export type PaymentMethod = 'cash' | 'orange_money' | 'wave' | 'free_money';
export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type OrderItem = {
  product?: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

/** Commande telle que renvoyée à la cliente */
export type PublicOrder = {
  number: string;
  createdAt: string;
  customer: { name: string; city: string };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  status: OrderStatus;
};

/** Commande complète (administration) */
export type Order = Omit<PublicOrder, 'customer'> & {
  _id: string;
  customer: { name: string; phone: string; city: string; address: string; note: string };
  deliveryZone: 'dakar' | 'regions';
  adminNote: string;
  updatedAt: string;
};
