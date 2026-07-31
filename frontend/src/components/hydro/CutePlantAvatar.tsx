import React from 'react';
import { motion } from 'framer-motion';

export interface CutePlantAvatarProps {
  state?: 'idle' | 'thinking' | 'speaking' | 'happy';
  size?: number;
  className?: string;
}

export const CutePlantAvatar: React.FC<CutePlantAvatarProps> = ({
  state = 'idle',
  size = 48,
  className = '',
}) => {
  const isHappy = state === 'happy';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  // Body sway variants
  const bodyVariants: any = {
    idle: {
      rotate: [-2, 2, -2],
      y: [0, -2, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
    },
    thinking: {
      rotate: [-5, 8, -5],
      y: [0, -4, 0],
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
    },
    speaking: {
      rotate: [-3, 3, -3],
      y: [0, -3, 0],
      scale: [1, 1.04, 1],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
    },
    happy: {
      rotate: [-6, 6, -6],
      y: [0, -8, 0],
      scale: [1, 1.08, 1],
      transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  // Leaf sway variants
  const leftLeafVariants: any = {
    idle: { rotate: [-5, 5, -5], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } },
    thinking: { rotate: [-15, 2, -15], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
    speaking: { rotate: [-10, 10, -10], transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } },
    happy: { rotate: [-20, 15, -20], transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } }
  };

  const rightLeafVariants: any = {
    idle: { rotate: [5, -5, 5], transition: { duration: 2.7, repeat: Infinity, ease: 'easeInOut' } },
    thinking: { rotate: [5, -15, 5], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
    speaking: { rotate: [10, -10, 10], transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } },
    happy: { rotate: [20, -15, 20], transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } }
  };

  // Antenna sprout variant
  const topSproutVariants: any = {
    idle: { scale: [1, 1.05, 1], rotate: [-3, 3, -3], transition: { duration: 2, repeat: Infinity } },
    thinking: { scale: [1, 1.2, 1], rotate: [-15, 15, -15], transition: { duration: 0.8, repeat: Infinity } },
    speaking: { scale: [1.05, 1.15, 1.05], transition: { duration: 0.4, repeat: Infinity } },
    happy: { scale: [1, 1.3, 1], rotate: [0, 360], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Glow / Aura */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.2, 1] : isHappy ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isThinking ? [0.4, 0.7, 0.4] : 0.4
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full blur-md"
        style={{
          background: isThinking
            ? 'radial-gradient(circle, rgba(56,189,248,0.6) 0%, rgba(16,185,129,0) 70%)'
            : isHappy
            ? 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(16,185,129,0) 70%)'
            : 'radial-gradient(circle, rgba(52,211,153,0.5) 0%, rgba(16,185,129,0) 70%)'
        }}
      />

      {/* Floating Sparkles for Thinking or Happy state */}
      {(isThinking || isHappy) && (
        <>
          <motion.span
            animate={{ y: [-2, -12], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            className="absolute -top-2 -right-1 text-xs text-yellow-300 pointer-events-none"
          >
            {isThinking ? '💡' : '✨'}
          </motion.span>
          <motion.span
            animate={{ y: [-2, -10], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }}
            className="absolute -top-3 -left-1 text-xs text-emerald-300 pointer-events-none"
          >
            {isThinking ? '❓' : '🌱'}
          </motion.span>
        </>
      )}

      {/* Main SVG Animated Plant */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        variants={bodyVariants}
        animate={state}
      >
        <defs>
          {/* Hydro Pot Water Gradient */}
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Glass Pot Gradient */}
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>

          {/* Plant Head Gradient */}
          <linearGradient id="plantHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          {/* Leaf Gradient */}
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Cheek Blush Filter */}
          <filter id="blushGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* 1. HYDRO GLASS POT BASE */}
        <g id="Pot">
          {/* Glass Bowl Base */}
          <rect
            x="32"
            y="70"
            width="56"
            height="42"
            rx="18"
            fill="url(#glassGrad)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
          />

          {/* Hydro Liquid Fill */}
          <rect
            x="35"
            y="82"
            width="50"
            height="27"
            rx="12"
            fill="url(#waterGrad)"
            opacity="0.85"
          />

          {/* Animated Water Bubbles */}
          <motion.circle
            cx="45"
            cy="98"
            r="2"
            fill="#ffffff"
            opacity="0.7"
            animate={{ y: [-2, -12], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.circle
            cx="60"
            cy="100"
            r="2.5"
            fill="#ffffff"
            opacity="0.7"
            animate={{ y: [-2, -14], opacity: [0.7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.5, ease: 'easeOut' }}
          />
          <motion.circle
            cx="72"
            cy="96"
            r="1.8"
            fill="#ffffff"
            opacity="0.7"
            animate={{ y: [-2, -10], opacity: [0.7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.9, ease: 'easeOut' }}
          />

          {/* Glass Shine Arc */}
          <path
            d="M 38 76 Q 42 74 48 74"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* 2. ROOT & STEM */}
        <path
          d="M 60 72 L 60 62"
          stroke="#15803d"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* 3. LEAVES (LEFT & RIGHT) */}
        {/* Left Leaf */}
        <motion.g
          style={{ transformOrigin: '52px 56px' }}
          variants={leftLeafVariants}
          animate={state}
        >
          <path
            d="M 54 56 C 36 50 24 34 32 24 C 44 26 50 42 54 56 Z"
            fill="url(#leafGrad)"
            stroke="#166534"
            strokeWidth="1.5"
          />
          <path
            d="M 46 44 C 40 38 36 32 35 28"
            stroke="#bbf7d0"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </motion.g>

        {/* Right Leaf */}
        <motion.g
          style={{ transformOrigin: '68px 56px' }}
          variants={rightLeafVariants}
          animate={state}
        >
          <path
            d="M 66 56 C 84 50 96 34 88 24 C 76 26 70 42 66 56 Z"
            fill="url(#leafGrad)"
            stroke="#166534"
            strokeWidth="1.5"
          />
          <path
            d="M 74 44 C 80 38 84 32 85 28"
            stroke="#bbf7d0"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </motion.g>

        {/* 4. CUTE PLANT HEAD (Round Sprout Body) */}
        <circle
          cx="60"
          cy="46"
          r="24"
          fill="url(#plantHeadGrad)"
          stroke="#15803d"
          strokeWidth="2"
        />

        {/* Top Antenna Sprout / Flower bulb */}
        <motion.g
          style={{ transformOrigin: '60px 22px' }}
          variants={topSproutVariants}
          animate={state}
        >
          <path
            d="M 60 22 C 58 14 52 10 52 6 C 58 6 62 14 60 22 Z"
            fill="#34d399"
            stroke="#166534"
            strokeWidth="1"
          />
          <path
            d="M 60 22 C 62 14 68 10 68 6 C 62 6 58 14 60 22 Z"
            fill="#a7f3d0"
            stroke="#166534"
            strokeWidth="1"
          />
          <circle cx="60" cy="6" r="3.5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
        </motion.g>

        {/* 5. KAWAII FACE FEATURES */}
        {/* Pink Cheek Blush */}
        <circle cx="44" cy="52" r="4.5" fill="#ff70a6" filter="url(#blushGlow)" opacity="0.75" />
        <circle cx="76" cy="52" r="4.5" fill="#ff70a6" filter="url(#blushGlow)" opacity="0.75" />

        {/* EYES */}
        {isHappy ? (
          /* Happy Crescent Eyes '^ ^' */
          <g stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 44 46 Q 48 41 52 46" />
            <path d="M 68 46 Q 72 41 76 46" />
          </g>
        ) : isThinking ? (
          /* Thinking Eyes looking up-right */
          <g>
            <circle cx="48" cy="44" r="4" fill="#0f172a" />
            <circle cx="72" cy="44" r="4" fill="#0f172a" />
            {/* Highlights */}
            <circle cx="50" cy="42" r="1.6" fill="#ffffff" />
            <circle cx="74" cy="42" r="1.6" fill="#ffffff" />
          </g>
        ) : (
          /* Normal Glossy Blinking Kawaii Eyes */
          <g>
            <motion.g
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
              style={{ transformOrigin: '60px 45px' }}
            >
              {/* Left Eye */}
              <circle cx="48" cy="45" r="4.5" fill="#0f172a" />
              <circle cx="46.5" cy="43" r="1.8" fill="#ffffff" />
              <circle cx="49.5" cy="46.5" r="0.9" fill="#ffffff" />

              {/* Right Eye */}
              <circle cx="72" cy="45" r="4.5" fill="#0f172a" />
              <circle cx="70.5" cy="43" r="1.8" fill="#ffffff" />
              <circle cx="73.5" cy="46.5" r="0.9" fill="#ffffff" />
            </motion.g>
          </g>
        )}

        {/* MOUTH */}
        {isSpeaking ? (
          /* Talking Open Mouth */
          <motion.path
            d="M 54 53 Q 60 60 66 53 Z"
            fill="#dc2626"
            stroke="#0f172a"
            strokeWidth="1.5"
            animate={{ scaleY: [0.8, 1.4, 0.8] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            style={{ transformOrigin: '60px 53px' }}
          />
        ) : isHappy ? (
          /* Cute Open Smile */
          <path d="M 54 51 Q 60 58 66 51 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
        ) : isThinking ? (
          /* Small 'o' Mouth */
          <circle cx="60" cy="53" r="2.5" fill="#0f172a" />
        ) : (
          /* Cute Small W-shaped Smile */
          <path
            d="M 54 52 Q 57 55 60 52 Q 63 55 66 52"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </motion.svg>
    </div>
  );
};
