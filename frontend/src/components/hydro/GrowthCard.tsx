import React from "react";
import { motion } from "framer-motion";
import { ParticleLayer } from "./ParticleLayer";
import { AnimatedBorder } from "./AnimatedBorder";
import { PlantSVG } from "./PlantSVG";

interface GrowthCardProps {
  id: "Germination" | "Seedling" | "Vegetative" | "Mature";
  title: string;
  subtext: string;
  days: string;
  isActive: boolean;
  onSelect: () => void;
  isDark?: boolean;
}

export const GrowthCard: React.FC<GrowthCardProps> = ({
  id,
  title,
  subtext,
  days,
  isActive,
  onSelect,
  isDark = true,
}) => {
  // Resolve theme colors dynamically based on dark/light mode and stage
  const theme = React.useMemo(() => {
    if (isDark) {
      switch (id) {
        case "Germination":
          return {
            color: "#00ffb7",
            colorText: "text-[#00ffb7]",
            glowStyle: "0 0 15px rgba(0, 255, 183, 0.4)",
            bgClass: isActive ? "bg-[#101a2b]" : "bg-[#080d14]/90 hover:bg-[#0d1522] opacity-85 hover:opacity-100",
          };
        case "Seedling":
          return {
            color: "#ffd84d",
            colorText: "text-[#ffd84d]",
            glowStyle: "0 0 15px rgba(255, 216, 77, 0.4)",
            bgClass: isActive ? "bg-[#101a2b]" : "bg-[#080d14]/90 hover:bg-[#0d1522] opacity-85 hover:opacity-100",
          };
        case "Vegetative":
          return {
            color: "#ff57d8",
            colorText: "text-[#ff57d8]",
            glowStyle: "0 0 15px rgba(255, 87, 216, 0.4)",
            bgClass: isActive ? "bg-[#101a2b]" : "bg-[#080d14]/90 hover:bg-[#0d1522] opacity-85 hover:opacity-100",
          };
        case "Mature":
          default:
          return {
            color: "#4ca3ff",
            colorText: "text-[#4ca3ff]",
            glowStyle: "0 0 15px rgba(76, 163, 255, 0.4)",
            bgClass: isActive ? "bg-[#101a2b]" : "bg-[#080d14]/90 hover:bg-[#0d1522] opacity-85 hover:opacity-100",
          };
      }
    } else {
      // Light Mode (High Contrast & Clean aesthetics)
      switch (id) {
        case "Germination":
          return {
            color: "#047857",
            colorText: "text-[#047857] font-extrabold",
            glowStyle: "0 0 10px rgba(4, 120, 87, 0.25)",
            bgClass: isActive ? "bg-emerald-50/95" : "bg-slate-100 border-slate-200 hover:bg-slate-200/80 opacity-95 hover:opacity-100",
          };
        case "Seedling":
          return {
            color: "#b45309",
            colorText: "text-[#b45309] font-extrabold",
            glowStyle: "0 0 10px rgba(180, 83, 9, 0.25)",
            bgClass: isActive ? "bg-amber-50/95" : "bg-slate-100 border-slate-200 hover:bg-slate-200/80 opacity-95 hover:opacity-100",
          };
        case "Vegetative":
          return {
            color: "#be185d",
            colorText: "text-[#be185d] font-extrabold",
            glowStyle: "0 0 10px rgba(190, 24, 93, 0.25)",
            bgClass: isActive ? "bg-pink-50/95" : "bg-slate-100 border-slate-200 hover:bg-slate-200/80 opacity-95 hover:opacity-100",
          };
        case "Mature":
          default:
          return {
            color: "#1d4ed8",
            colorText: "text-[#1d4ed8] font-extrabold",
            glowStyle: "0 0 10px rgba(29, 78, 216, 0.25)",
            bgClass: isActive ? "bg-blue-50/95" : "bg-slate-100 border-slate-200 hover:bg-slate-200/80 opacity-95 hover:opacity-100",
          };
      }
    }
  }, [id, isDark, isActive]);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{
        borderColor: isActive ? theme.color : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)",
        boxShadow: isActive ? theme.glowStyle : "0 0 8px rgba(0,0,0,0.05)",
      }}
      className={`relative rounded-xl p-2.5 border-2 text-left transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between h-24 select-none ${theme.bgClass}`}
    >
      {/* Active Light Sweep Animation */}
      <AnimatedBorder color={theme.color} isActive={isActive} />

      {/* Particle Canvas Layer */}
      {isActive && <ParticleLayer color={theme.color} particleCount={22} />}

      {/* Card Header Info */}
      <div className="z-10 flex justify-between items-center w-full">
        <h3 className={`text-[11px] font-bold font-mono tracking-wide ${theme.colorText}`}>
          {title}
        </h3>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: theme.color }} />
        )}
      </div>

      {/* Vector Graphic Layer */}
      <div className="absolute inset-0 z-0 opacity-90 pointer-events-none">
        <PlantSVG stageId={id} color={theme.color} isActive={isActive} />
      </div>

      {/* Card Footer Info */}
      <div className="z-10 mt-auto">
        <div className={`text-[9px] font-mono font-bold leading-none truncate ${theme.colorText}`}>
          {subtext}
        </div>
        <div className={`text-[8.5px] font-mono font-extrabold mt-0.5 leading-none opacity-90 ${theme.colorText}`}>
          {days}
        </div>
      </div>
    </motion.button>
  );
};
