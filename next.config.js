const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: { locales: ["pl", "en"], defaultLocale: "pl" },
  env: { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL }
};
module.exports = nextConfig;
