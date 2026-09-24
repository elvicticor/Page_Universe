import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Nav from "@/components/Nav";
import Providers from "@/components/Providers";
import StarBackground from "@/components/StarBackground";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: { default: "Universo en vivo", template: "%s · Universo en vivo" },
  description:
    "Explora el sistema solar en 3D, sigue a la ISS en tiempo real y consulta asteroides, clima espacial y lanzamientos con datos abiertos de la NASA.",
};

export const viewport: Viewport = { themeColor: "#04050a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body className="min-h-dvh">
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <Providers>
          <StarBackground />
          <Nav />
          <main id="contenido" className="relative">{children}</main>
        </Providers>
        <footer className="relative mt-32 border-t hairline">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-display text-3xl italic">Universo en vivo</p>
              <p className="mt-2 max-w-md text-sm text-dim">
                Datos abiertos de NASA (APOD, NeoWs, EPIC, DONKI, Image Library), NOAA SWPC, Where the ISS at? y The
                Space Devs. Texturas planetarias de Solar System Scope (CC BY 4.0).
              </p>
            </div>
            <p className="label self-end">Hecho con Next.js · Three.js</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
