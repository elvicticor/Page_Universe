export const flux = (cls: string) => {
  const base = ({ A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 } as Record<string, number>)[cls[0]] ?? 1e-7;
  return base * (parseFloat(cls.slice(1)) || 1);
};
export const kpColor = (kp: number) => (kp >= 5 ? "#ff6b5b" : kp >= 4 ? "#ffb454" : "#7dffb3");
export const kpLabel = (kp: number) =>
  kp >= 9
    ? "Tormenta extrema (G5)"
    : kp >= 8
      ? "Tormenta severa (G4)"
      : kp >= 7
        ? "Tormenta fuerte (G3)"
        : kp >= 6
          ? "Tormenta moderada (G2)"
          : kp >= 5
            ? "Tormenta menor (G1)"
            : kp >= 4
              ? "Activo"
              : "Tranquilo";

