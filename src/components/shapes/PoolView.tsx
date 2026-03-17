"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { db, type PoolEntry, addToPool, addDroplet } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number, severity: string): string {
  if (severity === "rising") {
    if (days === 0) return "needs attention today";
    if (days === 1) return "pressing since yesterday";
    return `rising for ${days} days`;
  }
  if (days === 0) return "added today";
  if (days === 1) return "since yesterday";
  if (days <= 3) return `waiting ${days} days`;
  return `${days} days — still here when you're ready`;
}

export default function PoolView() {
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const items = useLiveQuery(
    () =>
      db.pool
        .filter((item) => item.resolvedAt === null)
        .toArray()
        .then((arr) => {
          // Sort: rising first, then by age
          const severityOrder: Record<string, number> = {
            rising: 0, steady: 1, receding: 2,
          };
          return arr.sort((a, b) => {
            const sp = (severityOrder[a.severity] ?? 1) - (severityOrder[b.severity] ?? 1);
            if (sp !== 0) return sp;
            return a.createdAt.getTime() - b.createdAt.getTime(); // oldest first
          });
        }),
    []
  );

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;
    await addToPool(input.trim());
    setInput("");
  }, [input]);

  const handleResolve = useCallback(async (id: number) => {
    const item = await db.pool.get(id);
    if (!item) return;
    await db.pool.update(id, { resolvedAt: new Date() });
    // Leave a reflection droplet
    await addDroplet(`resolved: ${item.content}`);
    setExpandedId(null);
  }, []);

  const handleEdit = useCallback(
    async (id: number) => {
      if (!editText.trim()) return;
      await db.pool.update(id, { content: editText.trim() });
      setEditingId(null);
      setEditText("");
    },
    [editText]
  );

  const cycleSeverity = useCallback(async (id: number, current: string) => {
    const severities: PoolEntry["severity"][] = ["steady", "rising", "receding"];
    const idx = severities.indexOf(current as PoolEntry["severity"]);
    const next = severities[(idx + 1) % severities.length];
    await db.pool.update(id, { severity: next });
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await db.pool.update(id, { resolvedAt: new Date() });
    setExpandedId(null);
  }, []);

  const fillLevel = items ? Math.min(items.length / 6, 1) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Pool fill indicator */}
      <div className="flex flex-col items-center pt-4 pb-4">
        <div className="relative w-20 h-12 mb-2">
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            fill="none"
          >
            <path
              d="M6 6 C6 6 6 42 40 42 C74 42 74 6 74 6"
              stroke="rgba(74, 69, 67, 0.12)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <motion.path
              d={`M10 ${42 - fillLevel * 32} C10 ${42 - fillLevel * 32} 10 42 40 42 C70 42 70 ${42 - fillLevel * 32} 70 ${42 - fillLevel * 32}`}
              fill={
                fillLevel > 0.6
                  ? "rgba(232, 213, 206, 0.4)"
                  : "rgba(214, 229, 239, 0.25)"
              }
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </svg>
        </div>
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {!items || items.length === 0
            ? "the pool is clear"
            : items.length === 1
            ? "one thing needs attention"
            : `${items.length} things in the pool`}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {items?.map((item, index) => {
            const days = daysSince(item.createdAt);
            const isExpanded = expandedId === item.id;
            const isEditing = editingId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  filter: "blur(4px)",
                  transition: { duration: 0.4 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                  delay: index * 0.04,
                }}
                className="cursor-pointer"
                onClick={() => !isEditing && setExpandedId(isExpanded ? null : item.id!)}
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    background:
                      item.severity === "rising"
                        ? "rgba(232, 213, 206, 0.3)"
                        : "rgba(255, 255, 255, 0.3)",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                >
                  <div className="p-4">
                    {isEditing ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleEdit(item.id!)}
                          autoFocus
                          className="w-full bg-transparent text-[12px] tracking-[-0.02em]
                                     outline-none"
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-[12px] leading-[1.4] tracking-[-0.02em]">
                            {item.content}
                          </p>
                          <p className="text-[9px] text-text-secondary/45 mt-1.5 tracking-[-0.01em]">
                            {urgencyLabel(days, item.severity)}
                            {item.sourceShape && (
                              <span className="opacity-60">
                                {" "}· from {item.sourceShape}
                              </span>
                            )}
                          </p>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(item.id!);
                          }}
                          className="w-[18px] h-[18px] rounded-full border border-foreground/12
                                     flex items-center justify-center flex-shrink-0 mt-0.5"
                          whileTap={{ scale: 0.8 }}
                        >
                          <div className="w-[5px] h-[5px] rounded-full bg-foreground/15" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Expanded */}
                  <AnimatePresence>
                    {isExpanded && !isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 border-t border-white/10 pt-2">
                          {/* Severity selector */}
                          <div className="flex gap-1.5 mb-3">
                            {(["steady", "rising", "receding"] as const).map((s) => (
                              <motion.button
                                key={s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cycleSeverity(item.id!, item.severity);
                                }}
                                className={`text-[9px] tracking-[-0.01em] px-2.5 py-1 rounded-full
                                  ${item.severity === s
                                    ? "bg-foreground/10 text-foreground/70"
                                    : "bg-white/20 text-text-secondary/40"
                                  }`}
                                whileTap={{ scale: 0.9 }}
                              >
                                {s}
                              </motion.button>
                            ))}
                          </div>

                          <div className="flex gap-3 items-center">
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
                                handleDelete(item.id!);
                              }}
                              className="text-[9px] text-red-400/40 tracking-[-0.01em] ml-auto"
                              whileTap={{ scale: 0.9 }}
                            >
                              dismiss
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
