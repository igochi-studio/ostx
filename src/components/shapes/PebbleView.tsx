"use client";

import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useState, useCallback } from "react";
import {
  db,
  type PebbleEntry,
  addPebble,
  settlePebble,
} from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

const weightLabels: Record<string, string> = {
  light: "light",
  steady: "steady",
  heavy: "heavy",
  crushing: "crushing",
};

export default function PebbleView() {
  const [input, setInput] = useState("");

  const items = useLiveQuery(
    () =>
      db.pebbles
        .where("status")
        .equals("carrying")
        .reverse()
        .sortBy("createdAt"),
    []
  );

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;
    await addPebble(input.trim());
    setInput("");
  }, [input]);

  const handleSettle = useCallback(async (id: number) => {
    await settlePebble(id);
  }, []);

  const cycleWeight = useCallback(async (id: number, currentWeight: string) => {
    const weights: PebbleEntry["weight"][] = ["light", "steady", "heavy", "crushing"];
    const currentIndex = weights.indexOf(currentWeight as PebbleEntry["weight"]);
    const nextWeight = weights[(currentIndex + 1) % weights.length];
    await db.pebbles.update(id, { weight: nextWeight, lastTouched: new Date() });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          carrying {items?.length ?? 0}{" "}
          {items?.length === 1 ? "pebble" : "pebbles"}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-2">
        <AnimatePresence mode="popLayout">
          {items?.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.8,
                y: -10,
                filter: "blur(4px)",
                transition: { duration: 0.4 },
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
                delay: index * 0.04,
              }}
              className="membrane-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[12px] leading-[1.4] tracking-[-0.02em]">
                    {item.title}
                  </p>
                  <motion.button
                    onClick={() => cycleWeight(item.id!, item.weight)}
                    className="mt-1.5 text-[9px] text-text-secondary/60 tracking-[-0.01em]"
                    whileTap={{ scale: 0.95 }}
                  >
                    {weightLabels[item.weight]}
                  </motion.button>
                </div>
                <motion.button
                  onClick={() => handleSettle(item.id!)}
                  className="w-5 h-5 rounded-full border border-foreground/10
                             flex items-center justify-center flex-shrink-0 mt-0.5"
                  whileTap={{ scale: 0.85 }}
                >
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items && items.length === 0 && (
          <motion.div
            className="flex flex-col items-center pt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[11px] text-text-secondary/40 tracking-[-0.02em] text-center leading-[1.6]">
              nothing to carry right now.
              <br />
              your hands are free.
            </p>
          </motion.div>
        )}
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
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="pick up a pebble..."
            className="flex-1 bg-transparent text-[12px] tracking-[-0.02em]
                       placeholder:text-text-secondary/50 outline-none leading-normal"
          />
          <motion.button
            onClick={handleAdd}
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
