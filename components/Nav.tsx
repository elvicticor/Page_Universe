"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const LINKS = [
  { href: "/sistema-solar", label: "Sistema solar" },
  { href: "/iss", label: "ISS en vivo" },
  { href: "/asteroides", label: "Asteroides" },
  { href: "/clima-espacial", label: "Clima espacial" },
  { href: "/tierra", label: "Tierra" },
  { href: "/apod", label: "Foto del día" },
  { href: "/lanzamientos", label: "Lanzamientos" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "border-b hairline bg-void/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid size-7 place-items-center">
            <span className="absolute inset-0 rounded-full border border-sol/60 transition-transform duration-700 group-hover:rotate-180 [border-top-color:transparent]" />
            <span className="size-2 rounded-full bg-sol shadow-[0_0_14px_var(--color-sol)]" />
          </span>
          <span className="font-display text-xl italic tracking-tight">Universo en vivo</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = path.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active ? "text-ink" : "text-dim hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.07] ring-1 ring-white/10"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          className="label rounded-full border hairline px-3 py-1.5 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="menu-movil"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="menu-movil"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 lg:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.li
                key={l.href}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.03 * i }}
                className="border-t hairline"
              >
                <Link href={l.href} className="flex items-baseline justify-between py-3">
                  <span className="font-display text-2xl">{l.label}</span>
                  <span className="label">{String(i + 1).padStart(2, "0")}</span>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}
