const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" }, // Facebook
      { protocol: "https", hostname: "graph.facebook.com" }, // Facebook
      { protocol: "https", hostname: "utfs.io" }, // ✅ UploadThing
    ],
  },
};

export default nextConfig;
