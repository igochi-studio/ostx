"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  db,
  type PoolEntry,
  addToPool,
  getActivePoolItems,
  resolvePoolItem,
} from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function PoolView() {
  const [input, setInput] = useState("");

  // Live query — auto-updates when DB changes
  const items = useLiveQuery(
    () =>
      db.pool
        .filter((item) => item.resolvedAt === null)
        .reverse()
        .sortBy("createdAt"),
    []
  );

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;
    await addToPool(input.trim());
    setInput("");
  }, [input]);

  const handleResolve = useCallback(async (id: number) => {
    await resolvePoolItem(id);
  }, []);

  const fillLevel = items ? Math.min(items.length / 6, 1) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Pool fill indicator */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <div className="relative w-24 h-14 mb-3">
          <svg
            viewBox="0 0 96 56"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 8 C8 8 8 48 48 48 C88 48 88 8 88 8"
              stroke="rgba(74, 69, 67, 0.15)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <motion.path
              d={`M12 ${48 - fillLevel * 36} C12 ${48 - fillLevel * 36} 12 48 48 48 C84 48 84 ${48 - fillLevel * 36} 84 ${48 - fillLevel * 36}`}
              fill="rgba(214, 229, 239, 0.3)"
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
        </div>
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {!items || items.length === 0
            ? "nothing pressing"
            : items.length === 1
            ? "one thing in the pool"
            : `${items.length} things in the pool`}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {items?.map((item, index) => (
            <PoolCard
              key={item.id}
              item={item}
              index={index}
              onResolve={handleResolve}
            />
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
              the pool is clear.
              <br />
              nothing needs your attention right now.
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
            placeholder="what needs your attention..."
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

function PoolCard({
  item,
  index,
  onResolve,
}: {
  item: PoolEntry;
  index: number;
  onResolve: (id: number) => void;
}) {
  const daysSince = Math.floor(
    (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.85,
        filter: "blur(4px)",
        transition: { duration: 0.4, ease: "easeInOut" },
      }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 30,
        delay: index * 0.05,
      }}
      className="membrane-card p-4 relative"
      style={{
        background:
          item.severity === "rising"
            ? "rgba(232, 213, 206, 0.35)"
            : "rgba(255, 255, 255, 0.35)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] leading-[1.4] tracking-[-0.02em] flex-1">
          {item.content}
        </p>
        <motion.button
          onClick={() => onResolve(item.id!)}
          className="w-5 h-5 rounded-full border border-foreground/10
                     flex items-center justify-center flex-shrink-0 mt-0.5"
          whileTap={{ scale: 0.85 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-foreground/20"
            whileHover={{
              scale: 1.5,
              backgroundColor: "rgba(74, 69, 67, 0.4)",
            }}
          />
        </motion.button>
      </div>
      <p className="text-[9px] text-text-secondary mt-2 tracking-[-0.01em]">
        {daysSince === 0
          ? "added today"
          : daysSince === 1
          ? "since yesterday"
          : `waiting ${daysSince} days`}
        {item.sourceShape && (
          <span className="ml-1 opacity-60">
            · from {item.sourceShape}
          </span>
        )}
      </p>
    </motion.div>
  );
}
