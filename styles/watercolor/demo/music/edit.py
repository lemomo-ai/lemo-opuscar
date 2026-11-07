# score jump cut: at beats[85] (61.23 s) jump to beats[437] (265.61 s), cutting the 204.4 s between, 0.18 s equal-power crossfade → score.wav (≈117.8 s)
# wf48.wav = Wildflowers.mp3 decoded to 48 kHz stereo (see prep.sh)
import numpy as np, json, soundfile as sf, os
os.chdir(os.path.dirname(os.path.abspath(__file__))); OUT = os.environ.get('OUT', '.')
x, sr = sf.read('wf48.wav'); print(sr, x.shape)
beats=np.array(json.load(open('wf_beats.json'))['beats'])
a=beats[85]; b=beats[437]; print('a',a,'b',b,'lag',b-a)
A=int(a*sr); Bi=int(b*sr); xf=int(0.18*sr); pre=int(0.06*sr)
# equal-power crossfade centred slightly before the beat
s1=A-pre; s2=Bi-pre
t=np.linspace(0,1,xf)[:,None]
y=np.concatenate([x[:s1], x[s1:s1+xf]*np.cos(t*np.pi/2)+x[s2:s2+xf]*np.sin(t*np.pi/2), x[s2+xf:]])
sf.write(os.path.join(OUT, 'score.wav'), y, sr); print('len', len(y)/sr)
json.dump({'cut':a,'lag':b-a,'beats':[float(v) for v in beats if v<a]+[float(v-(b-a)) for v in beats if v>=b]}, open(os.path.join(OUT, 'score_beats.json'),'w'))
try:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
except ImportError:
    print('matplotlib is not in .venv; skipping score_curve.png'); raise SystemExit

m=y.mean(1); hop=sr//10; n=len(m)//hop; fr=m[:n*hop].reshape(n,hop)
db=10*np.log10((fr**2).mean(1)+1e-10)
F=np.abs(np.fft.rfft(fr,axis=1)); f=np.fft.rfftfreq(hop,1/sr); hi=F[:,f>2000].sum(1)/(F.sum(1)+1e-9)
tt=np.arange(n)/10
fig,ax=plt.subplots(figsize=(18,4)); ax.plot(tt,db,'k',lw=.6); ax.plot(tt,np.convolve(db,np.ones(20)/20,'same'),'b',lw=1.5)
ax2=ax.twinx(); ax2.plot(tt,np.convolve(hi,np.ones(20)/20,'same'),'r'); ax.set_xticks(range(0,120,2)); ax.grid(alpha=.3); ax.set_ylim(-60,-5)
for v in [a]: ax.axvline(v,color='g')
plt.tight_layout(); plt.savefig(os.path.join(OUT, 'score_curve.png'),dpi=60)
