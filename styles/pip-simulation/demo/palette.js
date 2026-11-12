// Blob Simulation · the fixed palette. Every colour in the film comes from here: picture, HUD, type and graphics printed on the board.
// STYLE.md §3 lists the same values; change a colour here and nowhere else.
export const PALETTE = {
  // ① team colours (5): "which side" in games and epidemics; in evolution they are also the 5 stops of the speed ramp (slow → fast)
  team: {
    cobalt: '#4A6FE3',   // cobalt · team 1 / slowest
    violet: '#8B67D6',   // violet · team 2
    rose:   '#E0607E',   // rose · team 3
    tomato: '#F2604A',   // tomato · team 4
    butter: '#F6BE45',   // butter · team 5 / fastest
  },
  // ② accent / resource: food, reward, the one thing to watch (highlight rings, the key number). Never a team colour
  mint: '#4FBF8F',
  // ③ ink: faces, type, axes, marks printed on the board
  ink: '#262A3B',
  // ④ ground (the lab board): warm white matte paper + two grid weights + the board edge line
  board: '#ECE6DA',
  gridMinor: '#E0D7C7',
  gridMajor: '#D3C6B1',
  boardEdge: '#C4BFB6',
  // ⑤ background: the far haze and the floor under the board (two steps: crowd shots one step darker, open and data shots one lighter)
  haze: '#E9E2D5',
  hazeOpen: '#EFE8DC',
  floor: '#E2D9C9',
  studio: '#E3DDD1',     // material close-ups only
  // derived colours (follow from the rules above, never picked on their own)
  fluff: '#FFF7EA',      // the cream fluff kicked up by running Pips
  cheek: '#FF9A8F',      // cheeks: body colour mixed 30% towards this
  barPaper: '#F4EEE3',   // printed bar grounds: team colour mixed 78% towards this
  glint: '#FFFFFF',      // eye glints
  spent: '#B9B2A6',      // out of energy: the body fades to this warm grey
  // light colours (not picture colours; kept here to keep warm and cool consistent)
  light: { sun: '#FFF4E6', rim: '#F3F6FF', sky: '#EEF2FF', bounce: '#D9CCB8' },
};
// speed ramp: gene value → the 5 stops (OKLab interpolation, lightness rising all the way)
export const RAMP_STOPS = [[.7, PALETTE.team.cobalt], [1.0, PALETTE.team.violet], [1.25, PALETTE.team.rose], [1.5, PALETTE.team.tomato], [1.85, PALETTE.team.butter]];
export const TEAMS = ['cobalt', 'violet', 'rose', 'tomato', 'butter'].map(k => PALETTE.team[k]);
