"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import ShapeNav from "@/components/ShapeNav";
import Onboarding from "@/components/Onboarding";
import {
  getSettings,
  updateSettings,
  runQuietEngine,
  getActivePoolItems,
  getCarryingPebbles,
  getRecentDroplets,
  getRings,
} from "@/lib/db";

const CausticSurface = dynamic(() => import("@/components/CausticSurface"), {
  ssr: false,
});

const PoolView = dynamic(() => import("@/components/shapes/PoolView"), {
  ssr: false,
});
const PebbleView = dynamic(() => import("@/components/shapes/PebbleView"), {
  ssr: false,
});
const DropletView = dynamic(() => import("@/components/shapes/DropletView"), {
  ssr: false,
});
const RingView = dynamic(() => import("@/components/shapes/RingView"), {
  ssr: false,
});

type ShapeType = "pool" | "pebble" | "droplet" | "ring";

const shapeViews: Record<ShapeType, React.ComponentType> = {
  pool: PoolView,
  pebble: PebbleView,
  droplet: DropletView,
  ring: RingView,
};

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const prefix = name ? `${name}, ` : "";
  if (hour < 6) return `${prefix}still waters`;
  if (hour < 12) return `${prefix}morning light`;
  if (hour < 17) return `${prefix}good afternoon`;
  if (hour < 21) return `${prefix}evening`;
  return `${prefix}night water`;
}

export default function Home() {
  const [activeShape, setActiveShape] = useState<ShapeType | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [userName, setUserName] = useState("");
  const [counts, setCounts] = useState({ pool: 0, pebble: 0, droplet: 0, ring: 0 });

  // Load settings & run quiet engine on mount
  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setShowOnboarding(!settings.onboardingComplete);
      setUserName(settings.userName);
      await updateSettings({ lastOpenedAt: new Date() });

      // Run the quiet engine (erosion, orbits, wave snapshot)
      await runQuietEngine();

      // Load counts for nav badges
      const [poolItems, pebbles, droplets, rings] = await Promise.all([
        getActivePoolItems(),
        getCarryingPebbles(),
        getRecentDroplets(100),
        getRings(),
      ]);
      setCounts({
        pool: poolItems.length,
        pebble: pebbles.length,
        droplet: droplets.length,
        ring: rings.length,
      });
    })();
  }, [activeShape]); // Re-fetch counts when navigating

  const handleOnboardingComplete = async (name: string) => {
    await updateSettings({
      onboardingComplete: true,
      userName: name,
    });
    setUserName(name);
    setShowOnboarding(false);
  };

  const handleShapeSelect = (shape: ShapeType) => {
    setActiveShape(activeShape === shape ? null : shape);
  };

  // Don't render until we know onboarding state
  if (showOnboarding === null) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-background">
        <motion.div
          className="w-2 h-2 rounded-full bg-foreground/15"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    );
  }

  // Onboarding
  if (showOnboarding) {
    return (
      <div className="h-dvh w-screen overflow-hidden relative">
        <CausticSurface />
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const ActiveView = activeShape ? shapeViews[activeShape] : null;

  return (
    <div className="h-dvh w-screen overflow-hidden relative">
      <CausticSurface />

      <div className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          {!activeShape ? (
            /* ===== THE SURFACE ===== */
            <motion.div
              key="surface"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full flex flex-col items-center justify-center px-8"
            >
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
                  animate={{ y: [0, -4, 0] }}
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
                  {getGreeting(userName)}
                </motion.p>
              </motion.div>

              {/* Surface summary — what's present today */}
              <motion.div
                className="mt-10 flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {counts.pool > 0 && (
                  <motion.button
                    onClick={() => setActiveShape("pool")}
                    className="text-[10px] text-foreground/50 tracking-[-0.02em]"
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    {counts.pool} {counts.pool === 1 ? "thing" : "things"} in
                    the pool
                  </motion.button>
                )}
                {counts.pebble > 0 && (
                  <motion.button
                    onClick={() => setActiveShape("pebble")}
                    className="text-[10px] text-foreground/40 tracking-[-0.02em]"
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    carrying {counts.pebble}{" "}
                    {counts.pebble === 1 ? "pebble" : "pebbles"}
                  </motion.button>
                )}
              </motion.div>

              <motion.p
                className="absolute bottom-28 text-[9px] text-text-secondary/30 tracking-[-0.01em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 1 }}
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
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.97,
                filter: "blur(4px)",
              }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
              }}
              className="h-full pt-14"
            >
              {/* Header */}
              <motion.div
                className="fixed top-0 left-0 right-0 z-30 pt-14 pb-3 px-6
                           flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <motion.button
                  onClick={() => setActiveShape(null)}
                  className="text-[10px] text-text-secondary tracking-[-0.02em]"
                  whileTap={{ scale: 0.9, x: -3 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  surface
                </motion.button>
                <p className="text-[11px] tracking-[-0.03em] uppercase font-medium text-foreground/70">
                  {activeShape}
                </p>
                <div className="w-10" />
              </motion.div>

              {/* Glass blur header background */}
              <div
                className="fixed top-0 left-0 right-0 h-28 z-20 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(245, 240, 235, 0.92), transparent)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
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
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
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

      <ShapeNav
        activeShape={activeShape}
        onShapeSelect={handleShapeSelect}
        counts={counts}
      />
    </div>
  );
}
