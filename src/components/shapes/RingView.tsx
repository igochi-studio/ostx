"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { db, addRing, addRingNote } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

const weatherLabel: Record<string, string> = {
  warm: "warm",
  cloudy: "cloudy",
  still: "still",
  stormy: "stormy",
};

export default function RingView() {
  const [input, setInput] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const items = useLiveQuery(
    () => db.rings.orderBy("lastInteraction").reverse().toArray(),
    []
  );

  const handleAdd = useCallback(async () => {
    if (!input.trim()) return;
    await addRing(input.trim());
    setInput("");
  }, [input]);

  const cycleWeather = useCallback(
    async (id: number, current: string) => {
      const weathers = ["warm", "cloudy", "still", "stormy"] as const;
      const idx = weathers.indexOf(current as (typeof weathers)[number]);
      const next = weathers[(idx + 1) % weathers.length];
      await db.rings.update(id, { weather: next });
    },
    []
  );

  const handleAddNote = useCallback(
    async (id: number) => {
      if (!noteInput.trim()) return;
      await addRingNote(id, noteInput.trim());
      setNoteInput("");
    },
    [noteInput]
  );

  const markInteraction = useCallback(async (id: number) => {
    await db.rings.update(id, { lastInteraction: new Date() });
  }, []);

  const daysSince = (date: Date) => {
    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return `${days} days`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <p className="text-[10px] text-text-secondary tracking-[-0.02em]">
          {items?.length ?? 0}{" "}
          {items?.length === 1 ? "person" : "people"} in your orbit
        </p>
      </div>

      {/* Rings */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {items?.map((item, index) => {
            const days = Math.floor(
              (Date.now() - item.lastInteraction.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const orbitOpacity = Math.max(0.5, 1 - days * 0.03);
            const isExpanded = expandedId === item.id;

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
                  delay: index * 0.04,
                }}
                className="membrane-card p-4 cursor-pointer"
                style={{
                  background:
                    item.weather === "warm"
                      ? "rgba(240, 223, 192, 0.22)"
                      : item.weather === "stormy"
                      ? "rgba(232, 213, 206, 0.25)"
                      : "rgba(255, 255, 255, 0.35)",
                  borderRadius: "20px",
                }}
                onClick={() =>
                  setExpandedId(isExpanded ? null : item.id!)
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] tracking-[-0.03em] font-medium">
                        {item.personName}
                      </p>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleWeather(item.id!, item.weather);
                        }}
                        className="text-[9px] text-text-secondary/60 tracking-[-0.01em]
                                   px-1.5 py-0.5 rounded-full bg-white/30"
                        whileTap={{ scale: 0.9 }}
                      >
                        {weatherLabel[item.weather]}
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[9px] text-text-secondary/50 tracking-[-0.01em]">
                      {daysSince(item.lastInteraction)}
                    </p>
                    {days > 0 && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          markInteraction(item.id!);
                        }}
                        className="text-[8px] text-text-secondary/40 tracking-[-0.01em]
                                   px-1.5 py-0.5 rounded-full bg-white/20"
                        whileTap={{ scale: 0.9 }}
                      >
                        seen today
                      </motion.button>
                    )}
                  </div>
                </div>

                {days > 7 && (
                  <p className="text-[9px] text-text-secondary/40 mt-1.5 tracking-[-0.01em]">
                    their ring is widening
                  </p>
                )}

                {/* Expanded — notes */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-foreground/5">
                        {/* Existing notes */}
                        {item.notes.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {item.notes
                              .slice(-3)
                              .reverse()
                              .map((note, i) => (
                                <p
                                  key={i}
                                  className="text-[10px] text-foreground/60 leading-[1.4] tracking-[-0.02em]"
                                >
                                  {note.content}
                                  <span className="text-text-secondary/40 ml-1">
                                    ·{" "}
                                    {daysSince(new Date(note.date))}
                                  </span>
                                </p>
                              ))}
                          </div>
                        )}

                        {/* Add note input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter")
                                handleAddNote(item.id!);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="add a note..."
                            className="flex-1 bg-white/20 rounded-lg px-2.5 py-1.5
                                       text-[10px] tracking-[-0.02em]
                                       placeholder:text-text-secondary/40 outline-none leading-normal"
                          />
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNote(item.id!);
                            }}
                            className="text-[9px] text-text-secondary/50 uppercase"
                            whileTap={{ scale: 0.9 }}
                          >
                            add
                          </motion.button>
                        </div>

                        {/* Gifts section */}
                        {item.gifts.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.gifts.map((gift, i) => (
                              <span
                                key={i}
                                className="text-[9px] text-text-secondary/50 bg-white/20
                                           rounded-full px-2 py-0.5"
                              >
                                {gift}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
              no one in your orbit yet.
              <br />
              add the people who matter.
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
            placeholder="add someone to your orbit..."
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
