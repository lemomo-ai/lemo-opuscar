// Camera: world → screen. cam = { x, y (world point at the frame centre), z (zoom), rot (degrees, dutch), shake (px) }
import { rng } from './fx.js';
export function applyCam(g, W, H, cam, t = 0) {
  const R = rng(Math.floor(t * 24) * 7 + 1), s = cam.shake || 0;
  g.translate(W / 2 + (R() - .5) * 2 * s, H / 2 + (R() - .5) * 2 * s);
  if (cam.rot) g.rotate(cam.rot * Math.PI / 180);
  g.scale(cam.z || 1, cam.z || 1);
  g.translate(-cam.x, -cam.y);
}
// world point → screen point (for screen-space effects that follow a subject)
export function toScreen(W, H, cam, p) {
  const z = cam.z || 1, a = (cam.rot || 0) * Math.PI / 180, dx = (p[0] - cam.x) * z, dy = (p[1] - cam.y) * z;
  return [W / 2 + dx * Math.cos(a) - dy * Math.sin(a), H / 2 + dx * Math.sin(a) + dy * Math.cos(a)];
}
