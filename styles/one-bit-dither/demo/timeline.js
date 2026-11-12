// Film timeline (seconds). Everything that has to land on a beat reads its time from here; audio.py reads the
// same moments from window.EV (events.json).
export const DUR = 50.0;
export const BPM = 126, BEAT = 60 / BPM, SYNC = 2 * BEAT;          // signal line sync = every other beat (0.952 s)
export const T = {
  A0: 0.0,                 // frost grass / telescope
  B0: 4.0,                 // control room (match cut on the ring)
  C0: 10.7,                // four quick cuts, one per sync
  D0: 10.7 + 4 * SYNC,     // drum macro (14.51)
  E0: 22.3,                // the Moon
  F0: 29.3,                // clothesline, dawn
  G0: 33.5,                // verdict board
  H0: 39.8,                // newspaper → town
  END: 47.0,               // end card
};
export const CUTS = [0, 1, 2, 3].map(i => T.C0 + i * SYNC);
export const PRINT = { t0: T.D0 - 1.13, rows: 52, rowDur: BEAT / 4 };   // one printed line per sixteenth note
export const STAMP1 = 36.3, STAMP2 = 36.9;
export const RIM = 26.6;
// signal sync ticks heard in the room and through the cuts: every SYNC, landing on T.C0
export function syncTicks(a, b) { const out = []; const k0 = Math.ceil((a - T.C0) / SYNC); for (let k = k0; T.C0 + k * SYNC <= b; k++) out.push(T.C0 + k * SYNC); return out; }
