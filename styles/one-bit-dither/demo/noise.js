// deterministic value noise in JS (terrain, rock shapes) and the matching GLSL snippet
import { mulberry } from '/core/lib.js';
const P = new Uint8Array(512); { const r = mulberry(1966); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const fade = t => t * t * (3 - 2 * t);
export function n2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
  const a = P[P[X] + Y] / 255, b = P[P[X + 1] + Y] / 255, c = P[P[X] + Y + 1] / 255, d = P[P[X + 1] + Y + 1] / 255;
  const u = fade(xf), v = fade(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function n3(x, y, z) { return (n2(x + z * 1.7, y - z * 0.6) + n2(y + 3.1 - z, x * 0.9 + z * 1.3)) * 0.5; }
export function fbm2(x, y, oct = 5) { let a = 0.5, s = 0, f = 1; for (let i = 0; i < oct; i++) { s += a * n2(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= 0.5; } return s; }
export const GLSL_NOISE = `
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=0.5, s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(3.1,1.7); a*=0.5; } return s; }`;
