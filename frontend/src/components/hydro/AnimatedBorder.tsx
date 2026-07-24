import React from "react";
import { motion } from "framer-motion";

interface AnimatedBorderProps {
  color: string;
  isActive: boolean;
}

export const AnimatedBorder: React.FC<AnimatedBorderProps> = ({
  color,
  isActive,
}) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden z-20">
      {/* Moving Light Sweep */}
      <motion.div
        initial={{ x: "-100%", y: "-100%" }}
        animate={{ x: ["100%", "-100%"], y: ["100%", "-100%"] }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
          repeatDelay: 1,
        }}
        style={{
          background: `linear-gradient(135deg, transparent 40%, ${color} 50%, transparent 60%)`,
        }}
        className="absolute inset-0 opacity-60 mix-blend-screen"
      />
    </div>
  );
};
