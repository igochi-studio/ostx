"use client";

import { motion } from "framer-motion";
import ShapeIcon from "./ShapeIcon";

type ShapeType = "pool" | "pebble" | "droplet" | "ring";

interface ShapeNavProps {
  activeShape: ShapeType | null;
  onShapeSelect: (shape: ShapeType) => void;
}

export default function ShapeNav({
  activeShape,
  onShapeSelect,
}: ShapeNavProps) {
  const shapes: { type: ShapeType; label: string; count?: number }[] = [
    { type: "pool", label: "pool", count: 2 },
    { type: "pebble", label: "pebble" },
    { type: "droplet", label: "droplet" },
    { type: "ring", label: "ring" },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-8 pt-4 px-6"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 28,
        delay: 0.6,
      }}
    >
      {/* Glass membrane background */}
      <div
        className="absolute inset-0 backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(to top, rgba(245, 240, 235, 0.85), rgba(245, 240, 235, 0.4))",
          maskImage: "linear-gradient(to top, black 60%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black 60%, transparent)",
        }}
      />

      <div className="relative flex items-center justify-around max-w-xs mx-auto">
        {shapes.map((shape) => (
          <ShapeIcon
            key={shape.type}
            shape={shape.type}
            label={shape.label}
            isActive={activeShape === shape.type}
            onTap={() => onShapeSelect(shape.type)}
            count={shape.count}
          />
        ))}
      </div>
    </motion.nav>
  );
}
