"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

// Each theme entry: id, display label, and the 4 representative swatches (primary / secondary / accent / base-100 approximations)
const themes = [
  // ── Brand customs
  {
    id: "educare",
    label: "Educare",
    group: "Brand",
    swatches: ["#6366f1", "#8b5cf6", "#f59e0b", "#f8fafc"],
  },
  {
    id: "educare-dark",
    label: "Educare Dark",
    group: "Brand",
    swatches: ["#818cf8", "#a78bfa", "#fbbf24", "#0f172a"],
  },
  // ── Light themes
  {
    id: "light",
    label: "Light",
    group: "Light",
    swatches: ["#1d4ed8", "#7c3aed", "#e11d48", "#ffffff"],
  },
  {
    id: "cupcake",
    label: "Cupcake",
    group: "Light",
    swatches: ["#65c3c8", "#ef9fbc", "#eeaf3a", "#faf7f5"],
  },
  {
    id: "bumblebee",
    label: "Bumblebee",
    group: "Light",
    swatches: ["#e0a82e", "#f9d72f", "#181830", "#ffffff"],
  },
  {
    id: "emerald",
    label: "Emerald",
    group: "Light",
    swatches: ["#66cc8a", "#377cfb", "#ea5234", "#ffffff"],
  },
  {
    id: "corporate",
    label: "Corporate",
    group: "Light",
    swatches: ["#4b6bfb", "#7b92b2", "#67cba0", "#ffffff"],
  },
  {
    id: "retro",
    label: "Retro",
    group: "Light",
    swatches: ["#ef9995", "#a4cbb4", "#dc8850", "#e4d8b4"],
  },
  {
    id: "garden",
    label: "Garden",
    group: "Light",
    swatches: ["#5c7f67", "#ecf4e7", "#ff865b", "#e9e7e7"],
  },
  {
    id: "lofi",
    label: "Lo-Fi",
    group: "Light",
    swatches: ["#0d0d0d", "#1a1a1a", "#808080", "#ffffff"],
  },
  {
    id: "pastel",
    label: "Pastel",
    group: "Light",
    swatches: ["#d1c1d7", "#f6cbd1", "#b4e9d6", "#fdf6fd"],
  },
  {
    id: "fantasy",
    label: "Fantasy",
    group: "Light",
    swatches: ["#6e0b75", "#007ebd", "#f90057", "#ffffff"],
  },
  {
    id: "wireframe",
    label: "Wireframe",
    group: "Light",
    swatches: ["#b8b8b8", "#b8b8b8", "#b8b8b8", "#ffffff"],
  },
  {
    id: "cmyk",
    label: "CMYK",
    group: "Light",
    swatches: ["#45aeee", "#e8488a", "#e9b10a", "#ffffff"],
  },
  {
    id: "autumn",
    label: "Autumn",
    group: "Light",
    swatches: ["#8c0327", "#d85251", "#d59b6a", "#f1f1f1"],
  },
  {
    id: "acid",
    label: "Acid",
    group: "Light",
    swatches: ["#ff00f4", "#ff7400", "#00ffe2", "#f8f8f8"],
  },
  {
    id: "lemonade",
    label: "Lemonade",
    group: "Light",
    swatches: ["#519903", "#e9e92e", "#f1f1f1", "#ffffff"],
  },
  {
    id: "winter",
    label: "Winter",
    group: "Light",
    swatches: ["#047aff", "#463aa2", "#c148ac", "#f6f9fe"],
  },
  {
    id: "caramellatte",
    label: "Caramel",
    group: "Light",
    swatches: ["#865c40", "#b07d62", "#e4b48a", "#f8f0e8"],
  },
  {
    id: "silk",
    label: "Silk",
    group: "Light",
    swatches: ["#b5a9d4", "#e9c7d0", "#a8d4c2", "#fafafa"],
  },
  // ── Dark themes
  {
    id: "dark",
    label: "Dark",
    group: "Dark",
    swatches: ["#661ae6", "#d926aa", "#1fb2a5", "#1d232a"],
  },
  {
    id: "synthwave",
    label: "Synthwave",
    group: "Dark",
    swatches: ["#e779c1", "#58c7f3", "#f3cc30", "#1a103c"],
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    group: "Dark",
    swatches: ["#ff7598", "#75d1f0", "#c07828", "#ffee00"],
  },
  {
    id: "halloween",
    label: "Halloween",
    group: "Dark",
    swatches: ["#f28c18", "#6d3a63", "#51a800", "#212121"],
  },
  {
    id: "forest",
    label: "Forest",
    group: "Dark",
    swatches: ["#1eb854", "#1db88e", "#e8a534", "#171212"],
  },
  {
    id: "aqua",
    label: "Aqua",
    group: "Dark",
    swatches: ["#09ecf3", "#966fb3", "#ffe999", "#345da7"],
  },
  {
    id: "black",
    label: "Black",
    group: "Dark",
    swatches: ["#343232", "#343232", "#343232", "#000000"],
  },
  {
    id: "luxury",
    label: "Luxury",
    group: "Dark",
    swatches: ["#ffffff", "#152747", "#513448", "#09090b"],
  },
  {
    id: "dracula",
    label: "Dracula",
    group: "Dark",
    swatches: ["#ff79c6", "#bd93f9", "#ffb86c", "#282a36"],
  },
  {
    id: "business",
    label: "Business",
    group: "Dark",
    swatches: ["#1c4f82", "#7b92b2", "#f4f4f4", "#1d232a"],
  },
  {
    id: "night",
    label: "Night",
    group: "Dark",
    swatches: ["#38bdf8", "#818cf8", "#f471b5", "#0f172a"],
  },
  {
    id: "coffee",
    label: "Coffee",
    group: "Dark",
    swatches: ["#db924b", "#263e3f", "#10576d", "#20161f"],
  },
  {
    id: "dim",
    label: "Dim",
    group: "Dark",
    swatches: ["#9ca3af", "#6b7280", "#d1d5db", "#2a303c"],
  },
  {
    id: "nord",
    label: "Nord",
    group: "Dark",
    swatches: ["#5e81ac", "#81a1c1", "#88c0d0", "#2e3440"],
  },
  {
    id: "sunset",
    label: "Sunset",
    group: "Dark",
    swatches: ["#ff865b", "#fd6f9c", "#b893ff", "#1d0010"],
  },
  {
    id: "abyss",
    label: "Abyss",
    group: "Dark",
    swatches: ["#1eb4d4", "#6c74d3", "#3a8ba7", "#000913"],
  },
  {
    id: "valentine",
    label: "Valentine",
    group: "Dark",
    swatches: ["#e96d7b", "#a991f7", "#88dbdd", "#fae7f7"],
  },
] as const;

type ThemeId = (typeof themes)[number]["id"];

const groups = ["Brand", "Light", "Dark"] as const;

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>("Brand");
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("themes");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keep active group in sync with current theme
  useEffect(() => {
    const current = themes.find((t) => t.id === (theme || resolvedTheme));
    if (current) setActiveGroup(current.group);
  }, [theme, resolvedTheme]);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl animate-pulse bg-base-content/6" />
    );
  }

  const activeTheme =
    themes.find((t) => t.id === theme) ??
    themes.find((t) => t.id === resolvedTheme) ??
    themes[0];
  const filteredThemes = themes.filter((t) => t.group === activeGroup);

  const getLabel = (id: string) => {
    try {
      return t(id);
    } catch {
      return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button — shows the 4 active-theme swatches */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`
          relative h-9 w-9 flex items-center justify-center rounded-xl
          transition-all duration-200 active:scale-95
          ${isOpen ? "bg-base-content/10" : "hover:bg-base-content/6"}
        `}
        aria-label="Select theme"
        aria-expanded={isOpen}
        title={`Theme: ${activeTheme.label}`}
      >
        {/* 2×2 swatch grid inside the button */}
        <span className="grid grid-cols-2 gap-0.5 w-4.5 h-4.5 rounded-sm overflow-hidden">
          {activeTheme.swatches.map((color, i) => (
            <span
              key={i}
              className="block rounded-[1px]"
              style={{ backgroundColor: color }}
            />
          ))}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute ltr:right-0 rtl:left-0 top-full mt-2 z-[200] w-72 sm:w-80 bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl shadow-2xl shadow-base-content/15 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
                  <Palette className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-base-content leading-none">
                    Theme
                  </p>
                  <p className="text-[9px] font-semibold text-base-content/45 mt-0.5">
                    {activeTheme.label} active
                  </p>
                </div>
              </div>

              {/* Group tabs */}
              <div className="flex gap-1 p-1 rounded-xl bg-base-content/5">
                {groups.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all duration-150 ${
                      activeGroup === g
                        ? "bg-base-100 text-base-content shadow-sm"
                        : "text-base-content/50 hover:text-base-content/75"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme grid */}
            <div className="px-3 pb-3 max-h-64 overflow-y-auto overscroll-contain grid grid-cols-2 gap-1.5">
              {filteredThemes.map((th) => {
                const isActive = theme === th.id || resolvedTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      setTheme(th.id);
                      setIsOpen(false);
                    }}
                    className={`
                      group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left
                      transition-all duration-150 active:scale-[0.97]
                      ${
                        isActive
                          ? "bg-primary/12 ring-1 ring-primary/30"
                          : "hover:bg-base-content/6 ring-1 ring-transparent hover:ring-base-content/8"
                      }
                    `}
                  >
                    {/* 4-dot swatch cluster */}
                    <span className="grid grid-cols-2 gap-px w-5 h-5 rounded-md overflow-hidden shrink-0 ring-1 ring-base-content/8">
                      {th.swatches.map((color, i) => (
                        <span
                          key={i}
                          className="block"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>

                    <span
                      className={`text-[11px] font-bold flex-1 truncate leading-none ${
                        isActive
                          ? "text-primary"
                          : "text-base-content/75 group-hover:text-base-content"
                      }`}
                    >
                      {getLabel(th.id)}
                    </span>

                    {isActive && (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check
                          className="w-2.5 h-2.5 text-primary-content"
                          strokeWidth={3}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Currently active theme pill at bottom */}
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-content/4 border border-base-content/6">
                <span className="grid grid-cols-2 gap-px w-4 h-4 rounded-sm overflow-hidden shrink-0">
                  {activeTheme.swatches.map((color, i) => (
                    <span key={i} style={{ backgroundColor: color }} />
                  ))}
                </span>
                <span className="text-[10px] font-bold text-base-content/60">
                  Active:{" "}
                  <span className="text-base-content">{activeTheme.label}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
