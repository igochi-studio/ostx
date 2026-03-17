"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { db, addDroplet, addPebble, addRing, getRings, type DropletEntry } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { parseDroplet, type ParsedDroplet } from "@/lib/parser";

export default function DropletView() {
  const [input, setInput] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [suggestions, setSuggestions] = useState<ParsedDroplet | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const items = useLiveQuery(
    () => db.droplets.orderBy("createdAt").reverse().limit(50).toArray(),
    []
  );

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;

    // Parse the droplet for intelligence
    const parsed = parseDroplet(input.trim());
    await addDroplet(input.trim());

    // Show suggestions if anything was detected
    if (parsed.suggestedPebbles.length > 0 || parsed.suggestedRings.length > 0) {
      setSuggestions(parsed);
      setShowSuggestions(true);
    }

    setInput("");
  }, [input]);

  const acceptPebbleSuggestion = useCallback(
    async (title: string, weight: "light" | "steady" | "heavy") => {
      await addPebble(title);
      // Mark weight
      const allPebbles = await db.pebbles.orderBy("createdAt").reverse().limit(1).toArray();
      if (allPebbles[0]) {
        await db.pebbles.update(allPebbles[0].id!, { weight });
      }
    },
    []
  );

  const acceptRingSuggestion = useCallback(
    async (name: string, weather: "warm" | "cloudy" | "still" | "stormy") => {
      // Check if person already exists
      const existing = await db.rings.filter(
        (r) => r.personName.toLowerCase() === name.toLowerCase()
      ).first();

      if (existing) {
        // Update interaction
        await db.rings.update(existing.id!, {
          lastInteraction: new Date(),
          weather,
        });
      } else {
        const id = await addRing(name);
        await db.rings.update(id, { weather });
      }
    },
    []
  );

  const dismissSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSuggestions(null);
  }, []);

  const handleEdit = useCallback(async (id: number) => {
    if (!editText.trim()) return;
    await db.droplets.update(id, { content: editText.trim() });
    setEditingId(null);
    setEditText("");
  }, [editText]);

  const handleDelete = useCallback(async (id: number) => {
    await db.droplets.delete(id);
    setExpandedId(null);
  }, []);

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-4">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {items?.length ?? 0} {items?.length === 1 ? "drop" : "drops"} collected
        </p>
      </div>

      {/* Suggestion overlay */}
      <AnimatePresence>
        {showSuggestions && suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mx-5 mb-4 membrane-card p-4"
            style={{ background: "rgba(240, 223, 192, 0.2)" }}
          >
            <p className="text-[10px] text-foreground/50 tracking-[-0.02em] mb-3">
              noticed something in that thought
            </p>

            {/* Suggested pebbles (tasks) */}
            {suggestions.suggestedPebbles.map((pebble, i) => (
              <motion.div
                key={`p-${i}`}
                className="flex items-center justify-between py-2 border-b border-foreground/5 last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex-1">
                  <p className="text-[11px] tracking-[-0.02em] text-foreground/70">
                    {pebble.title}
                  </p>
                  <p className="text-[9px] text-text-secondary/50 mt-0.5">
                    add as pebble · {pebble.weight}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => acceptPebbleSuggestion(pebble.title, pebble.weight)}
                    className="text-[9px] text-foreground/50 px-2 py-1 rounded-full bg-white/30"
                    whileTap={{ scale: 0.9 }}
                  >
                    yes
                  </motion.button>
                </div>
              </motion.div>
            ))}

            {/* Suggested rings (people) */}
            {suggestions.suggestedRings.map((ring, i) => (
              <motion.div
                key={`r-${i}`}
                className="flex items-center justify-between py-2 border-b border-foreground/5 last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (suggestions.suggestedPebbles.length + i) * 0.1 }}
              >
                <div className="flex-1">
                  <p className="text-[11px] tracking-[-0.02em] text-foreground/70">
                    {ring.name}
                  </p>
                  <p className="text-[9px] text-text-secondary/50 mt-0.5">
                    add to orbit · {ring.weather}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => acceptRingSuggestion(ring.name, ring.weather)}
                    className="text-[9px] text-foreground/50 px-2 py-1 rounded-full bg-white/30"
                    whileTap={{ scale: 0.9 }}
                  >
                    yes
                  </motion.button>
                </div>
              </motion.div>
            ))}

            <motion.button
              onClick={dismissSuggestions}
              className="mt-3 text-[9px] text-text-secondary/40 tracking-[-0.01em] w-full text-center"
              whileTap={{ scale: 0.95 }}
            >
              dismiss
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Droplets — organic, floating */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="popLayout">
          {items?.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;

            return (
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
                  delay: index * 0.03,
                }}
                className="mb-3"
              >
                <motion.div
                  className="relative overflow-hidden cursor-pointer"
                  style={{
                    background: "rgba(214, 229, 239, 0.18)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id!)}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    y: isExpanded ? 0 : [0, -1, 0],
                  }}
                  transition={
                    isExpanded
                      ? { type: "spring", stiffness: 300, damping: 25 }
                      : {
                          duration: 5 + index * 0.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.6,
                        }
                  }
                >
                  <div className="p-4">
                    {isEditing ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                          className="w-full bg-transparent text-[12px] leading-[1.5] tracking-[-0.02em]
                                     text-foreground/80 outline-none resize-none min-h-[60px]"
                        />
                        <div className="flex gap-2 mt-2">
                          <motion.button
                            onClick={() => handleEdit(item.id!)}
                            className="text-[9px] text-foreground/50 px-2 py-1 rounded-full bg-white/30"
                            whileTap={{ scale: 0.9 }}
                          >
                            save
                          </motion.button>
                          <motion.button
                            onClick={() => { setEditingId(null); setEditText(""); }}
                            className="text-[9px] text-text-secondary/40 px-2 py-1"
                            whileTap={{ scale: 0.9 }}
                          >
                            cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-[12px] leading-[1.5] tracking-[-0.02em] text-foreground/80 ${
                          isExpanded ? "" : "line-clamp-3"
                        }`}>
                          {item.content}
                        </p>
                        <p className="text-[9px] text-text-secondary/50 mt-2 tracking-[-0.01em]">
                          {timeAgo(item.createdAt)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Expanded actions */}
                  <AnimatePresence>
                    {isExpanded && !isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-white/10 flex gap-3">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(item.id!);
                              setEditText(item.content);
                            }}
                            className="text-[9px] text-foreground/40 tracking-[-0.01em]"
                            whileTap={{ scale: 0.9 }}
                          >
                            edit
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Re-parse and create pebble from this thought
                              const parsed = parseDroplet(item.content);
                              if (parsed.suggestedPebbles.length > 0) {
                                parsed.suggestedPebbles.forEach((p) =>
                                  addPebble(p.title)
                                );
                              } else {
                                addPebble(item.content);
                              }
                            }}
                            className="text-[9px] text-foreground/40 tracking-[-0.01em]"
                            whileTap={{ scale: 0.9 }}
                          >
                            → pebble
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id!);
                            }}
                            className="text-[9px] text-red-400/50 tracking-[-0.01em] ml-auto"
                            whileTap={{ scale: 0.9 }}
                          >
                            dissolve
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
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
              just write what&apos;s on your mind.
              <br />
              <br />
              <span className="text-[9px] text-text-secondary/30">
                the app will pick up on people,
                <br />
                tasks, and feelings automatically.
              </span>
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
            placeholder="drop a thought..."
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
