"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { db, addDroplet } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function DropletView() {
  const [input, setInput] = useState("");

  const items = useLiveQuery(
    () => db.droplets.orderBy("createdAt").reverse().limit(50).toArray(),
    []
  );

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;
    await addDroplet(input.trim());
    setInput("");
  }, [input]);

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {items?.length ?? 0} {items?.length === 1 ? "drop" : "drops"} collected
        </p>
      </div>

      {/* Droplets */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="popLayout">
          {items?.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.04,
              }}
              className="mb-3"
              style={{
                paddingLeft: `${(index % 3) * 6}px`,
                paddingRight: `${((index + 1) % 3) * 6}px`,
              }}
            >
              <motion.div
                className="membrane-card p-4 relative overflow-hidden"
                style={{
                  background: "rgba(214, 229, 239, 0.18)",
                  borderRadius: `${18 + (index % 3) * 3}px`,
                }}
                animate={{ y: [0, -1.5, 0] }}
                transition={{
                  duration: 5 + index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.6,
                }}
              >
                <p className="text-[12px] leading-[1.5] tracking-[-0.02em] text-foreground/80">
                  {item.content}
                </p>
                <p className="text-[9px] text-text-secondary/50 mt-2 tracking-[-0.01em]">
                  {timeAgo(item.createdAt)}
                  {item.surfacedCount > 0 && (
                    <span className="ml-1 opacity-60">
                      · surfaced {item.surfacedCount}x
                    </span>
                  )}
                </p>
              </motion.div>
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
              no drops yet.
              <br />
              what&apos;s on your mind?
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
            placeholder="let it drop..."
            className="flex-1 bg-transparent text-[12px] tracking-[-0.02em]
                       placeholder:text-text-secondary/50 outline-none leading-normal"
          />
          <motion.button
            onClick={handleAdd}
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
