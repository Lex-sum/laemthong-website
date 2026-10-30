export const COMPANY = {
  phone: "+66-2-538-4949",
  phoneTel: "tel:+6625384949",
  email: "sales@laemthong.co.th",
  address: "1188 Soi Ladprao 87 (Chantrasuk), Khlong Chan, Bang Kapi, Bangkok 10240",
  foundedYear: 1966,
  stats: {
    years: 60,
    brands: 19,
    products: 5000,
    clients: 10000,
  },
} as const;

/** Most images one product can have (product form, bulk image import, server checks). */
export const MAX_PRODUCT_IMAGES = 10;

export const STAGGER_DELAY = 100;
export const MAX_STAGGER_DELAY = 400;
