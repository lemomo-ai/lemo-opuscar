// Photographs of the Moon set, rendered at load and turned into paper: the Jodrell Bank print (the same picture
// drawn twice as tall, because the line ratio had to be guessed) and the official print (true proportions), each
// dithered by error diffusion at its own dot pitch; plus continuous-tone versions for the newspaper halftone.
import * as THREE from 'three';
import { Pipe } from './pipe.js';
import { atkinson, grayOf, bitsCanvas, canvasTex } from './kit.js';

export const JDOTS = [240, 360], ODOTS = [320, 240];
function readGray(renderer, rt, w, h) {
  const buf = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((h - 1 - y) * w + x) * 4, d = (y * w + x) * 4; const v = buf[s + 1]; id.data[d] = id.data[d + 1] = id.data[d + 2] = v; id.data[d + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
function stretch(src, k) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height * k; const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, c.width, c.height); return c; }
function dots(src, w, h, lift = 0) { const gr = grayOf(src, w, h); if (lift) for (let i = 0; i < gr.length; i++) gr[i] = Math.min(1, gr[i] * (1 + lift)); const c = bitsCanvas(atkinson(gr, w, h), w, h); return { canvas: c, tex: canvasTex(c) }; }

export function makePrints(renderer, moon) {
  const PW = 1024, PH = 768;
  const pp = new Pipe(renderer, PW, PH); const rt = pp.target();
  const shots = [];
  const cam = moon.photoCam, base = cam.quaternion.clone(), pos = cam.position.clone();
  // the photograph that matters (looking back at the big rock) and three neighbours of the same panorama
  for (const yaw of [0, 0.62, -0.62, 1.24]) {
    cam.position.copy(pos); cam.quaternion.copy(base); cam.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), yaw); cam.updateMatrixWorld();
    moon.shootPhoto(pp, rt); shots.push(readGray(renderer, rt, PW, PH));
  }
  cam.position.copy(pos); cam.quaternion.copy(base); cam.updateMatrixWorld();
  const gray = shots[0];
  // enlargement of the big rock: the same region of the picture, true and stretched
  const rb = moon.rBox(); const cw = (rb.x1 - rb.x0) * 1.75, ch = cw; const cx = (rb.x0 + rb.x1) / 2, cy0 = rb.y1 - 0.8 * ch;
  const crop = { x0: cx - cw / 2, y0: cy0, w: cw, h: ch, rb };
  const cropOf = (k) => { const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * 0.75 * k); const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(gray, crop.x0 * PW, crop.y0 * PH, crop.w * PW, crop.h * PH, 0, 0, c.width, c.height); return c; };
  const offCrop = cropOf(1), jodCrop = cropOf(2);
  const jGray = stretch(gray, 2);
  return {
    gray, jGray, jGrayTex: canvasTex(jGray), grayTex: canvasTex(gray),
    jod: dots(jGray, ...JDOTS, 0.18), off: dots(gray, ...ODOTS, 0.18),
    others: shots.slice(1).map(s => dots(stretch(s, 2), ...JDOTS, 0.18)),
    band: moon.band, crop, jodCrop: dots(jodCrop, 240, 360, 0.12), offCrop: dots(offCrop, 320, 240, 0.12),
  };
}
