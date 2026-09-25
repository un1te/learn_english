/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pixabay.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "**.pixabay.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
