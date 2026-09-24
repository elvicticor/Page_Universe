"use client";

import { useEffect, useRef } from "react";

/** Campo de estrellas 2D con parpadeo y paralaje al hacer scroll. Barato: un único canvas. */
export default function StarBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = preference.matches;
    let stars: { x: number; y: number; r: number; p: number; s: number; depth: number }[] = [];
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 4200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() ** 3 * 1.4 + 0.25,
        p: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 1.6,
        depth: Math.random() * 0.25 + 0.03,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const sy = reduce ? 0 : window.scrollY;
      for (const st of stars) {
        const y = (((st.y - sy * st.depth) % h) + h) % h;
        const a = reduce ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(st.p + (t / 1000) * st.s));
        ctx.globalAlpha = a * (st.r > 1 ? 1 : 0.75);
        ctx.fillStyle = st.r > 1.2 ? "#ffe8c7" : "#dfe6ff";
        ctx.beginPath();
        ctx.arc(st.x, y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce && !document.hidden) raf = requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    const onResize = () => {
      resize();
      if (reduce) draw(0);
    };
    const onScroll = () => reduce && draw(0);
    const restart = () => { cancelAnimationFrame(raf); reduce = preference.matches; if (!document.hidden) draw(performance.now()); };
    document.addEventListener("visibilitychange", restart);
    preference.addEventListener("change", restart);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", restart);
      preference.removeEventListener("change", restart);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_85%_-10%,rgba(255,180,84,0.08),transparent_60%),radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(127,214,255,0.06),transparent_60%)]"
      />
    </>
  );
}
