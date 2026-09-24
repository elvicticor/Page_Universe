import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  // Hay un package-lock.json en la carpeta de usuario; fijamos la raíz del proyecto.
  turbopack: { root: __dirname },
};

export default nextConfig;
