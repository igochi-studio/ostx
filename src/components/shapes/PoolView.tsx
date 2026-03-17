"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface PoolItem {
  id: string;
  content: string;
  severity: "rising" | "steady" | "receding";
  createdAt: Date;
}

const demoItems: PoolItem[] = [
  {
    id: "1",
    content: "reply to the landlord about the lease",
    severity: "rising",
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "2",
    content: "that conversation with mom",
    severity: "steady",
    createdAt: new Date(Date.now() - 86400000),
  },
];

export default function PoolView() {
  const [items, setItems] = useState<PoolItem[]>(demoItems);
  const [input, setInput] = useState("");

  const addItem = () => {
    if (!input.trim()) return;
    setItems((prev) => [
      {
        id: Date.now().toString(),
        content: input.trim(),
        severity: "steady",
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setInput("");
  };

  const resolveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Pool fill level (0-1)
  const fillLevel = Math.min(items.length / 6, 1);

  return (
    <div className="flex flex-col h-full">
      {/* Pool fill indicator — the concave vessel */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <div className="relative w-24 h-14 mb-3">
          {/* Vessel outline */}
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
            {/* Water fill */}
            <motion.path
              d={`M12 ${48 - fillLevel * 36} C12 ${48 - fillLevel * 36} 12 48 48 48 C84 48 84 ${48 - fillLevel * 36} 84 ${48 - fillLevel * 36}`}
              fill="rgba(214, 229, 239, 0.3)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
        </div>
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {items.length === 0
            ? "nothing pressing"
            : items.length === 1
            ? "one thing"
            : `${items.length} things`}{" "}
          in the pool
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
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
              className="membrane-card p-4 relative group"
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
                  onClick={() => resolveItem(item.id)}
                  className="w-5 h-5 rounded-full border border-foreground/10
                             flex items-center justify-center flex-shrink-0 mt-0.5"
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ borderColor: "rgba(74, 69, 67, 0.3)" }}
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-foreground/20"
                    whileHover={{ scale: 1.5, backgroundColor: "rgba(74, 69, 67, 0.4)" }}
                  />
                </motion.button>
              </div>
              <p className="text-[9px] text-text-secondary mt-2 tracking-[-0.01em]">
                {item.severity === "rising"
                  ? "this has been waiting"
                  : "still here when you're ready"}
              </p>
            </motion.div>
          ))}
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
            placeholder="what needs your attention..."
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
