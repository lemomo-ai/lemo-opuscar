"""Peak of the square-wave partial sum f_N(t) = 4/pi * sum_{k=1..N} sin((2k-1)wt)/(2k-1) next to the jump.
The first maximum is at wt = pi/(2N); prints peak, overshoot and overshoot as % of the jump (2)."""
import numpy as np
from scipy.integrate import quad
def f(x, N): k = np.arange(1, N + 1); n = 2 * k - 1; return 4 / np.pi * np.sum(np.sin(np.outer(x, n)) / n, axis=1)
lim = 2 / np.pi * quad(lambda x: np.sin(x) / x, 0, np.pi)[0]
print(f'limit (2/pi)Si(pi) = {lim:.5f}  overshoot {lim-1:.5f} = {(lim-1)/2*100:.3f}% of the jump')
for N in [1, 2, 3, 4, 8, 16, 64, 256]:
    x = np.linspace(1e-6, np.pi / 2, 200001) if N < 4 else np.linspace(1e-6, 3 * np.pi / (2 * N), 200001)
    y = f(x, N); i = y.argmax()
    print(f'N={N:4d}  peak {y[i]:.5f} at wt={np.degrees(x[i]):.3f} deg  overshoot {(y[i]-1)/2*100:.3f}%')
