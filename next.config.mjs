/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers", "@prisma/client", "prisma"],
  },
  webpack: (config) => {
    // sharp / onnxruntime-node are native binary deps used by transformers.js
    config.externals = [...(config.externals || []), "sharp", "onnxruntime-node"]
    return config
  },
}

export default nextConfig
