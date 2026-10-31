"use client";

import { useEffect, useState } from "react";

export const useMediaQuery = (query: string, fallback = false): boolean => {
  const [matches, setMatches] = useState(fallback);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
};
