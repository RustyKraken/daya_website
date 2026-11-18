// Shared URLs and contact details. The full website currently lives under /preview/ while the root shows the coming-soon page.
export const BASE = import.meta.env.BASE_URL;
export const SITE_HOME = `${BASE}preview/`;
export const PLANT_URL = `${BASE}plant-your-seed/`;
export const asset = (path) => `${BASE}${path.replace(/^\/+/, '')}`;

// ---------- Menus ----------
// Each card has its own link, so lunch, dinner and drinks can be updated independently.
// To publish a new card: put the PDF into public/menus/ (e.g. public/menus/lunch.pdf) and set
// href to asset('menus/lunch.pdf'). Replacing that file later updates the card without touching code.
// Lunch and dinner currently share the digital food menu; drinks has its own.
const FOOD_MENU_URL = 'https://www.reservly.at/speisekarte/en/daya/food';
const DRINKS_MENU_URL = 'https://www.reservly.at/speisekarte/en/daya/drinks';
export const MENUS = [
  { id: 'lunch', label: 'Lunch Menu', href: FOOD_MENU_URL },
  { id: 'dinner', label: 'Dinner Menu', href: FOOD_MENU_URL },
  { id: 'drinks', label: 'Drinks Menu', href: DRINKS_MENU_URL },
];

// ---------- Visit & contact ----------
// Empty values are simply not shown on the site, so nothing unconfirmed gets published.
export const VISIT = {
  addressLines: ['Carrer del Faisà, 8', '07819 Jesús, Ibiza', 'Illes Balears, Spain'],
  openingDays: 'Wednesday – Monday · Closed on Tuesdays',
  phone: '+34 610 71 79 31',
  whatsapp: '', // TODO: digits only with country code, e.g. '34600000000' — becomes the "Contact Us" button
  email: 'office@dayaibiza.com',
  mapsUrl: 'https://maps.app.goo.gl/9EpmPsFSPQe6P6By5',
  mapsEmbedUrl: 'https://www.google.com/maps?q=DAYA%2C%20Carrer%20del%20Fais%C3%A0%208%2C%2007819%20Jes%C3%BAs&output=embed',
  instagram: 'https://www.instagram.com/dayaibiza/',
  privacyUrl: '', // TODO: link once the privacy policy exists
  legalUrl: '', // TODO: link once the legal notice exists
};
export const CONTACT_URL = VISIT.whatsapp ? `https://wa.me/${VISIT.whatsapp}` : `mailto:${VISIT.email}`;
