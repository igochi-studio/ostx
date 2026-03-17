"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import ShapeNav from "@/components/ShapeNav";

// Dynamic import for Three.js (no SSR)
const CausticSurface = dynamic(() => import("@/components/CausticSurface"), {
  ssr: false,
});

// Shape views
const PoolView = dynamic(
  () => import("@/components/shapes/PoolView"),
  { ssr: false }
);
const PebbleView = dynamic(
  () => import("@/components/shapes/PebbleView"),
  { ssr: false }
);
const DropletView = dynamic(
  () => import("@/components/shapes/DropletView"),
  { ssr: false }
);
const RingView = dynamic(
  () => import("@/components/shapes/RingView"),
  { ssr: false }
);

type ShapeType = "pool" | "pebble" | "droplet" | "ring";

const shapeViews: Record<ShapeType, React.ComponentType> = {
  pool: PoolView,
  pebble: PebbleView,
  droplet: DropletView,
  ring: RingView,
};

// Get time-appropriate greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "still waters";
  if (hour < 12) return "morning light";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night water";
}

export default function Home() {
  const [activeShape, setActiveShape] = useState<ShapeType | null>(null);

  const handleShapeSelect = (shape: ShapeType) => {
    if (activeShape === shape) {
      setActiveShape(null);
    } else {
      setActiveShape(shape);
    }
  };

  const ActiveView = activeShape ? shapeViews[activeShape] : null;

  return (
    <div className="h-dvh w-screen overflow-hidden relative">
      {/* Caustic shader background */}
      <CausticSurface />

      {/* Content layer */}
      <div className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          {!activeShape ? (
            /* ===== THE SURFACE — Home ===== */
            <motion.div
              key="surface"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full flex flex-col items-center justify-center px-8"
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  delay: 0.1,
                }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Image
                    src="/icons/ostx-logo.png"
                    alt="ostx"
                    width={72}
                    height={52}
                    className="object-contain mb-4"
                    style={{
                      filter:
                        "drop-shadow(0 4px 12px rgba(214, 229, 239, 0.3))",
                    }}
                  />
                </motion.div>

                <motion.h1
                  className="text-[14px] tracking-[-0.04em] text-foreground/80 mb-1"
                  style={{ fontFamily: "var(--font-brand)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  ostx
                </motion.h1>

                <motion.p
                  className="text-[10px] text-text-secondary tracking-[-0.02em]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.5 }}
                >
                  {getGreeting()}
                </motion.p>
              </motion.div>

              {/* Gentle hint to explore */}
              <motion.p
                className="absolute bottom-28 text-[9px] text-text-secondary/40 tracking-[-0.01em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                tap a shape below
              </motion.p>
            </motion.div>
          ) : (
            /* ===== SHAPE VIEW ===== */
            <motion.div
              key={activeShape}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97, filter: "blur(4px)" }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
              }}
              className="h-full pt-14"
            >
              {/* Shape header with back gesture */}
              <motion.div
                className="fixed top-0 left-0 right-0 z-30 pt-14 pb-3 px-6
                           flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 30 }}
              >
                <motion.button
                  onClick={() => setActiveShape(null)}
                  className="text-[10px] text-text-secondary tracking-[-0.02em]"
                  whileTap={{ scale: 0.9, x: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  surface
                </motion.button>
                <p
                  className="text-[11px] tracking-[-0.03em] uppercase font-medium text-foreground/70"
                >
                  {activeShape}
                </p>
                <div className="w-10" /> {/* Spacer for alignment */}
              </motion.div>

              {/* Glass blur behind header */}
              <div
                className="fixed top-0 left-0 right-0 h-24 z-20 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(245, 240, 235, 0.9), transparent)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  maskImage:
                    "linear-gradient(to bottom, black 50%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 50%, transparent)",
                }}
              />

              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-foreground/20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                }
              >
                {ActiveView && <ActiveView />}
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shape navigation */}
      <ShapeNav activeShape={activeShape} onShapeSelect={handleShapeSelect} />
    </div>
  );
}
