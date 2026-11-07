// Character model sheet: index.html?sheet=1 (the whole sheet is also printed with the three riso plates)
import { g, S, clear, rect, rrect, line, text, circle, over, inkA } from './draw.js';
import { PAL, head, standFront, figureSide, poseStandSide, riderBike, pigeon, baguette, poseSit, L } from './rider.js';

const BL = [1, 0, 0], YE = [0, 1, 0], PK = [0, 0, 1];
function label(s, x, y, c = BL, size = 22) { text(s, x, y, `600 ${size}px Jost`, c, 'center', 'alphabetic', 3); }

export function modelSheet(t, Q) {
  clear();
  // title
  text('THE RIDER', 48, 84, '800 64px Bricolage', BL, 'left', 'alphabetic', 1);
  text('MODEL SHEET', 420, 82, '600 26px Jost', PK, 'left', 'alphabetic', 4);
  text('“Sunday Ride” · Risograph Print · three spot inks: Blue / Yellow / Fluorescent Pink', 48, 122, '400 24px Jost', BL);
  // plate marks (print crop/registration crosses)
  const cross = (x, y) => { line([[x - 16, y], [x + 16, y]], 2, BL); line([[x, y - 16], [x, y + 16]], 2, BL); g.beginPath(); g.arc(x, y, 7, 0, 7); g.lineWidth = 2; g.strokeStyle = inkA(BL); g.stroke(); };
  cross(1880, 40); cross(40, 1040); cross(1880, 1040);

  // ── turnaround (standing) ──
  const gy = 640, sc = .86, X0 = 130, DX = 215;
  over(() => { for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(X0 + i * DX, gy + 2, 70, 9, 0, 0, 7); g.fillStyle = inkA([.25, 0, 0]); g.fill(); } });
  standFront(X0, gy, sc, 'front');
  standFront(X0 + DX, gy, sc, 'q');
  g.save(); g.translate(X0 + DX * 2, gy); g.scale(sc, sc); figureSide(poseStandSide(), { ph: .3, scarfAmt: .15 }); g.restore();
  standFront(X0 + DX * 3, gy, sc, 'back');
  ['FRONT', '3/4', 'SIDE', 'BACK'].forEach((s, i) => label(s, X0 + i * DX, gy + 42));
  // height ruler (8 heads tall)
  const hu = 484 * sc / 8;
  for (let k = 0; k <= 8; k++) { const yy = gy - k * hu; line([[905, yy], [k % 2 ? 915 : 923, yy]], 2, BL); }
  line([[905, gy], [905, gy - 484 * sc]], 2, BL);
  text('8 heads · lanky', 930, gy - 200, '500 17px Jost', BL);

  // ── expressions ──
  const ex = [['CALM', 'calm', 'side'], ['SLEEPY', 'sleepy', 'side'], ['SURPRISED', 'surprise', 'side'], ['DELIGHTED', 'joy', 'q']];
  text('EXPRESSIONS', 1090, 186, '700 22px Jost', PK, 'left', 'alphabetic', 4);
  ex.forEach(([n, e, vw], i) => {
    const x = 1170 + i * 190, y = 300;
    over(() => { g.beginPath(); g.arc(x, y + 4, 76, 0, 7); g.fillStyle = inkA([0, .2, 0]); g.fill(); });
    head(x - 4, y, 2, vw, e);
    label(n, x, y + 112, BL, 17);
  });

  // ── pigeon ──
  text('THE PIGEON  (co-star · ~1.2× his head)', 1090, 462, '700 22px Jost', PK, 'left', 'alphabetic', 4);
  const py = 590;
  pigeon(1150, py, 1.05, { pose: 'stand', tilt: -.25 }); label('HEAD TILT', 1150, py + 50, BL, 15);
  pigeon(1300, py, 1.05, { pose: 'walk', step: .25 }); label('TINY STEPS', 1300, py + 50, BL, 15);
  pigeon(1440, py, 1.05, { pose: 'peck' }); label('PECK', 1440, py + 50, BL, 15);
  for (let f = 0; f < 4; f++) pigeon(1560 + f * 95, py - 20, .78, { pose: 'fly', frame: f });
  label('FLAP CYCLE · 4 frames on twos', 1705, py + 50, BL, 15);

  // ── plate by plate: his colours are added one plate at a time as the locations change ──
  text('PLATES = STORY', 1560, 700, '700 20px Jost', PK, 'left', 'alphabetic', 4);
  const prog = [['BLUE', [1, 0, 0]], ['+ YELLOW', [1, 1, 0]], ['+ PINK', [1, 1, 1]]];
  prog.forEach(([n, m], i) => {
    const x = 1610 + i * 120, y = 850;
    S.mask = m;
    riderBike(x, y, .25, { crank: 1.2 + i * .8, lean: .2, ph: .6 + i, scarfAmt: .7, expr: 'calm', inBasket: i ? () => baguette(200, -318, 190, -1.2) : null });
    S.mask = [1, 1, 1];
    label(n, x, y + 26, BL, 14);
  });

  // ── key poses ──
  text('KEY POSES', 48, 738, '700 22px Jost', PK, 'left', 'alphabetic', 4);
  // 1 riding
  riderBike(250, 1000, .56, { crank: .6, lean: .22, ph: 1.3, scarfAmt: .75, expr: 'calm', inBasket: () => baguette(196, -320, 200, -1.15) });
  label('PEDAL  (poses on twos)', 240, 1044, BL, 17);
  // 2 catching the baguette (no slowing down, reaches back, holds the baguette up like a relay baton)
  riderBike(720, 1000, .56, {
    crank: 2.1, lean: .08, ph: 2.1, scarfAmt: .8, expr: 'surprise', headFlip: true, headDX: -10,
    armN: [-150, -470], armBend: -1,
    hand: w => { baguette(w[0] + 4, w[1] - 30, 200, -1.25); circle(w[0], w[1], 11, PAL.skin); },
  });
  label('THE CATCH  (bakery hand-off)', 720, 1044, BL, 17);
  // 3 sharing bread by the river
  g.save(); g.translate(1110, 948); g.scale(.62, .62);
  rect(-170, 0, 640, 90, [.12, .45, .22]); rect(-170, 0, 640, 12, [.3, .6, .35]);
  const J = poseSit({ handN: [196, -76] });
  figureSide(J, {
    ph: 0, scarfAmt: .25, expr: 'joy',
    hand: w => { baguette(w[0] + 26, w[1] - 2, 64, .05, { half: true, r: 12 }); circle(w[0], w[1], 10.5, PAL.skin); },
  });
  pigeon(345, -46, 1.35, { pose: 'stand', flip: true, tilt: .3 });
  g.restore();
  label('SHARING  (river wall)', 1190, 1044, BL, 17);

  // ── colour swatches (three plates + overprints) ──
  const sw = [[[1, 0, 0]], [[0, 1, 0]], [[0, 0, 1]], [[1, 1, 0]], [[1, 0, 1]], [[0, 1, 1]], [[.4, 0, 1]], [[.75, 1, 0]]];
  text('INKS & OVERPRINTS', 1560, 925, '600 15px Jost', BL, 'left', 'alphabetic', 2);
  sw.forEach(([c], i) => rect(1560 + i * 42, 940, 34, 34, c));
  text('B   Y   P   B+Y  B+P  Y+P  40B+P  75B+Y', 1562, 998, '500 12px Jost', BL, 'left', 'alphabetic', 1);

  return {
    seed: Math.floor(t * 12),
    off: [[0, 0], [3.5, -2], [-3, 2.5]],
    rot: [0, .0006, -.0005],
    period: 7,
  };
}
