import librosa, numpy as np, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)  # reads Wildflowers.wav in this directory (made by prep.sh)
OUT = os.environ.get('OUT', '.')  # when verifying use OUT=../out to avoid overwriting wf_beats.json
y, sr = librosa.load(os.path.join(HERE, 'Wildflowers.wav'), sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
print('tempo', tempo, 'nbeats', len(beats), beats[:8])
hop=512
chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
mfcc = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=13)
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
bf = librosa.time_to_frames(beats, sr=sr, hop_length=hop)
C = librosa.util.sync(chroma, bf, aggregate=np.median)
M = librosa.util.sync(mfcc, bf)
R = librosa.util.sync(rms[None], bf)[0]
O = librosa.util.sync(onset[None], bf)[0]
F = np.vstack([C/ (np.linalg.norm(C,axis=0)+1e-9), 0.3*M/ (np.linalg.norm(M,axis=0)+1e-9)])
S = F.T @ F
json.dump({'beats':beats.tolist(),'rms':R.tolist(),'onset':O.tolist()}, open(os.path.join(OUT, 'wf_beats.json'),'w'))
try:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
except ImportError:
    print('matplotlib is not in .venv; skipping wf_ssm.png'); raise SystemExit

fig,ax=plt.subplots(2,1,figsize=(14,20),gridspec_kw={'height_ratios':[4,1]})
bt=np.r_[0,beats]
ax[0].imshow(S, origin='lower', cmap='magma', extent=[0,bt[-1],0,bt[-1]], aspect='auto', vmin=0.5)
ax[0].set_xticks(range(0,330,10)); ax[0].set_yticks(range(0,330,10)); ax[0].grid(alpha=.25)
ax[1].plot(bt[:len(R)], 20*np.log10(R+1e-6),'k'); ax[1].plot(bt[:len(O)], O*3-60,'r',lw=.6); ax[1].set_xticks(range(0,330,10)); ax[1].grid(alpha=.3)
plt.tight_layout(); plt.savefig(os.path.join(OUT, 'wf_ssm.png'), dpi=55)
