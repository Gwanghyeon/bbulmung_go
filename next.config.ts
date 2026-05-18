import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // preact → react alias: shudan(@sabaki/shudan)이 React 런타임으로 동작하도록 합니다.
    // Vertex.js 등 내부 컴포넌트가 React hooks를 사용하게 되어 __H 충돌이 해소됩니다.
    config.resolve.alias = {
      ...((config.resolve.alias as Record<string, string>) || {}),
      "preact": "react",
      "preact/hooks": "react",
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
