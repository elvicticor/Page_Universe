import { julianDate } from "./astro";

const DEG = Math.PI / 180;

/** Elementos orbitales keplerianos aproximados (JPL, E.M. Standish), válidos 1800–2050. */
type Elements = {
  a: [number, number];
  e: [number, number];
  I: [number, number];
  L: [number, number];
  peri: [number, number];
  node: [number, number];
};

export type Planet = {
  id: string;
  name: string;
  texture: string;
  /** Radio en la escena (exagerado para que se vean). */
  size: number;
  tilt: number;
  /** Horas por rotación sideral (negativo = retrógrada). */
  rotationHours: number;
  color: string;
  ring?: { inner: number; outer: number; texture: string };
  elements?: Elements;
  facts: {
    tipo: string;
    diametroKm: number;
    gravedad: number;
    dia: string;
    anio: string;
    lunas: number;
    temperatura: string;
  };
  blurb: string;
  query: string;
};

export const SUN: Planet = {
  id: "sol",
  name: "Sol",
  texture: "/textures/2k_sun.jpg",
  size: 5,
  tilt: 7.25,
  rotationHours: 609,
  color: "#ffb454",
  facts: {
    tipo: "Estrella enana amarilla (G2V)",
    diametroKm: 1392700,
    gravedad: 274,
    dia: "25,4 días (ecuador)",
    anio: "230 millones de años (órbita galáctica)",
    lunas: 0,
    temperatura: "5.500 °C en la superficie",
  },
  blurb:
    "Contiene el 99,8 % de la masa del sistema solar. Cada segundo convierte unos 4 millones de toneladas de materia en energía.",
  query: "sun solar dynamics observatory",
};

export const PLANETS: Planet[] = [
  {
    id: "mercurio",
    name: "Mercurio",
    texture: "/textures/2k_mercury.jpg",
    size: 0.45,
    tilt: 0.03,
    rotationHours: 1407.6,
    color: "#a8a39d",
    elements: {
      a: [0.38709927, 0.00000037],
      e: [0.20563593, 0.00001906],
      I: [7.00497902, -0.00594749],
      L: [252.2503235, 149472.67411175],
      peri: [77.45779628, 0.16047689],
      node: [48.33076593, -0.12534081],
    },
    facts: { tipo: "Rocoso", diametroKm: 4879, gravedad: 3.7, dia: "176 días terrestres", anio: "88 días", lunas: 0, temperatura: "−173 a 427 °C" },
    blurb: "El planeta más pequeño y el más cercano al Sol. Sin atmósfera que retenga el calor, sus noches son gélidas.",
    query: "mercury messenger",
  },
  {
    id: "venus",
    name: "Venus",
    texture: "/textures/2k_venus_atmosphere.jpg",
    size: 0.85,
    tilt: 177.4,
    rotationHours: -5832.5,
    color: "#e8c587",
    elements: {
      a: [0.72333566, 0.0000039],
      e: [0.00677672, -0.00004107],
      I: [3.39467605, -0.0007889],
      L: [181.9790995, 58517.81538729],
      peri: [131.60246718, 0.00268329],
      node: [76.67984255, -0.27769418],
    },
    facts: { tipo: "Rocoso", diametroKm: 12104, gravedad: 8.9, dia: "117 días terrestres", anio: "225 días", lunas: 0, temperatura: "464 °C" },
    blurb: "Un invernadero desbocado: su atmósfera de CO₂ lo convierte en el planeta más caliente. Gira al revés que casi todos.",
    query: "venus planet",
  },
  {
    id: "tierra",
    name: "Tierra",
    texture: "/textures/2k_earth_daymap.jpg",
    size: 0.9,
    tilt: 23.44,
    rotationHours: 23.93,
    color: "#5aa9ff",
    elements: {
      a: [1.00000261, 0.00000562],
      e: [0.01671123, -0.00004392],
      I: [-0.00001531, -0.01294668],
      L: [100.46457166, 35999.37244981],
      peri: [102.93768193, 0.32327364],
      node: [0, 0],
    },
    facts: { tipo: "Rocoso", diametroKm: 12756, gravedad: 9.8, dia: "24 horas", anio: "365,25 días", lunas: 1, temperatura: "15 °C (media)" },
    blurb: "El único lugar conocido con vida. Su campo magnético nos protege del viento solar y dibuja las auroras.",
    query: "earth from space blue marble",
  },
  {
    id: "marte",
    name: "Marte",
    texture: "/textures/2k_mars.jpg",
    size: 0.6,
    tilt: 25.19,
    rotationHours: 24.62,
    color: "#e0714a",
    elements: {
      a: [1.52371034, 0.00001847],
      e: [0.0933941, 0.00007882],
      I: [1.84969142, -0.00813131],
      L: [-4.55343205, 19140.30268499],
      peri: [-23.94362959, 0.44441088],
      node: [49.55953891, -0.29257343],
    },
    facts: { tipo: "Rocoso", diametroKm: 6792, gravedad: 3.7, dia: "24 h 37 min", anio: "687 días", lunas: 2, temperatura: "−65 °C (media)" },
    blurb: "Hogar del Olympus Mons, el volcán más alto del sistema solar. Los rovers buscan en él rastros de agua antigua.",
    query: "mars surface rover",
  },
  {
    id: "jupiter",
    name: "Júpiter",
    texture: "/textures/2k_jupiter.jpg",
    size: 2.6,
    tilt: 3.13,
    rotationHours: 9.93,
    color: "#d9b38c",
    elements: {
      a: [5.202887, -0.00011607],
      e: [0.04838624, -0.00013253],
      I: [1.30439695, -0.00183714],
      L: [34.39644051, 3034.74612775],
      peri: [14.72847983, 0.21252668],
      node: [100.47390909, 0.20469106],
    },
    facts: { tipo: "Gigante gaseoso", diametroKm: 142984, gravedad: 24.8, dia: "9 h 56 min", anio: "11,9 años", lunas: 97, temperatura: "−110 °C" },
    blurb: "Más del doble de masivo que todos los demás planetas juntos. La Gran Mancha Roja es una tormenta más grande que la Tierra.",
    query: "jupiter juno",
  },
  {
    id: "saturno",
    name: "Saturno",
    texture: "/textures/2k_saturn.jpg",
    size: 2.2,
    tilt: 26.73,
    rotationHours: 10.66,
    color: "#e6cf9a",
    ring: { inner: 1.25, outer: 2.3, texture: "/textures/2k_saturn_ring_alpha.png" },
    elements: {
      a: [9.53667594, -0.0012506],
      e: [0.05386179, -0.00050991],
      I: [2.48599187, 0.00193609],
      L: [49.95424423, 1222.49362201],
      peri: [92.59887831, -0.41897216],
      node: [113.66242448, -0.28867794],
    },
    facts: { tipo: "Gigante gaseoso", diametroKm: 120536, gravedad: 10.4, dia: "10 h 40 min", anio: "29,5 años", lunas: 274, temperatura: "−140 °C" },
    blurb: "Sus anillos de hielo miden 280.000 km de ancho pero apenas un kilómetro de grosor. Es menos denso que el agua.",
    query: "saturn cassini rings",
  },
  {
    id: "urano",
    name: "Urano",
    texture: "/textures/2k_uranus.jpg",
    size: 1.45,
    tilt: 97.77,
    rotationHours: -17.24,
    color: "#9fe3e8",
    elements: {
      a: [19.18916464, -0.00196176],
      e: [0.04725744, -0.00004397],
      I: [0.77263783, -0.00242939],
      L: [313.23810451, 428.48202785],
      peri: [170.9542763, 0.40805281],
      node: [74.01692503, 0.04240589],
    },
    facts: { tipo: "Gigante helado", diametroKm: 51118, gravedad: 8.9, dia: "17 h 14 min", anio: "84 años", lunas: 29, temperatura: "−195 °C" },
    blurb: "Gira tumbado de lado: su eje está inclinado casi 98°. Cada polo vive 42 años de luz y 42 de oscuridad.",
    query: "uranus planet",
  },
  {
    id: "neptuno",
    name: "Neptuno",
    texture: "/textures/2k_neptune.jpg",
    size: 1.4,
    tilt: 28.32,
    rotationHours: 16.11,
    color: "#5b7cff",
    elements: {
      a: [30.06992276, 0.00026291],
      e: [0.00859048, 0.00005105],
      I: [1.77004347, 0.00035372],
      L: [-55.12002969, 218.45945325],
      peri: [44.96476227, -0.32241464],
      node: [131.78422574, -0.00508664],
    },
    facts: { tipo: "Gigante helado", diametroKm: 49528, gravedad: 11.2, dia: "16 h 6 min", anio: "165 años", lunas: 16, temperatura: "−200 °C" },
    blurb: "Tiene los vientos más rápidos medidos en el sistema solar: más de 2.000 km/h. Fue descubierto con matemáticas antes que con telescopio.",
    query: "neptune voyager",
  },
];

/** Posición heliocéntrica eclíptica (UA) de un planeta en una fecha. */
export function heliocentric(el: Elements, date: Date, meanAnomalyOverride?: number) {
  const T = (julianDate(date) - 2451545.0) / 36525;
  const v = (p: [number, number]) => p[0] + p[1] * T;
  const a = v(el.a);
  const e = v(el.e);
  const I = v(el.I) * DEG;
  const L = v(el.L);
  const peri = v(el.peri);
  const node = v(el.node) * DEG;
  const w = peri * DEG - node;
  let M = meanAnomalyOverride ?? (((L - peri) % 360) + 540) % 360 - 180;
  M *= DEG;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(node), sO = Math.sin(node), cI = Math.cos(I), sI = Math.sin(I);
  return {
    x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    z: sw * sI * xp + cw * sI * yp,
  };
}

/** Distancia comprimida para la escena: las órbitas reales no cabrían en pantalla. */
export function sceneRadius(au: number) {
  return 7 + 14 * Math.sqrt(au);
}

/** Pasa de coordenadas eclípticas (UA) a la escena three.js (Y arriba). */
export function toScene(p: { x: number; y: number; z: number }): [number, number, number] {
  const r = Math.hypot(p.x, p.y, p.z);
  const k = sceneRadius(r) / r;
  return [p.x * k, p.z * k, -p.y * k];
}

export function distanceAU(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export const AU_KM = 149597870.7;
