"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import { randomVerse } from "@/lib/verses";

const LS_KEY = "cid-cir-verse-shown";

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
              className="absolute right-4 top-4 rounded-md p-1 text-muted transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <BookOpen className="size-6" />
            </div>

            <p className="text-base leading-relaxed text-foreground sm:text-lg">
              &ldquo;{verse.current.text}&rdquo;
            </p>

            <p className="mt-4 text-sm font-medium text-accent">
              — {verse.current.ref}
            </p>

            <button
              onClick={() => setShow(false)}
              className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
