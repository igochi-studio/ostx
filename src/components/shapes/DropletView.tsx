"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface DropletItem {
  id: string;
  content: string;
  createdAt: Date;
}

const demoItems: DropletItem[] = [
  {
    id: "1",
    content: "i keep thinking about what it would feel like to live near the ocean",
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: "2",
    content: "noticed the light was different today",
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "3",
    content: "maybe i should call dad more often",
    createdAt: new Date(),
  },
];

export default function DropletView() {
  const [items, setItems] = useState<DropletItem[]>(demoItems);
  const [input, setInput] = useState("");

  const addItem = () => {
    if (!input.trim()) return;
    setItems((prev) => [
      {
        id: Date.now().toString(),
        content: input.trim(),
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setInput("");
  };

  const timeAgo = (date: Date) => {
    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {items.length} {items.length === 1 ? "drop" : "drops"} collected
        </p>
      </div>

      {/* Droplets — floating, organic layout */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.3 },
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.06,
              }}
              className="mb-4"
              style={{
                paddingLeft: `${(index % 3) * 8}px`,
                paddingRight: `${((index + 1) % 3) * 8}px`,
              }}
            >
              <motion.div
                className="membrane-card p-4 relative overflow-hidden"
                style={{
                  background: "rgba(214, 229, 239, 0.2)",
                  borderRadius: `${18 + (index % 3) * 4}px`,
                }}
                animate={{
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 5 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.8,
                }}
              >
                <p className="text-[12px] leading-[1.5] tracking-[-0.02em] text-foreground/80">
                  {item.content}
                </p>
                <p className="text-[9px] text-text-secondary/50 mt-2 tracking-[-0.01em]">
                  {timeAgo(item.createdAt)}
                </p>
              </motion.div>
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
            placeholder="let it drop..."
            className="flex-1 bg-transparent text-[12px] tracking-[-0.02em]
                       placeholder:text-text-secondary/50 outline-none"
          />
          <motion.button
            onClick={addItem}
            className="text-[10px] text-text-secondary tracking-[-0.02em] uppercase"
            whileTap={{ scale: 0.9 }}
            animate={{ opacity: input.trim() ? 0.8 : 0.3 }}
          >
            drop
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
