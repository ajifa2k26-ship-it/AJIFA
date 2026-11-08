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
  updatedAt?: string;
};
