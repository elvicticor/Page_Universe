import type { Check } from "./validation";

/** Espera acotada; un solo reintento para errores transitorios, sin insistir ante cuotas agotadas. */
export async function getJSON<T>(url: string, revalidate: number, validate: Check): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        if (response.status >= 500 && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }
        return null;
      }
      const value: unknown = await response.json();
      return validate(value) ? value as T : null;
    } catch {
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  // No se registran URLs ni objetos de error que puedan contener claves.
  return null;
}
