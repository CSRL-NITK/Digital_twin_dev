import React from 'react';

// Reusable SVG Filters for Glowing Neon Effect
const GlowFilters: React.FC<{ id: string; color: string }> = ({ id, color }) => (
  <defs>
    <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={color} stopOpacity="1" />
      <stop offset="100%" stopColor={color} stopOpacity="0.3" />
    </linearGradient>
  </defs>
);

// Background Circuit Lines
const CircuitBG: React.FC = () => (
  <g opacity="0.15" stroke="#ffffff" strokeWidth="1" fill="none">
    <path d="M10 20 H50 L70 40 V100" />
    <path d="M150 120 H110 L90 100 V60" />
    <circle cx="50" cy="20" r="2" fill="#ffffff" />
    <circle cx="110" cy="120" r="2" fill="#ffffff" />
  </g>
);

// 1. Germination (Horizontal Spreading Root System)
export const GerminationGraphic: React.FC = () => (
  <svg viewBox="0 0 300 180" className="w-full h-full">
    <GlowFilters id="germ" color="#10b981" />
    <CircuitBG />
    <g stroke="url(#grad-germ)" fill="none" strokeLinecap="round" filter="url(#glow-germ)">
      {/* Main thick stem curving in from top right */}
      <path d="M 200 0 C 200 50, 180 60, 150 70" strokeWidth="5" />
      
      {/* Spreading Main Roots */}
      <path d="M 150 70 C 110 80, 60 70, 10 75" strokeWidth="3.5" />
      <path d="M 150 70 C 130 100, 90 120, 40 140" strokeWidth="3" />
      <path d="M 150 70 C 170 100, 210 110, 260 120" strokeWidth="3" />
      <path d="M 150 70 C 180 50, 230 40, 290 35" strokeWidth="2.5" />

      {/* Dense Fine Feeder Roots */}
      <path d="M 100 73 C 80 85, 60 95, 30 105" strokeWidth="1.5" />
      <path d="M 120 78 C 100 100, 80 115, 60 125" strokeWidth="1.5" />
      <path d="M 70 72 C 50 60, 30 55, 10 50" strokeWidth="1.5" />
      <path d="M 165 85 C 180 105, 200 125, 220 135" strokeWidth="1.5" />
      <path d="M 180 95 C 200 115, 230 130, 250 145" strokeWidth="1" />
      <path d="M 130 105 C 110 125, 90 140, 80 155" strokeWidth="1" />
      
      {/* Tiny Root Hairs */}
      {[...Array(12)].map((_, i) => (
        <path key={i} d={`M ${50 + i * 15} ${70 + (i % 3) * 5} Q ${45 + i * 15} ${80 + (i % 3) * 5}, ${40 + i * 15} ${85 + (i % 3) * 5}`} strokeWidth="0.8" opacity="0.8" />
      ))}
    </g>
  </svg>
);

// 2. Seedling (Single Vertical Sprout with Cotyledon Leaves)
export const SeedlingGraphic: React.FC = () => (
  <svg viewBox="0 0 300 180" className="w-full h-full">
    <GlowFilters id="seed" color="#eab308" />
    <CircuitBG />
    <g filter="url(#glow-seed)">
      {/* Cotyledon Leaves */}
      <path d="M 230 60 C 200 30, 220 20, 245 35 C 260 45, 250 55, 230 60 Z" fill="#eab308" fillOpacity="0.25" stroke="#eab308" strokeWidth="2" />
      <path d="M 230 60 C 260 30, 280 40, 275 55 C 265 70, 245 65, 230 60 Z" fill="#eab308" fillOpacity="0.25" stroke="#eab308" strokeWidth="2" />
      
      {/* Inner Leaf Veins */}
      <path d="M 230 60 Q 235 42 245 35" stroke="#eab308" strokeWidth="1" fill="none" />
      <path d="M 230 60 Q 252 50 275 55" stroke="#eab308" strokeWidth="1" fill="none" />

      {/* Main Taproot Stem */}
      <path d="M 230 60 C 225 90, 235 120, 220 170" stroke="#eab308" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* Fine Branching Roots at the Base */}
      <g stroke="#eab308" strokeWidth="1.5" fill="none" opacity="0.85">
        <path d="M 228 100 C 215 115, 205 130, 195 145" />
        <path d="M 226 120 C 210 135, 200 150, 185 165" />
        <path d="M 224 135 C 215 148, 208 160, 200 172" />
        <path d="M 223 110 C 235 125, 240 140, 245 155" />
        <path d="M 221 130 C 230 145, 238 158, 242 170" />
      </g>
    </g>
  </svg>
);

// 3. Vegetative (Dense Foliage & Dual Root/Canopy)
export const VegetativeGraphic: React.FC = () => (
  <svg viewBox="0 0 300 180" className="w-full h-full">
    <GlowFilters id="veg" color="#ec4899" />
    <CircuitBG />
    <g stroke="#ec4899" filter="url(#glow-veg)" fill="none">
      {/* Central Trunk */}
      <path d="M 220 180 L 220 80" strokeWidth="4" />
      
      {/* Dense Root System at Base */}
      <g strokeWidth="1.8" opacity="0.9">
        <path d="M 220 140 C 190 150, 160 160, 120 175" />
        <path d="M 220 150 C 200 160, 175 168, 140 180" />
        <path d="M 220 145 C 240 155, 260 165, 280 178" />
        <path d="M 220 160 C 210 168, 195 174, 175 180" />
      </g>

      {/* Bushy Foliage Branches with Detailed Leaves */}
      {[
        { x: 220, y: 110, scale: 1, rot: 0 },
        { x: 200, y: 90, scale: 0.8, rot: -20 },
        { x: 240, y: 85, scale: 0.85, rot: 25 },
        { x: 180, y: 70, scale: 0.7, rot: -40 },
        { x: 250, y: 65, scale: 0.75, rot: 40 },
      ].map((b, idx) => (
        <g key={idx} transform={`translate(${b.x}, ${b.y}) rotate(${b.rot}) scale(${b.scale})`}>
          <path d="M 0 0 C -30 -10, -50 -30, -70 -40" strokeWidth="2" />
          <path d="M 0 0 C 30 -10, 50 -30, 70 -40" strokeWidth="2" />
          {/* Leaves along branch */}
          <path d="M -30 -12 C -45 -25, -35 -40, -20 -30 C -10 -20, -20 -10, -30 -12 Z" fill="#ec4899" fillOpacity="0.3" strokeWidth="1" />
          <path d="M 30 -12 C 45 -25, 35 -40, 20 -30 C 10 -20, 20 -10, 30 -12 Z" fill="#ec4899" fillOpacity="0.3" strokeWidth="1" />
          <path d="M -50 -28 C -65 -41, -55 -56, -40 -46 Z" fill="#ec4899" fillOpacity="0.3" strokeWidth="1" />
          <path d="M 50 -28 C 65 -41, 55 -56, 40 -46 Z" fill="#ec4899" fillOpacity="0.3" strokeWidth="1" />
        </g>
      ))}
    </g>
  </svg>
);

// 4. Mature (Flowering Apex & Extensive Root Network)
export const MatureGraphic: React.FC = () => (
  <svg viewBox="0 0 300 180" className="w-full h-full">
    <GlowFilters id="mat" color="#3b82f6" />
    <CircuitBG />
    <g stroke="#3b82f6" filter="url(#glow-mat)" fill="none">
      {/* Central Stem */}
      <path d="M 230 180 L 230 50" strokeWidth="4" />

      {/* Top Flowering Bud */}
      <path d="M 230 50 C 215 35, 215 15, 230 5 C 245 15, 245 35, 230 50 Z" fill="#3b82f6" fillOpacity="0.4" strokeWidth="2" />
      <path d="M 230 50 C 205 30, 210 10, 230 5" strokeWidth="1.5" />
      <path d="M 230 50 C 255 30, 250 10, 230 5" strokeWidth="1.5" />

      {/* Symmetrical Layered Leaves */}
      <g fill="#3b82f6" fillOpacity="0.25" strokeWidth="1.5">
        <path d="M 230 80 C 190 70, 170 50, 150 40 C 180 40, 210 60, 230 80 Z" />
        <path d="M 230 80 C 270 70, 290 50, 310 40 C 280 40, 250 60, 230 80 Z" />
        <path d="M 230 110 C 180 100, 150 80, 130 70 C 160 65, 200 85, 230 110 Z" />
        <path d="M 230 110 C 280 100, 310 80, 330 70 C 300 65, 260 85, 230 110 Z" />
      </g>

      {/* Broad Intricate Root System Spreading Left and Down */}
      <g strokeWidth="2" opacity="0.9">
        <path d="M 230 140 C 180 130, 110 120, 30 110" />
        <path d="M 230 150 C 170 145, 100 140, 20 140" />
        <path d="M 230 160 C 190 160, 130 165, 50 170" />
        <path d="M 230 170 C 200 172, 160 175, 100 180" />
        <path d="M 230 145 C 250 155, 270 165, 295 175" />
      </g>

      {/* Fine tendrils branching off the root mass */}
      <g strokeWidth="1" opacity="0.7">
        <path d="M 150 125 C 120 110, 90 100, 60 95" />
        <path d="M 120 137 C 90 128, 60 125, 30 122" />
        <path d="M 160 155 C 120 152, 80 150, 40 150" />
      </g>
    </g>
  </svg>
);
