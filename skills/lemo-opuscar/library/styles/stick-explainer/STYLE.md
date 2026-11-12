# Stick-figure Explainer — Style Prompt

> Plain stick people on warm paper, one accent colour, and a logic you can watch: people stand on a "system line", react to each other, and hold hands. A held hand is not two arms touching but one continuous curve from one shoulder to the next, so a crowd can join into a line, a ring or a shape, and a red pulse can run through all of them.
> References (grammar only): explainer channels that argue with stick people and one accent colour (one idea per screen, generous white space, the script carries the logic); Eames-style "powers of ten" changes of scale; Swiss editorial type. Copy none of their characters, layouts, typefaces or music; never name them in the film.

## 1. Essence, and what it is not

- **The people are the diagram.** Each figure is a round head and single curved lines, all one weight (an "even hose" body). No faces, no hands, no props for heads. The figures act out the idea: who changed, who reacts, who is connected.
- **Bodies are continuous.** The head sits on the neck with no gap; limbs grow from one point on the torso; every limb is one smooth curve, never a polyline with a corner at the elbow or knee.
- **Hands join into one line.** Two held hands become one tangent-continuous curve between two shoulders. A row of people holding hands is a single line; a ring of people is a closed shape.
- **One accent, one meaning.** Ink figures on paper; the accent marks the one thing that matters on this screen (the source of a change, a path that connects, a number that crosses a limit).
- **Logic as motion.** Change travels: a pulse runs along the ground line or through joined arms, and each person reacts as it reaches them.

Not Whiteboard Explainer (no hand drawing the frame, no marker texture), not Pictogram Motion (figures are drawn lines, not filled ISO-style pictograms), not Data Storytelling (the people are the chart), not Mid-century Cartoon (no character design, no faces, no props).

## 2. Materials & rendering

- **Paper**: one flat warm off-white with a very fine matte grain (± 3 levels of value), drawn once and reused. No vignette, no fibres, no shadows.
- **Figures**: Canvas 2D strokes with round caps and joins. A skeleton (hip, curved spine, two-bone arms, IK legs, a head that rotates about the neck) drives quadratic curves: each limb runs from its root to its tip with the joint as control point (`k ≈ .8`: the curve bends towards the joint without passing through it). The head is a filled paper disc with an ink ring; an accented figure has a solid accent head.
- **Line weight**: one weight per figure (≈ 8 px for a figure 380 px tall). In a still scene, scale it with √(height/380), clamped 0.6–1.05; when the camera changes scale across orders of magnitude (fractal pull-backs, a whole globe), scale it in proportion to the figure so it reads the same on screen.
- **Joined hands**: both hands travel to a clasp point (between the two shoulders, 0.17 × height towards the feet when hanging, above the shoulders when lifted). Once clasped, the two control points are rotated onto one line through the clasp (tangent continuity), so the two arms draw as one hose. Each half keeps its owner's colour.
- **The accent run**: a stroke in the accent colour drawn along the joined arms' path up to a length that grows with time (round front, like liquid in a tube). Nodes on the ground line fill as it passes.
- **Rotation**: a figure can stand on a circle with its feet on the circle and its head outward. Joints are computed in the figure's own frame and mapped to the world, and "down" (where hands hang and elbows bend) follows the figure, so rings and globes use the same rig.
- **World and camera**: everything lives in world coordinates under one camera (centre and zoom, zoom interpolated in log space). Screen space is only for titles, the count column, sources and subtitles.

## 3. Colour logic

- Neutral ground: warm paper. Ink is for lines and type only, never large filled areas.
- **One accent** (a warm red-orange). It marks: the source of a change, the connected path, the person reached, the number that exceeds a threshold. Never decoration, never a second meaning in the same film.
- Supporting tones are greys from the paper: a muted grey for secondary type and sources, a light grey for ground lines, empty nodes and dropped objects, and at most one pale paper tone for a filled shape (a globe, a panel).
- No gradients, no transparency as a colour (fades are only for appearing and leaving).

Example (our demo): paper #F3F0EA, ink #24242C, mute #9C978C, tint #E2DDD2, accent #EB4A2A, globe fill #E9E4DA.

## 4. Type & subtitles

- **One geometric sans** for everything Latin (e.g. Jost, OFL): titles 600 at 84–92 px with tight tracking (−2), big numbers 600 at 44–150 px, small caps labels 500 at 20–22 px with +3 tracking. A CJK sans (e.g. Noto Sans SC, OFL, subset to the characters used) for Chinese, ≥ 34 px on screen.
- **Left-aligned**, flush to a 124 px margin; no header bars, no centred stacks. The one exception is type inside a closed shape (a ring, a globe), which centres in it.
- **Hierarchy**: one big statement or number, one line saying what it means, one small source line. A question can sit left and its answer right on the same baseline.
- **Arrival**: type slides up 12–22 px while fading in over ~0.4 s, staggered by line; it leaves by fading. Big numbers slide further.
- **Subtitles** belong to the page: bottom-left, a 4 px accent bar at the margin, one Chinese line (36 px, ink) over one English line (25 px, mute), no box. Keep every subject above y ≈ 920 so subtitles never cover it. Hold ≥ max(1.8 s, speech + 0.6 s); a verdict or comparison frame stays fully visible ≥ 2.5 s.

## 5. Motion quality

- 60 fps. Figures never jump: every pose change goes through damped springs (hip fast, upper arm medium, forearm slower, head loosest) so forearms arrive late and overshoot slightly. Integrate at a fixed step from a pre-roll so renders repeat exactly.
- **Anticipation first**: dip before a jump, pull the hand back before reaching. Keep crouches shallow (≤ 0.02 of height) or the legs bow into brackets.
- **Pop-in**: a figure grows out of the ground with a spring step (≈ 20 % overshoot), its line weight growing with it.
- **Clasp**: on contact the clasp point rebounds once and both bodies are tugged towards each other, then settle.
- **Lift**: joined hands rise as a wave along the chain, each clasp ≈ 0.06 s after the last; use a stiff spring (ω ≥ 19) so arms pass the shoulder line quickly.
- Crowds use analytic breathing and sway (a phase per person) instead of springs; a crowd should never move in unison except on a cue.
- What never moves: the paper, the margins, the subtitles.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Locked frame | rules being set up; reading time | a question; a demonstration; a verdict |
| Pull back | one case becomes many | one chain → many chains; one person → a crowd |
| Push in + focus shift | singling one out | "now take just you"; the exception |
| Fractal pull back | growth by a constant factor | rings ×2.5, generations, compounding |
| Through a shape | a jump to another place or time | diving into a head, a node, a ring |
| Match transform | the same thing seen anew | a line bending into an arc, a row into a ring |
| Slow drift / push | holding attention on data | a count, a comparison |

Keep the subject in the upper 85 % of the frame; text columns sit beside the figures, never on them. Cut on a beat or move through something; no page turns, no wipes, no zoom-blur.

## 7. Sound palette

- Small, light, pitched sounds that follow the hands: kalimba or celesta for each handshake (a rising series when counting), glockenspiel for a pulse passing nodes, marimba for tallies, harp sweeps for growth, pizzicato bass for walking pulse, vibraphone and soft strings for a verdict or a closing chord.
- Foley: a soft rounded tap for a clasp (two palms, not plastic), a rising blip for a pop-in, a breath of air for a reach, a filtered noise sweep left → right for a pulse, a low soft hit for a hard cut through a shape.
- Voice: a warm, curious narrator, slow (≈ 2.1–2.8 words/s, ≥ 0.6 s between lines). Compress the voice, sit it ≈ 10 dB (RMS) above the music; the music gives way 300 Hz–4 kHz and ducks under each line. −14 LUFS, true peak ≤ −1 dB.
- Silence works: a held frame with only room tone before a verdict.

## 8. Native moves

- **Join the hands.** Two people reach, clasp, and become one curve. *Fits content like:* a friendship; a trade; a handshake deal; a contract.
- **The chain.** People pop up between two ends and clasp one by one, faster and faster, until the line is closed; then the accent runs end to end. *Fits content like:* supply chains; a relay of messages; a family tree line; steps of a proof.
- **The ripple.** One figure changes (dips, jumps, turns accent); a pulse runs along the ground line and each person reacts as it reaches them; finally all turn to the source. *Fits content like:* a rumour; a bank run; a traffic jam; a market panic.
- **Let go.** The reverse of a clasp: a hand drops, the arm swings back, what was carried falls and greys. *Fits content like:* a broken link; a lost message; a failed handover.
- **Rings.** People stand on a circle, feet in, heads out, and close it hand in hand; rings nest, each a constant factor larger, under a fractal pull-back. *Fits content like:* compounding; generations; viral spread; orders of magnitude.
- **The bar chart of people.** Chains whose lengths are the data; a fractional value is a last link drawn shorter. *Fits content like:* degrees of separation; queue lengths; steps in a process; ranking.
- **The whole shape.** A line bends onto an arc and grows around a globe or a closed form until the last two hands meet. *Fits content like:* "everyone"; a closed loop economy; a cycle; a finale.

Our demo opens on *the chain* between two ends of a line, uses *rings* under a fractal pull-back and a dive through a shape as its turns and ends on *the whole shape* closing around a globe. A new film opens and ends another way: a row of people already holding hands where one *lets go*, *the ripple* from one figure along the ground line, an ending where everyone turns to face one person, or a single figure walking off the end of the line while the line stays.

## 9. Pitfalls of the medium

- **Polyline limbs.** Straight segments with a rounded corner still read as broken sticks. Use one curve per limb, joint as control point.
- **Detached heads.** A head spring that translates the head lets it float off the neck. Let the lag only rotate the head about the neck.
- **Two arms touching.** Clasped hands drawn as two separate curves meeting at an angle look like a kink. Align the control points through the clasp.
- **Straight bars.** When joined hands pass the shoulder line, the arms go straight for a moment; keep that pass fast and rare.
- **Hands through bodies.** Spring overshoot makes curved arms wrap through the torso in poses that touch the body (hands on hips, folded arms). Avoid those poses or lock the hand.
- **Thin crowds.** Line weight on √ scale vanishes when the camera pulls far back. Switch to proportional weight for zooms.
- **Second accent.** A second highlight colour destroys the one-meaning rule. Use grey or size instead.
- **Slideware.** Header bars, centred stacked text and page flips turn it into a deck. Keep the margin, move the camera.
- **Too much per screen.** One idea per screen; a crowd is a texture, not a list of individuals.

## 10. Engine

- `demo/index.html`: paper, the skeleton (`joints`), the figure drawer (`figure`, `FIGS` A/B/C weights), springs (`simulate`, `rowTarget`), the ground line with a pulse (`wire`), the hook chain (`S1`, `s1Target`, `linkGeo`), and three style frames (`?scene=f1|f2|f3`).
- `demo/full.js`: the general engine: rotatable people (`wJ`), general handshakes with reach, clasp, lift, release and accent runs (`linkGeoW`, `drawGroup`), envelopes carried along joined arms, the world camera with log zoom and anchored dives, rings and the globe, HUD type (`hud`), subtitles (`drawSubs`), sound events.
- Minimal example of something not in the demo: put 12 people on a circle (`rot = θ`, feet on radius R), add links i → i+1 with `sag: T => .17`, and stagger their clasp times around the circle; call `drawGroup` each frame. That is a round dance; give one link a `rel` time and it breaks.

## 11. Variation space

The agent decides the structure, who the figures are in the story, what the accent means, which native moves to spend where, the camera path and the pacing. Keep the paper, the one accent, the even-hose body and the joined-hands rule.

- **Three structures**: a single ripple told three times faster each time; a before/after where a chain breaks and is repaired; a countdown where rings shrink to one person.
- **Three openings**: an empty ground line that figures walk onto from both ends; a full crowd in rings, then the camera finds one; a row of people already holding hands, one lets go.
- **Three endings**: everyone turns to face one person; the crowd sits down one by one until one figure is left standing; a single figure walks off the end of the line and the line stays.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
