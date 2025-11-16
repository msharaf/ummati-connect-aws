/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    serverActions: true
  },
  transpilePackages: ["@ummati/api", "@ummati/db"]
};

export default config;

