"use client";

import { MotionConfig } from "motion/react";

/** Respeta la preferencia del sistema "reducir movimiento" en todas las animaciones de motion. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
