"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface RingItem {
  id: string;
  personName: string;
  weather: "warm" | "cloudy" | "still" | "stormy";
  lastInteraction: Date;
  note?: string;
}

const weatherEmoji: Record<string, string> = {
  warm: "",
  cloudy: "",
  still: "",
  stormy: "",
};

const weatherLabel: Record<string, string> = {
  warm: "warm",
  cloudy: "cloudy",
  still: "still",
  stormy: "stormy",
};

const demoItems: RingItem[] = [
  {
    id: "1",
    personName: "maya",
    weather: "warm",
    lastInteraction: new Date(),
    note: "she mentioned wanting to try that new place",
  },
  {
    id: "2",
    personName: "dad",
    weather: "still",
    lastInteraction: new Date(Date.now() - 86400000 * 12),
  },
  {
    id: "3",
    personName: "rohan",
    weather: "cloudy",
    lastInteraction: new Date(Date.now() - 86400000 * 5),
    note: "need to clear the air",
  },
];

export default function RingView() {
  const [items, setItems] = useState<RingItem[]>(demoItems);
  const [input, setInput] = useState("");

  const addItem = () => {
    if (!input.trim()) return;
    setItems((prev) => [
      {
        id: Date.now().toString(),
        personName: input.trim(),
        weather: "warm",
        lastInteraction: new Date(),
      },
      ...prev,
    ]);
    setInput("");
  };

  const cycleWeather = (id: string) => {
    const weathers: RingItem["weather"][] = [
      "warm",
      "cloudy",
      "still",
      "stormy",
    ];
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentIndex = weathers.indexOf(item.weather);
        const next = weathers[(currentIndex + 1) % weathers.length];
        return { ...item, weather: next };
      })
    );
  };

  const daysSince = (date: Date) => {
    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return `${days} days`;
  };

  // Sort by orbit distance (days since interaction)
  const sortedItems = [...items].sort(
    (a, b) => a.lastInteraction.getTime() - b.lastInteraction.getTime()
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {items.length} {items.length === 1 ? "person" : "people"} in your
          orbit
        </p>
      </div>

      {/* Rings */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {sortedItems.map((item, index) => {
            const days = Math.floor(
              (Date.now() - item.lastInteraction.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            // Orbit distance affects opacity — further = more transparent
            const orbitOpacity = Math.max(0.5, 1 - days * 0.03);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: orbitOpacity, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                  delay: index * 0.05,
                }}
                className="membrane-card p-4"
                style={{
                  background:
                    item.weather === "warm"
                      ? "rgba(240, 223, 192, 0.25)"
                      : item.weather === "stormy"
                      ? "rgba(232, 213, 206, 0.3)"
                      : "rgba(255, 255, 255, 0.35)",
                  borderRadius: "20px",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] tracking-[-0.03em] font-medium">
                        {item.personName}
                      </p>
                      <motion.button
                        onClick={() => cycleWeather(item.id)}
                        className="text-[9px] text-text-secondary/60 tracking-[-0.01em]
                                   px-1.5 py-0.5 rounded-full bg-white/30"
                        whileTap={{ scale: 0.9 }}
                      >
                        {weatherLabel[item.weather]}
                      </motion.button>
                    </div>
                    {item.note && (
                      <p className="text-[11px] text-foreground/60 mt-1.5 leading-[1.4] tracking-[-0.02em]">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <p className="text-[9px] text-text-secondary/50 tracking-[-0.01em] flex-shrink-0">
                    {daysSince(item.lastInteraction)}
                  </p>
                </div>
                {days > 7 && (
                  <p className="text-[9px] text-text-secondary/40 mt-2 tracking-[-0.01em] italic">
                    their ring is widening
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input */}
      <motion.div
        className="fixed bottom-20 left-0 right-0 px-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="membrane-card flex items-center px-4 py-3 gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="add someone to your orbit..."
            className="flex-1 bg-transparent text-[12px] tracking-[-0.02em]
                       placeholder:text-text-secondary/50 outline-none"
          />
          <motion.button
            onClick={addItem}
            className="text-[10px] text-text-secondary tracking-[-0.02em] uppercase"
            whileTap={{ scale: 0.9 }}
            animate={{ opacity: input.trim() ? 0.8 : 0.3 }}
          >
            add
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
