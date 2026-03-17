"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { db, type PebbleEntry, addPebble, settlePebble } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

const WEIGHT_ORDER: PebbleEntry["weight"][] = ["light", "steady", "heavy", "crushing"];

const WEIGHT_STYLES: Record<string, { bg: string; accent: string; label: string }> = {
  light: {
    bg: "rgba(214, 229, 239, 0.15)",
    accent: "rgba(214, 229, 239, 0.5)",
    label: "light",
  },
  steady: {
    bg: "rgba(234, 226, 214, 0.2)",
    accent: "rgba(234, 226, 214, 0.6)",
    label: "steady",
  },
  heavy: {
    bg: "rgba(232, 213, 206, 0.25)",
    accent: "rgba(232, 213, 206, 0.7)",
    label: "heavy",
  },
  crushing: {
    bg: "rgba(155, 148, 144, 0.15)",
    accent: "rgba(155, 148, 144, 0.5)",
    label: "crushing",
  },
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function timeNudge(item: PebbleEntry): string | null {
  const days = daysSince(item.lastTouched);
  if (days === 0) return null;
  if (days === 1) return "since yesterday";
  if (days <= 3) return `sitting for ${days} days`;
  if (days <= 7) return `waiting ${days} days — getting heavier`;
  return `${days} days — this might need the pool`;
}

export default function PebbleView() {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const items = useLiveQuery(
    () =>
      db.pebbles
        .where("status")
        .equals("carrying")
        .toArray()
        .then((arr) => {
          // Sort: crushing first, then heavy, then by creation date
          const weightPriority: Record<string, number> = {
            crushing: 0, heavy: 1, steady: 2, light: 3,
          };
          return arr.sort((a, b) => {
            const wp = (weightPriority[a.weight] ?? 2) - (weightPriority[b.weight] ?? 2);
            if (wp !== 0) return wp;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
        }),
    []
  );

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;
    await addPebble(input.trim());
    setInput("");
  }, [input]);

  const handleSettle = useCallback(async (id: number) => {
    await settlePebble(id);
    setExpandedId(null);
  }, []);

  const handleEdit = useCallback(
    async (id: number) => {
      if (!editText.trim()) return;
      await db.pebbles.update(id, {
        title: editText.trim(),
        lastTouched: new Date(),
      });
      setEditingId(null);
      setEditText("");
    },
    [editText]
  );

  const setWeight = useCallback(async (id: number, weight: PebbleEntry["weight"]) => {
    await db.pebbles.update(id, { weight, lastTouched: new Date() });
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await db.pebbles.update(id, { status: "released" as const });
    setExpandedId(null);
  }, []);

  const moveToPool = useCallback(async (id: number) => {
    const pebble = await db.pebbles.get(id);
    if (!pebble) return;
    await db.pool.add({
      content: pebble.title,
      sourceShape: "pebble",
      sourceId: id,
      severity: "steady",
      createdAt: new Date(),
      resolvedAt: null,
    });
    await db.pebbles.update(id, { poolMigratedAt: new Date(), status: "eroded" as const });
    setExpandedId(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-4">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          carrying {items?.length ?? 0}{" "}
          {items?.length === 1 ? "pebble" : "pebbles"}
        </p>
      </div>

      {/* Pebbles — structured, grounded, stacked */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {items?.map((item, index) => {
            const style = WEIGHT_STYLES[item.weight];
            const nudge = timeNudge(item);
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.95,
                  filter: "blur(3px)",
                  transition: { duration: 0.35 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.03,
                }}
                onClick={() => !isEditing && setExpandedId(isExpanded ? null : item.id!)}
                className="cursor-pointer"
              >
                {/* Pebble card — flat, slab-like, grounded */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    background: style.bg,
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  {/* Weight indicator — left edge bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{
                      background: style.accent,
                      borderRadius: "3px 0 0 3px",
                    }}
                  />

                  <div className="pl-4 pr-4 py-3.5 ml-[3px]">
                    {isEditing ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleEdit(item.id!)}
                          autoFocus
                          className="w-full bg-transparent text-[12px] tracking-[-0.02em]
                                     text-foreground outline-none"
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
                            className="text-[9px] text-text-secondary/40"
                            whileTap={{ scale: 0.9 }}
                          >
                            cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] leading-[1.3] tracking-[-0.02em] truncate">
                            {item.title}
                          </p>
                          {/* Time nudge */}
                          {nudge && (
                            <p className="text-[9px] text-text-secondary/45 mt-1 tracking-[-0.01em]">
                              {nudge}
                            </p>
                          )}
                        </div>

                        {/* Settle button */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSettle(item.id!);
                          }}
                          className="w-[18px] h-[18px] rounded-full border border-foreground/12
                                     flex items-center justify-center flex-shrink-0"
                          whileTap={{ scale: 0.8 }}
                        >
                          <div className="w-[5px] h-[5px] rounded-full bg-foreground/15" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Expanded actions */}
                  <AnimatePresence>
                    {isExpanded && !isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 ml-[3px]">
                          {/* Weight selector */}
                          <div className="flex gap-1.5 mb-3">
                            {WEIGHT_ORDER.map((w) => (
                              <motion.button
                                key={w}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWeight(item.id!, w);
                                }}
                                className={`text-[9px] tracking-[-0.01em] px-2.5 py-1 rounded-full
                                  ${item.weight === w
                                    ? "bg-foreground/10 text-foreground/70"
                                    : "bg-white/20 text-text-secondary/40"
                                  }`}
                                whileTap={{ scale: 0.9 }}
                              >
                                {w}
                              </motion.button>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-3 items-center">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(item.id!);
                                setEditText(item.title);
                              }}
                              className="text-[9px] text-foreground/40 tracking-[-0.01em]"
                              whileTap={{ scale: 0.9 }}
                            >
                              edit
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToPool(item.id!);
                              }}
                              className="text-[9px] text-foreground/40 tracking-[-0.01em]"
                              whileTap={{ scale: 0.9 }}
                            >
                              → pool
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id!);
                              }}
                              className="text-[9px] text-red-400/40 tracking-[-0.01em] ml-auto"
                              whileTap={{ scale: 0.9 }}
                            >
                              release
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
