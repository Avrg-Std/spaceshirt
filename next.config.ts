import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "airtable.com" },
      { protocol: "https", hostname: "dl.airtable.com" },
      { protocol: "https", hostname: "v5.airtableusercontent.com" },
      { protocol: "https", hostname: "v6.airtableusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
