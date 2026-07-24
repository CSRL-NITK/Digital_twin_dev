import React from "react";
import { motion } from "framer-motion";

interface PlantSVGProps {
  stageId: "Germination" | "Seedling" | "Vegetative" | "Mature";
  color: string;
  isActive: boolean;
}

export const PlantSVG: React.FC<PlantSVGProps> = ({
  stageId,
  color,
  isActive,
}) => {
  if (stageId === "Germination") {
    return (
      <svg
        viewBox="0 0 280 140"
        className="w-full h-full preserve-3d overflow-visible"
        fill="none"
      >
        <defs>
          <filter id="glow-germ-sci" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Animated Holographic Orbital Rings */}
        <motion.circle
          cx="170"
          cy="65"
          r="48"
          stroke={color}
          strokeWidth="0.8"
          strokeDasharray="4 6 12 4"
          opacity={isActive ? 0.65 : 0.3}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        />
        <motion.circle
          cx="170"
          cy="65"
          r="36"
          stroke={color}
          strokeWidth="0.6"
          strokeDasharray="2 8 4 2"
          opacity={isActive ? 0.5 : 0.25}
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
        />

        {/* Root System Stroke Path Animation */}
        <motion.g
          filter="url(#glow-germ-sci)"
          stroke={color}
          strokeLinecap="round"
          fill="none"
        >
          {/* Main Stem entering from top right */}
          <motion.path
            d="M 230 5 C 220 30, 200 45, 170 55"
            strokeWidth="4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Spreading Roots */}
          <motion.path
            d="M 170 55 C 130 60, 70 50, 15 55"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, delay: 0.2 }}
          />
          <motion.path
            d="M 170 55 C 140 80, 85 105, 30 120"
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.4 }}
          />
          <motion.path
            d="M 170 55 C 200 80, 240 95, 270 108"
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />

          {/* Feeder Root Hairs */}
          <motion.path
            d="M 110 58 C 80 72, 50 82, 18 92"
            strokeWidth="1.2"
            opacity="0.8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.7 }}
          />
          <motion.path
            d="M 130 64 C 100 85, 70 100, 40 110"
            strokeWidth="1.2"
            opacity="0.8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
          />
        </motion.g>

        {/* Swirling Sparkle Particles */}
        {isActive && (
          <g fill="#ffffff">
            <motion.circle
              cx="170"
              cy="55"
              r="2.5"
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.circle
              cx="70"
              cy="50"
              r="2"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
            />
            <motion.circle
              cx="30"
              cy="120"
              r="2"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: 1 }}
            />
          </g>
        )}
      </svg>
    );
  }

  if (stageId === "Seedling") {
    return (
      <svg
        viewBox="0 0 280 140"
        className="w-full h-full preserve-3d overflow-visible"
        fill="none"
      >
        <defs>
          <filter id="glow-seed-sci" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Cotyledon Leaves Opening */}
        <motion.g
          filter="url(#glow-seed-sci)"
          animate={isActive ? { scale: [1, 1.03, 1], y: [0, -1, 0] } : {}}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          {/* Left Leaf */}
          <motion.path
            d="M 210 50 C 185 25, 200 12, 220 24 C 232 32, 225 44, 210 50 Z"
            fill={color}
            fillOpacity={isActive ? 0.35 : 0.2}
            stroke={color}
            strokeWidth="1.8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "backOut" }}
          />
          {/* Right Leaf */}
          <motion.path
            d="M 210 50 C 235 25, 250 30, 245 44 C 235 56, 220 52, 210 50 Z"
            fill={color}
            fillOpacity={isActive ? 0.35 : 0.2}
            stroke={color}
            strokeWidth="1.8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "backOut" }}
          />

          {/* Stem & Taproot */}
          <motion.path
            d="M 210 50 C 205 75, 215 95, 200 122"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6 }}
          />

          {/* Fine Root Hairs */}
          <motion.path
            d="M 208 80 C 195 92, 185 102, 170 114"
            stroke={color}
            strokeWidth="1.2"
            opacity="0.85"
          />
          <motion.path
            d="M 206 95 C 190 106, 180 115, 165 120"
            stroke={color}
            strokeWidth="1.2"
            opacity="0.85"
          />
          <motion.path
            d="M 203 84 C 215 95, 220 106, 225 116"
            stroke={color}
            strokeWidth="1.2"
            opacity="0.85"
          />
        </motion.g>

        {isActive && (
          <motion.circle
            cx="210"
            cy="50"
            r="3"
            fill="#ffffff"
            filter="url(#glow-seed-sci)"
            animate={{ scale: [1, 1.8, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </svg>
    );
  }

  if (stageId === "Vegetative") {
    return (
      <svg
        viewBox="0 0 280 140"
        className="w-full h-full preserve-3d overflow-visible"
        fill="none"
      >
        <defs>
          <filter id="glow-veg-sci" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow-veg-sci)" stroke={color}>
          {/* Main Trunk */}
          <path d="M 200 124 L 200 50" strokeWidth="3.5" strokeLinecap="round" />

          {/* Root Base */}
          <path
            d="M 200 95 C 170 105, 140 112, 100 122"
            strokeWidth="1.6"
            opacity="0.85"
          />
          <path
            d="M 200 100 C 220 108, 240 114, 260 120"
            strokeWidth="1.6"
            opacity="0.85"
          />

          {/* Leaf Clusters with Gentle Swaying Motion */}
          <motion.g
            animate={isActive ? { rotate: [-1.5, 1.5, -1.5] } : {}}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ transformOrigin: "200px 50px" }}
          >
            <g fill={color} fillOpacity={isActive ? 0.35 : 0.2} strokeWidth="1.2">
              <path d="M 200 70 C 170 60, 150 40, 130 30 C 155 30, 180 45, 200 70 Z" />
              <path d="M 200 70 C 230 60, 250 40, 270 30 C 245 30, 220 45, 200 70 Z" />
              <path d="M 200 90 C 160 80, 140 65, 120 55 C 145 55, 175 70, 200 90 Z" />
              <path d="M 200 90 C 240 80, 260 65, 280 55 C 255 55, 225 70, 200 90 Z" />
              <path d="M 200 50 Q 185 30 180 15 Q 195 18 200 50 Z" />
              <path d="M 200 50 Q 215 30 220 15 Q 205 18 200 50 Z" />
            </g>
          </motion.g>
        </g>
      </svg>
    );
  }

  // Mature Stage
  return (
    <svg
      viewBox="0 0 280 140"
      className="w-full h-full preserve-3d overflow-visible"
      fill="none"
    >
      <defs>
        <filter id="glow-mat-sci" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#glow-mat-sci)" stroke={color}>
        {/* Main Central Stem */}
        <path d="M 210 124 L 210 38" strokeWidth="3.5" strokeLinecap="round" />

        {/* Top Flower Bud */}
        <motion.g
          animate={isActive ? { scale: [1, 1.08, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          style={{ transformOrigin: "210px 20px" }}
        >
          <path
            d="M 210 38 C 198 25, 198 10, 210 4 C 222 10, 222 25, 210 38 Z"
            fill={color}
            fillOpacity={isActive ? 0.5 : 0.3}
            strokeWidth="1.8"
          />
          <path d="M 210 38 C 190 20, 195 5, 210 4" strokeWidth="1.2" opacity="0.9" />
          <path d="M 210 38 C 230 20, 225 5, 210 4" strokeWidth="1.2" opacity="0.9" />
        </motion.g>

        {/* Symmetrical Mature Leaves */}
        <g fill={color} fillOpacity={isActive ? 0.3 : 0.15} strokeWidth="1.2">
          <path d="M 210 58 C 175 50, 155 38, 135 28 C 160 28, 185 42, 210 58 Z" />
          <path d="M 210 58 C 245 50, 265 38, 285 28 C 260 28, 235 42, 210 58 Z" />
          <path d="M 210 82 C 170 72, 145 58, 125 48 C 150 48, 180 64, 210 82 Z" />
          <path d="M 210 82 C 250 72, 275 58, 295 48 C 270 48, 240 64, 210 82 Z" />
        </g>

        {/* Horizontal Root Mass */}
        <g strokeWidth="1.5" opacity="0.85">
          <path d="M 210 92 C 160 88, 100 82, 10 78" />
          <path d="M 210 102 C 150 100, 90 96, 5 96" />
          <path d="M 210 112 C 170 114, 120 116, 50 120" />
        </g>
      </g>

      {/* Bloom Starburst Sparkles */}
      {isActive && (
        <g fill="#ffffff">
          <motion.circle
            cx="210"
            cy="4"
            r="3"
            filter="url(#glow-mat-sci)"
            animate={{ scale: [1, 2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
          <motion.polygon
            points="210,0 212,3 215,4 212,5 210,8 208,5 205,4 208,3"
            filter="url(#glow-mat-sci)"
            animate={{ rotate: 180 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          />
        </g>
      )}
    </svg>
  );
};
