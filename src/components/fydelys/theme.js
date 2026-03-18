"use client";

import { useState, useEffect } from "react";

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const C = {
  bg:"#F4EFE8", bgDeep:"#EDE6DC", surface:"#FFFFFF", surfaceWarm:"#FBF8F4",
  border:"#DDD5C8", borderSoft:"#EAE4DA",
  accent:"#B07848", accentDark:"#8C5E38", accentBg:"#F5EBE0", accentLight:"#F9F1E8",
  text:"#2A1F14", textMid:"#5C4A38", textSoft:"#8C7B6C", textMuted:"#B0A090",
  ok:"#4E8A58", okBg:"#E6F2E8", warn:"#A85030", warnBg:"#F5EAE6", info:"#3A6E90", infoBg:"#E6EFF5",
};

// Valeurs littérales — aucune dépendance sur C, pas de TDZ possible
const statusMap = {
  actif:    ["#4E8A58", "#E6F2E8"],
  suspendu: ["#A85030", "#F5EAE6"],
  nouveau:  ["#3A6E90", "#E6EFF5"],
  payé:     ["#4E8A58", "#E6F2E8"],
  impayé:   ["#A85030", "#F5EAE6"],
};

export { useWidth, C, statusMap };