"use client";

import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useState } from "react";

interface PebbleItem {
  id: string;
  title: string;
  weight: "light" | "steady" | "heavy" | "crushing";
  status: "carrying" | "settled" | "released";
  createdAt: Date;
}

const weightLabels: Record<string, string> = {
  light: "light",
  steady: "steady",
  heavy: "heavy",
  crushing: "crushing",
};

const demoItems: PebbleItem[] = [
  {
    id: "1",
    title: "finish the presentation slides",
    weight: "steady",
    status: "carrying",
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "grocery run",
    weight: "light",
    status: "carrying",
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "schedule dentist appointment",
    weight: "light",
    status: "carrying",
    createdAt: new Date(Date.now() - 86400000 * 4),
  },
];

export default function PebbleView() {
  const [items, setItems] = useState<PebbleItem[]>(demoItems);
  const [input, setInput] = useState("");

  const addItem = () => {
    if (!input.trim()) return;
    setItems((prev) => [
      {
        id: Date.now().toString(),
        title: input.trim(),
        weight: "steady",
        status: "carrying",
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setInput("");
  };

  const settleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "settled" as const } : item
      )
    );
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 600);
  };

  const cycleWeight = (id: string) => {
    const weights: PebbleItem["weight"][] = [
      "light",
      "steady",
      "heavy",
      "crushing",
    ];
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentIndex = weights.indexOf(item.weight);
        const nextWeight = weights[(currentIndex + 1) % weights.length];
        return { ...item, weight: nextWeight };
      })
    );
  };

  const carryingItems = items.filter((i) => i.status === "carrying");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          carrying {carryingItems.length}{" "}
          {carryingItems.length === 1 ? "pebble" : "pebbles"}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-2">
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{
                  opacity: item.status === "settled" ? 0.4 : 1,
                  scale: item.status === "settled" ? 0.95 : 1,
                  y: 0,
                  filter:
                    item.status === "settled" ? "blur(2px)" : "blur(0px)",
                }}
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
                }}
                className="membrane-card p-4 cursor-grab active:cursor-grabbing"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p
                      className="text-[12px] leading-[1.4] tracking-[-0.02em]"
                      style={{
                        textDecoration:
                          item.status === "settled"
                            ? "line-through"
                            : "none",
                        textDecorationColor: "rgba(74, 69, 67, 0.2)",
                      }}
                    >
                      {item.title}
                    </p>
                    {/* Weight indicator */}
                    <motion.button
                      onClick={() => cycleWeight(item.id)}
                      className="mt-1.5 text-[9px] text-text-secondary/60 tracking-[-0.01em]"
                      whileTap={{ scale: 0.95 }}
                    >
                      {weightLabels[item.weight]}
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={() => settleItem(item.id)}
                    className="w-5 h-5 rounded-full border border-foreground/10
                               flex items-center justify-center flex-shrink-0 mt-0.5"
                    whileTap={{ scale: 0.85 }}
                  >
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full"
                      animate={{
                        backgroundColor:
                          item.status === "settled"
                            ? "rgba(74, 69, 67, 0.5)"
                            : "rgba(74, 69, 67, 0.2)",
                      }}
                    />
                  </motion.button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
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
            placeholder="pick up a pebble..."
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
