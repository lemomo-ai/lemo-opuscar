// Angular figures: 2–3 flat fills plus one shade face, mitten hands, a profile with a nose and a brow line.
// Drawn in metres, feet at (0, 0), height ~1; facing +x when dir = 1. Roles read from the palette P.
import { poly } from './ruach.js';

// A robed figure in profile. o: { dir, robe, robeS, mantle, mantleS, skin, skinS, hair, beard }
export function robed(x, P, o = {}) {
  const d = o.dir ?? 1, X = v => v * d;
  // robe: a long trapezoid with an angular hem, shade face on the back
  poly(x, [[X(-.15), 0], [X(.17), 0], [X(.13), .62], [X(.1), .78], [X(-.12), .78], [X(-.17), .5]], P[o.robe || 'robe']);
  poly(x, [[X(-.15), 0], [X(-.02), 0], [X(-.05), .55], [X(-.12), .78], [X(-.17), .5]], P[o.robeS || 'robeS']);
  // feet
  poly(x, [[X(.04), 0], [X(.2), 0], [X(.18), .03], [X(.05), .035]], P[o.skinS || 'skinS']);
  // mantle over the shoulders, falling behind
  poly(x, [[X(-.2), .38], [X(-.13), .84], [X(.0), .9], [X(.12), .84], [X(.15), .66], [X(.02), .7], [X(-.08), .45]], P[o.mantle || 'mantle']);
  poly(x, [[X(-.2), .38], [X(-.13), .84], [X(-.04), .87], [X(-.08), .45]], P[o.mantleS || 'mantleS']);
  // head: angular profile with a nose, a beard, the hair falling to the back
  poly(x, [[X(-.035), .88], [X(.05), .87], [X(.075), .93], [X(.095), .955], [X(.075), .965], [X(.08), 1.0], [X(.05), 1.04], [X(-.02), 1.05], [X(-.06), 1.0], [X(-.06), .93]], P[o.skin || 'skin']);
  poly(x, [[X(-.07), .9], [X(-.06), 1.0], [X(-.02), 1.06], [X(.05), 1.05], [X(.03), 1.01], [X(-.01), .99], [X(-.02), .94], [X(-.05), .88]], P[o.hair || 'hair']);
  poly(x, [[X(.0), .86], [X(.075), .9], [X(.07), .935], [X(.03), .925], [X(-.01), .93]], P[o.beard || 'hair']);
  poly(x, [[X(.05), .99], [X(.085), .995], [X(.08), 1.0], [X(.05), .998]], P[o.skinS || 'skinS']);   // brow line
  // arm and mitten hand held forward
  poly(x, [[X(.02), .8], [X(.14), .66], [X(.2), .67], [X(.21), .7], [X(.15), .72], [X(.07), .82]], P[o.mantle || 'mantle']);
  poly(x, [[X(.2), .655], [X(.25), .67], [X(.25), .7], [X(.21), .71]], P[o.skin || 'skin']);
}

// A walker with a pack, carrying a sapling. pose: 'walkA' | 'walkB' | 'kneel'. Feet at (0, 0), facing +x.
export function walker(x, P, pose = 'walkA') {
  const k = pose === 'kneel', sapling = (sx, sy) => {
    poly(x, [[sx, sy], [sx + .012, sy], [sx + .01, sy + .2], [sx, sy + .2]], P.trunk);
    poly(x, [[sx - .06, sy + .16], [sx + .005, sy + .3], [sx + .07, sy + .17], [sx + .005, sy + .2]], P.leafL);
    poly(x, [[sx + .005, sy + .2], [sx + .07, sy + .17], [sx + .005, sy + .3]], P.leaf);
  };
  if (!k) {
    const s = pose === 'walkA' ? 1 : -1;
    poly(x, [[-.05, .46], [.05, .46], [.05 + s * .1, 0], [-.01 + s * .1, 0]], P.robe);        // front leg
    poly(x, [[-.05, .46], [.04, .46], [.0 - s * .1, 0], [-.06 - s * .1, 0]], P.robeS);       // back leg
    poly(x, [[-.1, .44], [.09, .44], [.08, .82], [-.07, .84]], P.mantle);                    // jacket
    poly(x, [[-.1, .44], [-.02, .44], [-.03, .83], [-.07, .84]], P.mantleS);
    poly(x, [[-.2, .5], [-.07, .5], [-.07, .86], [-.18, .84]], P.robeS);                     // pack
    poly(x, [[-.03, .84], [.07, .84], [.09, .94], [.06, 1.0], [-.03, 1.0], [-.05, .92]], P.skin);   // head
    poly(x, [[-.06, .92], [-.04, 1.02], [.07, 1.02], [.07, .97], [-.0, .96], [-.03, .9]], P.hair);
    poly(x, [[.04, .78], [.16, .6], [.2, .62], [.09, .8]], P.mantle);                         // arm
    sapling(.17, .58);
  } else {
    poly(x, [[-.08, .0], [.14, .0], [.16, .06], [-.02, .3], [-.1, .3]], P.robe);              // kneeling legs
    poly(x, [[-.1, .28], [.06, .3], [.12, .62], [-.03, .64]], P.mantle);                     // bent back
    poly(x, [[-.1, .28], [-.02, .29], [.04, .63], [-.03, .64]], P.mantleS);
    poly(x, [[-.16, .36], [-.04, .34], [.01, .66], [-.1, .66]], P.robeS);                    // pack
    poly(x, [[.07, .58], [.17, .56], [.2, .64], [.17, .7], [.08, .7], [.05, .64]], P.skin);    // head bowed
    poly(x, [[.04, .63], [.06, .72], [.17, .72], [.15, .67], [.09, .66], [.07, .6]], P.hair);
    poly(x, [[.08, .5], [.24, .12], [.28, .14], [.13, .52]], P.mantle);                       // arm down to the ground
    sapling(.27, 0);
  }
}
