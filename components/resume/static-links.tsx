"use client";

import { createContext, useContext } from "react";

/**
 * Resume previews that live inside a clickable card must not emit real anchors:
 * an <a> inside an <a> is invalid HTML and triggers a hydration error. In static
 * mode the same markup is rendered with spans, so previews stay pixel-identical
 * but nothing inside a thumbnail is focusable.
 */
const StaticLinksContext = createContext(false);

export const StaticLinksProvider = StaticLinksContext.Provider;
export const useStaticLinks = () => useContext(StaticLinksContext);
