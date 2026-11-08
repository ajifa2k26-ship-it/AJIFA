// Configuration centralisée, lue depuis les variables d'environnement.
const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT) || 4000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Liste d'origines autorisées séparées par des virgules (ex : https://ajifa.sn,https://www.ajifa.sn)
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME || 'Administratrice',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'ajifa',
  },
  // Optionnel : URL + secret pour demander au site Next.js de se régénérer après une modification
  frontend: {
    revalidateUrl: process.env.FRONTEND_REVALIDATE_URL,
    revalidateSecret: process.env.REVALIDATE_SECRET,
  },
};
