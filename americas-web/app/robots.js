export default function robots() {
  const base = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/mis-pedidos'] }], sitemap: base ? base + '/sitemap.xml' : undefined };
}
