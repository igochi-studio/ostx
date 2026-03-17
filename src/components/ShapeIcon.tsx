"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type ShapeType = "pool" | "pebble" | "droplet" | "ring";

interface ShapeIconProps {
  shape: ShapeType;
  label: string;
  isActive: boolean;
  onTap: () => void;
  count?: number;
}

const shapeConfig: Record<ShapeType, { icon: string; floatDelay: number }> = {
  pool: { icon: "/icons/pool.png", floatDelay: 0 },
  pebble: { icon: "/icons/pebble.png", floatDelay: 0.5 },
  droplet: { icon: "/icons/droplet.png", floatDelay: 1.0 },
  ring: { icon: "/icons/ring.png", floatDelay: 1.5 },
};

export default function ShapeIcon({
  shape,
  label,
  isActive,
  onTap,
  count,
}: ShapeIconProps) {
  const config = shapeConfig[shape];

  return (
    <motion.button
      onClick={onTap}
      className="flex flex-col items-center gap-1.5 relative"
      whileTap={{ scale: 0.92 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      {/* Floating shape icon */}
      <motion.div
        className="relative w-10 h-10 flex items-center justify-center"
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: config.floatDelay,
        }}
      >
        <motion.div
          animate={{
            scale: isActive ? 1.15 : 1,
            opacity: isActive ? 1 : 0.7,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Image
            src={config.icon}
            alt={label}
            width={36}
            height={36}
            className="object-contain drop-shadow-sm"
            style={{
              filter: isActive
                ? "drop-shadow(0 0 8px rgba(240, 223, 192, 0.4))"
                : "none",
            }}
          />
        </motion.div>

        {/* Count indicator - subtle, no red badges */}
        {count !== undefined && count > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
                       bg-white/60 backdrop-blur-sm border border-white/30
                       flex items-center justify-center"
          >
            <span className="text-[8px] font-medium text-foreground/70">
              {count > 9 ? "+" : count}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Label */}
      <motion.span
        className="text-[10px] tracking-[-0.03em] lowercase"
        animate={{
          opacity: isActive ? 0.9 : 0.45,
          color: isActive ? "#4A4543" : "#9B9490",
        }}
        transition={{ duration: 0.3 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
