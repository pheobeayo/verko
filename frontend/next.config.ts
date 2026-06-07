import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      accounts: false,
      "porto": false,
      "porto/internal": false,
      "@base-org/account": false,
      "@metamask/connect-evm": false,
      "@walletconnect/ethereum-provider": false,
    };
    return config;
  },
};

export default nextConfig;