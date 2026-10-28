// Shared URLs. The full website currently lives under /preview/ while the root shows the coming-soon page.
export const BASE = import.meta.env.BASE_URL;
export const SITE_HOME = `${BASE}preview/`;
export const PLANT_URL = `${BASE}plant-your-seed/`;
export const asset = (path) => `${BASE}${path.replace(/^\/+/, '')}`;
