import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-VGEK4LYF2W", {
        page_path: location.pathname,
      });
    }
  }, [location]);
}
