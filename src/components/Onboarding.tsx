"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface OnboardingProps {
  onComplete: (name: string) => void;
}

interface OnboardingStep {
  id: string;
  content: React.ReactNode;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState(1);

  const next = () => {
    if (step === steps.length - 1) {
      onComplete(name.trim() || "");
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const steps: OnboardingStep[] = [
    // Step 0 — Welcome
    {
      id: "welcome",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          >
            <Image
              src="/icons/ostx-logo.png"
              alt="ostx"
              width={88}
              height={64}
              className="object-contain mb-6"
              style={{
                filter: "drop-shadow(0 4px 16px rgba(214, 229, 239, 0.4))",
              }}
            />
          </motion.div>

          <motion.h1
            className="text-[16px] tracking-[-0.04em] text-foreground/80 mb-2"
            style={{ fontFamily: "var(--font-brand)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            ostx
          </motion.h1>

          <motion.p
            className="text-[11px] text-text-secondary tracking-[-0.02em] text-center leading-[1.6] max-w-[240px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            a calm place for everything that matters.
            <br />
            <br />
            not a productivity app.
            <br />a presence app.
          </motion.p>
        </div>
      ),
    },

    // Step 1 — The metaphor
    {
      id: "metaphor",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.p
            className="text-[12px] text-foreground/70 tracking-[-0.02em] text-center leading-[1.8] max-w-[260px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            imagine you&apos;re underwater on a still day.
            <br /><br />
            eyes open. warm light filtering through.
            <br /><br />
            caustic patterns dancing on the sand below.
            <br /><br />
            that&apos;s where your life lives in this app —
            <br />
            reflected in light on water.
          </motion.p>
        </div>
      ),
    },

    // Step 2 — Pool
    {
      id: "pool",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          >
            <Image
              src="/icons/pool.png"
              alt="pool"
              width={56}
              height={56}
              className="object-contain mb-5"
            />
          </motion.div>

          <motion.h2
            className="text-[13px] tracking-[-0.03em] font-medium mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            the pool
          </motion.h2>

          <motion.p
            className="text-[11px] text-text-secondary tracking-[-0.02em] text-center leading-[1.7] max-w-[250px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            an open vessel that fills with things
            <br />
            that need your attention.
            <br /><br />
            that email you&apos;re avoiding.
            <br />
            the conversation you need to have.
            <br /><br />
            when the pool is empty, you&apos;re at peace.
          </motion.p>
        </div>
      ),
    },

    // Step 3 — Pebble
    {
      id: "pebble",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          >
            <Image
              src="/icons/pebble.png"
              alt="pebble"
              width={56}
              height={56}
              className="object-contain mb-5"
            />
          </motion.div>

          <motion.h2
            className="text-[13px] tracking-[-0.03em] font-medium mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            the pebble
          </motion.h2>

          <motion.p
            className="text-[11px] text-text-secondary tracking-[-0.02em] text-center leading-[1.7] max-w-[250px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            the things you carry every day.
            <br />
            tasks, errands, to-dos.
            <br /><br />
            each one has weight —
            <br />
            light, steady, heavy, or crushing.
            <br /><br />
            a pebble left too long drifts
            <br />
            into the pool on its own.
          </motion.p>
        </div>
      ),
    },

    // Step 4 — Droplet
    {
      id: "droplet",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          >
            <Image
              src="/icons/droplet.png"
              alt="droplet"
              width={56}
              height={56}
              className="object-contain mb-5"
            />
          </motion.div>

          <motion.h2
            className="text-[13px] tracking-[-0.03em] font-medium mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            the droplet
          </motion.h2>

          <motion.p
            className="text-[11px] text-text-secondary tracking-[-0.02em] text-center leading-[1.7] max-w-[250px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            your inner world.
            <br />
            thoughts, feelings, things you noticed.
            <br /><br />
            each one is a single drop.
            <br />
            no pressure to be coherent.
            <br /><br />
            the app notices when the same
            <br />
            thoughts keep surfacing.
          </motion.p>
        </div>
      ),
    },

    // Step 5 — Ring
    {
      id: "ring",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          >
            <Image
              src="/icons/ring.png"
              alt="ring"
              width={56}
              height={56}
              className="object-contain mb-5"
            />
          </motion.div>

          <motion.h2
            className="text-[13px] tracking-[-0.03em] font-medium mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            the ring
          </motion.h2>

          <motion.p
            className="text-[11px] text-text-secondary tracking-[-0.02em] text-center leading-[1.7] max-w-[250px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            the people in your orbit.
            <br /><br />
            close friends are tight rings.
            <br />
            distant ones are wider orbits.
            <br /><br />
            when you haven&apos;t reached out,
            <br />
            their ring quietly widens.
            <br />
            not guilt — just awareness.
          </motion.p>
        </div>
      ),
    },

    // Step 6 — The water cycle
    {
      id: "cycle",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.p
            className="text-[12px] text-foreground/70 tracking-[-0.02em] text-center leading-[1.8] max-w-[260px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            everything flows.
            <br /><br />
            a thought becomes a task.
            <br />
            a neglected task becomes a weight.
            <br />
            a resolved weight becomes a reflection.
            <br /><br />
            the app moves with you,
            <br />
            in your own time.
            <br /><br />
            no streaks. no badges. no guilt.
            <br />
            just your life, reflected in water.
          </motion.p>
        </div>
      ),
    },

    // Step 7 — Name
    {
      id: "name",
      content: (
        <div className="flex flex-col items-center justify-center h-full px-10">
          <motion.p
            className="text-[12px] text-foreground/70 tracking-[-0.02em] text-center leading-[1.6] mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            what should we call you?
          </motion.p>

          <motion.div
            className="w-full max-w-[220px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && next()}
              placeholder="your name"
              autoFocus
              className="w-full bg-transparent text-center text-[14px] tracking-[-0.03em]
                         placeholder:text-text-secondary/40 outline-none
                         border-b border-foreground/10 pb-2"
            />
          </motion.div>

          <motion.p
            className="text-[9px] text-text-secondary/40 tracking-[-0.01em] mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            or leave it empty — the app doesn&apos;t mind
          </motion.p>
        </div>
      ),
    },
  ];

  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      y: dir > 0 ? 40 : -40,
      scale: 0.97,
    }),
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: (dir: number) => ({
      opacity: 0,
      y: dir > 0 ? -30 : 30,
      scale: 0.97,
      filter: "blur(4px)",
    }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Progress dots */}
      <div className="fixed top-14 left-0 right-0 flex justify-center gap-1.5 z-50">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full"
            animate={{
              backgroundColor:
                i === step ? "rgba(74, 69, 67, 0.5)" : "rgba(74, 69, 67, 0.12)",
              scale: i === step ? 1.3 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 28,
          }}
          className="h-full"
        >
          {steps[step].content}
        </motion.div>
      </AnimatePresence>

      {/* Bottom action */}
      <div className="fixed bottom-12 left-0 right-0 flex flex-col items-center gap-4 px-10">
        <motion.button
          onClick={next}
          className="w-full max-w-[260px] py-3 rounded-2xl text-[11px] tracking-[-0.02em]
                     font-medium membrane-card text-foreground/70"
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          // Delay button appearance
          key={`btn-${step}`}
        >
          {step === 0
            ? "begin"
            : step === steps.length - 1
            ? "enter the water"
            : "continue"}
        </motion.button>

        {step > 0 && step < steps.length - 1 && (
          <motion.button
            onClick={() => {
              setDirection(-1);
              setStep((s) => s - 1);
            }}
            className="text-[9px] text-text-secondary/40 tracking-[-0.01em]"
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            back
          </motion.button>
        )}
      </div>
    </div>
  );
}
