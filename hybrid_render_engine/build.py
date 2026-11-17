import os, sys, shutil, subprocess, numpy as np

# Optional legacy modules
try:
    import hud, story, world, paint, render_eiffel, lights, toon, ink, cast, stickman_engine, lensblur, grade, post, short_qa
    _HAS_LEGACY = True
except ImportError:
    _HAS_LEGACY = False

class HybridPipeline:
    """
    Unified hybrid 2D/3D render pipeline.
    Supports G-buffer multi-pass compositing, direct rasterization,
    camera animation, and streaming directly into FFmpeg for iOS-playable MP4 output.
    """
    def __init__(self, width=720, height=1280, fps=30):
        self.width = width
        self.height = height
        self.fps = fps
        self.focal = width * 1.5

        if _HAS_LEGACY:
            self.camera = story.CameraController(fps=fps)
            self.scene = world.WorldScene(width, height)
            self.painter = paint.SurfacePainter()
            self.eiffel = render_eiffel.EiffelSetPiece(world_z=18.0)
            self.lighting = lights.LightingEngine()
            self.toon = toon.ToonShader(bands=3)
            self.ink = ink.InkOutliner()
            self.renderer = stickman_engine.StickmanRenderer()
            self.dof = lensblur.DepthOfField(focal_distance=4.2, aperture=0.14)
            self.grader = grade.ColorGrader()
            self.post = post.PostProcessor(grain_amount=0.012)
            self.qa = short_qa.ShortQAValidator()
            self.hud = hud.HUDCaptionRenderer()
        else:
            self.camera = None

        self.actors = []

    def create_canvas(self, bg_col=(0.53, 0.81, 0.92)):
        """Creates a blank RGB float32 canvas."""
        img = np.zeros((self.height, self.width, 3), dtype=np.float32)
        img[:] = bg_col
        return img

    def add_actor(self, actor):
        self.actors.append(actor)

    def open_ffmpeg_pipe(self, out_mp4="output.mp4", audio_inputs=None):
        """
        Launches FFmpeg in streaming pipe mode.
        Encodes uncompressed RGB24 stdin frames into H.264/AAC with iOS compatibility flags:
        -pix_fmt yuv420p, -profile:v high, -level 4.1, -movflags +faststart.
        """
        cmd = [
            "ffmpeg", "-y",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-s", f"{self.width}x{self.height}",
            "-pix_fmt", "rgb24",
            "-r", str(self.fps),
            "-i", "-"
        ]
        if audio_inputs:
            if isinstance(audio_inputs, str):
                audio_inputs = [audio_inputs]
            for a in audio_inputs:
                cmd.extend(["-i", a])
            if len(audio_inputs) == 1:
                cmd.extend(["-c:a", "aac", "-b:a", "192k"])
            else:
                filter_str = "".join([f"[{i+1}:a]" for i in range(len(audio_inputs))])
                filter_str += f"amix=inputs={len(audio_inputs)}:duration=longest[aout]"
                cmd.extend(["-filter_complex", filter_str, "-map", "0:v", "-map", "[aout]", "-c:a", "aac", "-b:a", "192k"])

        cmd.extend([
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-profile:v", "high",
            "-level", "4.1",
            "-movflags", "+faststart",
            out_mp4
        ])
        return subprocess.Popen(cmd, stdin=subprocess.PIPE)

    def write_frame_to_pipe(self, pipe, img_float32):
        """Converts float32 canvas [0.0, 1.0] to rgb24 bytes and writes to FFmpeg stdin."""
        frame_uint8 = (np.clip(img_float32, 0.0, 1.0) * 255).astype(np.uint8)
        pipe.stdin.write(frame_uint8.tobytes())

    def close_ffmpeg_pipe(self, pipe):
        """Closes FFmpeg stdin and waits for file finalize."""
        pipe.stdin.close()
        pipe.wait()

    def render_frame(self, frame_idx, total_frames=300):
        if not _HAS_LEGACY:
            return (self.create_canvas() * 255).astype(np.uint8)

        self.camera.update(frame_idx, total_frames)
        gb = self.scene.render_ground_plane(self.camera.position)
        self.painter.apply_perspective_grid(gb, self.camera.position)
        self.eiffel.render_into_gbuffer(gb, self.camera.position, focal=self.focal)
        img = self.lighting.shade_gbuffer(gb)
        img = self.toon.apply_cel_shading(img, gb)
        img = self.ink.apply_outlines(img, gb)
        for actor in self.actors:
            if frame_idx < 120:
                actor.set_action("walk", phase=frame_idx * 0.26, jump_height=0.0)
            elif frame_idx < 225:
                actor.set_action("walk", phase=frame_idx * 0.52, jump_height=0.0)
            elif frame_idx <= 244:
                p = (frame_idx - 225) / 19.0
                arc = 4.0 * p * (1.0 - p) * 1.35
                actor.set_action("jump", phase=p * 3.14, jump_height=arc)
            elif frame_idx <= 256:
                if frame_idx == 245:
                    self.camera.trigger_impact_shake(intensity=0.32)
                actor.set_action("land", phase=0.0, jump_height=0.0)
            else:
                actor.set_action("walk", phase=frame_idx * 0.26, jump_height=0.0)

            img = self.renderer.render_actor(img, gb, actor, self.camera.position, focal=self.focal)
            if 245 <= frame_idx <= 270:
                sw_prog = (frame_idx - 245) / 25.0
                img = self.renderer.render_shockwave(img, actor.world_pos, self.camera.position, sw_prog, focal=self.focal)

        img = self.dof.apply(img, gb)
        img = self.grader.apply(img)
        img = self.post.apply(img)
        img = self.hud.apply(img, frame_idx)
        return (np.clip(img, 0.0, 1.0) * 255).astype(np.uint8)

    def save_ppm(self, rgb_uint8, filename):
        h, w, _ = rgb_uint8.shape
        nl = chr(10)
        header = f"P6{nl}{w} {h}{nl}255{nl}".encode("ascii")
        with open(filename, "wb") as f:
            f.write(header)
            f.write(rgb_uint8.tobytes())

    def render_sequence(self, num_frames=300, out_dir="frames_10s"):
        os.makedirs(out_dir, exist_ok=True)
        for i in range(num_frames):
            frame = self.render_frame(i, num_frames)
            self.save_ppm(frame, os.path.join(out_dir, f"frame_{i:03d}.ppm"))
            if i % 60 == 0 or i == 245:
                if _HAS_LEGACY:
                    print("QA Audit:", self.qa.audit_frame(frame, i))

if __name__ == "__main__":
    pipe = HybridPipeline(width=720, height=1280, fps=15)
    print("HybridPipeline initialized successfully:", pipe.width, "x", pipe.height, "fps:", pipe.fps)
