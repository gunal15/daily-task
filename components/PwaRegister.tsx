"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateManifest = () => {
      const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifest) {
        manifest.href = media.matches ? "/manifest-dark.webmanifest" : "/manifest.webmanifest";
      }
    };

    updateManifest();
    media.addEventListener("change", updateManifest);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA registration is best effort; the app still works without it.
      });
    }

    return () => media.removeEventListener("change", updateManifest);
  }, []);

  return null;
}
