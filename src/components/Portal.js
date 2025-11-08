"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }) {
  const elRef = useRef(null);

  if (!elRef.current && typeof document !== "undefined") {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof document === "undefined") return;
    document.body.appendChild(el);
    return () => {
      try {
        document.body.removeChild(el);
      } catch {
        // ignore
      }
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(children, elRef.current);
}
