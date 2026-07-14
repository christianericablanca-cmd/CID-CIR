"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import { randomVerse } from "@/lib/verses";

const LS_KEY = "cid-dds-shown";

export function VersePopup() {
  const [show, setShow] = React.useState(false);
  const verse = React.useRef(randomVerse());

  React.useEffect(() => {
    const shown = localStorage.getItem(LS_KEY);
    if (!shown) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(LS_KEY, "true");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button
              onClick={() => setShow(false)}
              className="absolute right-4 top-4 z-10 rounded-md p-1 text-muted transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div className="relative mb-6 flex flex-col items-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent ring-1 ring-accent/20">
                <BookOpen className="size-7" />
              </div>
              <span className="mt-3 text-[11px] uppercase tracking-[0.2em] text-accent">
                Daily Dose of Scripture
              </span>
              <div className="mt-4 h-px w-12 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
            </div>

            <p className="text-center text-base leading-relaxed text-foreground sm:text-lg">
              <span className="text-accent/60">&ldquo;</span>
              {verse.current.text}
              <span className="text-accent/60">&rdquo;</span>
            </p>

            <p className="mt-5 text-center text-sm font-medium text-accent">
              — {verse.current.ref}
            </p>

            <button
              onClick={() => setShow(false)}
              className="mt-7 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-accent/30 active:scale-[0.98]"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
