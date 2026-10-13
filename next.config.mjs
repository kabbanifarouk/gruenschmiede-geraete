/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Service Worker nie zwischenspeichern, damit Updates sofort ankommen
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};
export default nextConfig;
