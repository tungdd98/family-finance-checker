import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Finance",
    short_name: "Family Finance",
    description: "Quản lý tài chính gia đình tinh tế",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/app-icon.png",
        sizes: "1039x1024",
        type: "image/png",
      },
      {
        src: "/app-icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
