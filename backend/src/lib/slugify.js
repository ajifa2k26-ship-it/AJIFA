export function slugify(input = '') {
  return String(input)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Garantit un slug unique dans une collection Mongoose
export async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base) || 'article';
  let slug = root;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${root}-${i++}`;
  }
  return slug;
}
