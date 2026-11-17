import wave, numpy as np

class ProceduralFoley:
    def __init__(self, sample_rate=44100, fps=30):
        self.sr = sample_rate
        self.fps = fps

    def generate_track(self, total_frames=300, out_wav="foley_10s.wav"):
        total_samples = int((total_frames / self.fps) * self.sr)
        audio = (np.random.randn(total_samples).astype(np.float32) * 0.014)

        def add_impact(frame_idx, freq_start=110.0, freq_end=28.0, duration=0.22, gain=0.65):
            start = int((frame_idx / self.fps) * self.sr)
            length = min(int(duration * self.sr), total_samples - start)
            if length <= 0:
                return
            lt = np.arange(length, dtype=np.float32) / self.sr
            env = np.exp(-lt * (6.5 / duration))
            freqs = np.linspace(freq_start, freq_end, length)
            phase = 2.0 * np.pi * np.cumsum(freqs) / self.sr
            audio[start:start+length] += np.sin(phase) * env * gain

        def add_whoosh(frame_idx, duration=0.55, gain=0.45):
            start = int((frame_idx / self.fps) * self.sr)
            length = min(int(duration * self.sr), total_samples - start)
            if length <= 0:
                return
            lt = np.arange(length, dtype=np.float32) / self.sr
            env = np.sin(np.pi * (lt / duration)) ** 2
            noise = np.random.randn(length).astype(np.float32)
            kernel = np.ones(18, dtype=np.float32) / 18.0
            filtered = np.convolve(noise, kernel, mode="same")
            audio[start:start+length] += filtered * env * gain

        # Walk footsteps (frames 0-119)
        for f in range(6, 118, 12):
            add_impact(f, freq_start=145.0, freq_end=55.0, duration=0.07, gain=0.22)
        # Sprint footsteps (frames 120-224)
        for f in range(122, 223, 7):
            add_impact(f, freq_start=175.0, freq_end=60.0, duration=0.06, gain=0.32)
        # Jump launch whoosh at frame 225
        add_whoosh(225, duration=0.55, gain=0.48)
        # Heavy ground impact thud at frame 245
        add_impact(245, freq_start=135.0, freq_end=22.0, duration=0.42, gain=0.90)
        # Recovery steps (frames 260-295)
        for f in range(262, 296, 12):
            add_impact(f, freq_start=145.0, freq_end=55.0, duration=0.07, gain=0.22)

        pcm = (np.clip(audio, -0.95, 0.95) * 32767).astype(np.int16)
        with wave.open(out_wav, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self.sr)
            wf.writeframes(pcm.tobytes())
        return out_wav

if __name__ == "__main__":
    ProceduralFoley().generate_track(300, "foley_10s.wav")
    print("Generated synced 10s foley_10s.wav!")
