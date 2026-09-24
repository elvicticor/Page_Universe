"use client";

import { motion, useInView, useMotionValue, useReducedMotion, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Aparece suavemente al entrar en pantalla. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Número que cuenta hasta su valor al aparecer. */
export function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [text, setText] = useState((0).toFixed(decimals));

  useEffect(() => mv.on("change", (v) => setText(v.toLocaleString("es-ES", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }))), [mv, decimals]);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(value); return; }
    const c = animate(mv, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, value, mv, reduce]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/** Cabecera editorial de cada sección. */
export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mx-auto max-w-7xl px-4 pt-28 pb-10 sm:px-6 sm:pt-36">
      <motion.p
        className="label flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <span className="live-dot" /> {kicker}
      </motion.p>
      <motion.h1
        className="mt-4 max-w-4xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl"
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}
      </motion.h1>
      {children && (
        <motion.div
          className="mt-6 max-w-2xl text-lg text-dim"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {children}
        </motion.div>
      )}
    </header>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="panel rounded-2xl p-8 text-center text-dim">{children}</div>;
}
