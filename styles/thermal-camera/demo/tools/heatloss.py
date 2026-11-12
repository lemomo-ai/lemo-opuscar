# Envelope heat-loss estimate for the film's building, before and after the retrofit (numbers on screen: kW and the change).
# Steady state, transmission + air change, at the survey night's conditions (indoor 20 °C, outdoor -6 °C).
# Run: python3 styles/thermal-camera/demo/tools/heatloss.py
L, D, H_EAVE, H_HEATED = 39.6, 10.8, 17.25, 16.8      # m: length, depth, wall height to the roof slab, heated height
d_T = 20 - (-6)
walls_gross = 2 * L * H_EAVE + 2 * D * H_EAVE
win_front = 3 * 6 * (2 * 1.5 * 1.5 + 2 * 1.5 * 2.4)   # per unit and floor: two room windows + two balcony doors/windows behind the enclosed balconies
win_back = 150.0                                      # kitchens, bathrooms, bedrooms on the back (assumed)
windows = win_front + win_back
walls = walls_gross - windows
roof = L * D
floor_ = L * D
vol_air = 0.65 * L * D * H_HEATED                    # net air volume

# U-values, W/(m2 K)
R_brick = 0.11 + 0.02 / 0.81 + 0.24 / 0.81 + 0.04     # GB 50176-2016 table B.1 (clay brick 0.81) and B.4 (Ri 0.11, Re 0.04)
U_wall_b = 1 / R_brick + 0.15                         # + ring beams / columns as a thermal-bridge allowance
U_wall_a = 1 / (R_brick + 0.08 / (0.039 * 1.2) + 0.006) + 0.04   # 80 mm EPS (0.039, x1.2 correction)
U_win_b, U_win_a = 5.5, 2.7                           # single-glazed steel / timber mix; new double-glazed PVC (<= 3.2 required in the cold zone)
U_roof_b, U_roof_a = 1.5, 0.40
U_floor, f_floor = 0.8, 0.5                           # floor over the unheated basement, temperature factor
n_b, n_a = 0.8, 0.5                                   # air changes per hour (0.5 is the design value used for new buildings)

def H(Uw, Uwin, Ur, n):
    return {'walls': walls * Uw, 'windows': windows * Uwin, 'roof': roof * Ur, 'floor': floor_ * U_floor * f_floor, 'air': 0.34 * n * vol_air}

hb, ha = H(U_wall_b, U_win_b, U_roof_b, n_b), H(U_wall_a, U_win_a, U_roof_a, n_a)
Hb, Ha = sum(hb.values()), sum(ha.values())
print(f'areas m2: walls {walls:.0f}  windows {windows:.0f}  roof {roof:.0f}  air volume {vol_air:.0f} m3')
print(f'U wall before {U_wall_b:.2f}  after {U_wall_a:.2f}')
for k in hb: print(f'  {k:8s} before {hb[k]:7.0f} W/K   after {ha[k]:7.0f} W/K')
print(f'H before {Hb:.0f} W/K -> {Hb * d_T / 1000:.0f} kW ; after {Ha:.0f} W/K -> {Ha * d_T / 1000:.0f} kW ; change {100 * (Ha / Hb - 1):.0f} %')
