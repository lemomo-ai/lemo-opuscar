# FACTS · 吉布斯现象 The Gibbs Phenomenon

Every mathematical statement on screen and in the voice, and where it comes from. All numbers on screen are computed by
`film.py` from the same values that draw the picture.

## 1. The square wave's Fourier series

On screen: f(t) = 4/π Σ_{k=1}^{N} sin((2k−1)ωt)/(2k−1); circles of radius aₙ = 4/(nπ) for odd n (1.273, 0.424, 0.255, 0.182, …);
voice: "three times as fast, a third the size", "odd ones only".

- A. V. Oppenheim, A. S. Willsky, *Signals and Systems*, 2nd ed., Prentice Hall 1997, §3.3 (Fourier series of a square wave).
- Wikipedia, "Square wave", section *Fourier analysis*: https://en.wikipedia.org/wiki/Square_wave
- The ideal square wave of the opening has the same frequency (1 Hz) and amplitude (±1 V) as the series.

## 2. The overshoot (Gibbs phenomenon)

On screen: Δ = 0.179 V above 1.000 V, peak 1.179 V; "8.95 % of the 2 V jump"; "overshoot → 8.95 % for every N, even ∞";
voice: "It never gets shorter. About 9%, every time."

- Next to the jump, the partial sums' first maximum tends to (2/π)·Si(π) ≈ 1.17898 for a square wave of amplitude 1, an
  overshoot of 0.17898, i.e. 8.949 % of the jump (2), for every N; the maximum moves towards the jump (at ωt = π/2N) and
  narrows, but its height does not go to zero.
- Wikipedia, "Gibbs phenomenon": https://en.wikipedia.org/wiki/Gibbs_phenomenon
- E. Hewitt, R. E. Hewitt, "The Gibbs–Wilbraham phenomenon: an episode in Fourier analysis", *Archive for History of
  Exact Sciences* 21 (1979), 129–160.
- Computed in the film (`peak(N)` in film.py; `tools/gibbs.py` prints the table): N = 25 → 1.17913 (8.96 %);
  N = 100 → 1.17900 (8.95 %); N = 400 → 1.17898 (8.95 %). Shown at three decimals (0.179 V, 1.179 V), which stay the same
  from N = 25 on; the share of the jump appears once N = 400 (8.95 %).

## 3. What is drawn and what is said

- At the end the sum's upper limit is written ∞; the curve drawn is the 400-term partial sum (at that zoom it is
  indistinguishable from the limit), and the readout says N = ∞.
- Scales: 0.50 V/div and 250 ms/div at zoom 1 follow from 200 world units per volt, 400 per second and 100-unit divisions;
  the TIME/DIV and V/DIV readouts follow the camera's zoom.
