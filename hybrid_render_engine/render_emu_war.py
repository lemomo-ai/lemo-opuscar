#!/usr/bin/env python3
"""
render_emu_war.py
Episode render script for The Great Emu War (1932).
Ties build.py (HybridPipeline), toon_cast.py (Toon characters), and whoa_stage.py (Outback 3D props & Lewis gun)
together with FFmpeg streaming to output an iOS-playable H.264/AAC .mp4.
"""

import os
import sys
import time
import argparse
import numpy as np

import build
import whoa_stage
import toon_cast

def find_audio_assets():
    """Locates emu_voice.mp3 and foley_emu_war.wav in common locations."""
    candidates = [
        ("audio/emu_voice.mp3", "audio/foley_emu_war.wav"),
        ("/workspace/2d-creation/audio/emu_voice.mp3", "/workspace/2d-creation/audio/foley_emu_war.wav"),
        ("/root/hybrid_render_engine/emu_voice.mp3", "/root/hybrid_render_engine/foley_emu_war.wav"),
    ]
    for v_path, f_path in candidates:
        if os.path.exists(v_path) and os.path.exists(f_path):
            return os.path.abspath(v_path), os.path.abspath(f_path)
    return None, None

def render_episode(out_mp4="emu_war_episode.mp4", width=720, height=1280, fps=30, duration=35.5, show_progress=True):
    total_frames = int(duration * fps)
    print(f"==================================================")
    print(f"🎬 Rendering 'The Great Emu War' Episode")
    print(f"   Resolution : {width}x{height}")
    print(f"   Frame Rate : {fps} fps")
    print(f"   Duration   : {duration:.2f} s ({total_frames} frames)")
    print(f"   Output File: {out_mp4}")
    print(f"==================================================")

    # Initialize Pipeline
    pipeline = build.HybridPipeline(width=width, height=height, fps=fps)
    focal = pipeline.focal

    # Locate and prepare audio
    voice_path, foley_path = find_audio_assets()
    audio_inputs = []
    if voice_path and foley_path:
        print(f"🔊 Audio Track 1 (Voice): {voice_path}")
        print(f"🔊 Audio Track 2 (Foley): {foley_path}")
        audio_inputs = [voice_path, foley_path]
    else:
        print("⚠️ Warning: Audio files not found, rendering video-only.")

    # Open FFmpeg pipe directly
    pipe = pipeline.open_ffmpeg_pipe(out_mp4=out_mp4, audio_inputs=audio_inputs)

    # Camera and scene state
    cam_pos = np.array([0.0, 0.40, 0.0], dtype=np.float32)
    shake_intensity = 0.0

    t_start = time.time()
    last_print = t_start

    for frame_idx in range(total_frames):
        t_sec = frame_idx / float(fps)
        phase = frame_idx * 0.28

        # Camera choreography
        # Smooth dolly forward over the duration
        cam_pos[2] = 0.0 + (t_sec / duration) * 0.45
        cam_pos[0] = 0.08 * np.sin(t_sec * 0.4)

        # Gun firing state & camera shake
        # Firing in bursts during Act 3 (16.0s to 26.5s)
        is_firing = False
        if 16.0 <= t_sec <= 26.5:
            # Burst pattern: fire for 1.2s, pause 0.3s
            burst_cycle = (t_sec - 16.0) % 1.5
            if burst_cycle < 1.15:
                is_firing = True
                shake_intensity = 0.035

        # Apply damped camera shake
        if shake_intensity > 0.001:
            cam_pos[0] += (np.random.rand() - 0.5) * shake_intensity
            cam_pos[1] = 0.40 + (np.random.rand() - 0.5) * shake_intensity
            shake_intensity *= 0.70
        else:
            cam_pos[1] = 0.40

        # Create canvas & draw environment
        img = pipeline.create_canvas()
        whoa_stage.render_outback_stage(img, cam_pos, focal, frame_idx=frame_idx, show_flock=(t_sec < 28.0))

        # -----------------------------------------------------------------
        # Character & Prop Choreography
        # -----------------------------------------------------------------
        # Major Meredith
        major_expr = "smug"
        if 12.0 <= t_sec < 16.0:
            major_expr = "angry"
        elif 16.0 <= t_sec < 26.5:
            major_expr = "shocked" if ((frame_idx // 15) % 2 == 0) else "angry"
        elif t_sec >= 26.5:
            major_expr = "sweat"

        whoa_stage.draw_character(
            img,
            wx=-0.75, wy=0.0, wz=4.5,
            cam_pos=cam_pos, focal=focal,
            role="major", expr=major_expr, phase=phase * 0.4
        )

        # Soldier / Lewis Gunner
        gunner_expr = "neutral"
        if 16.0 <= t_sec < 26.5:
            gunner_expr = "angry"
        elif t_sec >= 26.5:
            gunner_expr = "panic"

        toon_cast.draw_toon_character(
            img,
            wx=-0.20, wy=0.0, wz=4.15,
            cam_pos=cam_pos, focal=focal,
            shirt_col=(0.28, 0.36, 0.18),
            hat_col=(0.22, 0.28, 0.16),
            expr=gunner_expr,
            phase=phase * 0.5,
            scale=1.0,
            prop="aim_gun" if t_sec >= 8.0 else None
        )

        # 3D Lewis Machine Gun on Tripod
        whoa_stage.draw_lewis_gun(
            img,
            wx=0.15, wy=0.0, wz=3.85,
            cam_pos=cam_pos, focal=focal,
            firing=is_firing,
            frame_idx=frame_idx,
            scale=1.05
        )

        # Primary Emu Character
        if t_sec < 15.0:
            # Emus roaming playfully on right side
            whoa_stage.draw_emu_whoa(
                img,
                wx=0.85 + 0.15 * np.sin(phase * 0.5),
                wy=0.0, wz=4.6,
                cam_pos=cam_pos, focal=focal,
                phase=phase * 0.8,
                beret=False
            )
        elif 15.0 <= t_sec < 27.0:
            # High-speed agile dodging maneuvers
            dodge_x = 0.55 + 0.50 * np.sin(phase * 1.8)
            dodge_z = 4.2 + 0.35 * np.cos(phase * 1.4)
            whoa_stage.draw_emu_whoa(
                img,
                wx=dodge_x,
                wy=0.0, wz=dodge_z,
                cam_pos=cam_pos, focal=focal,
                phase=phase * 2.2,
                beret=False
            )
        else:
            # Victorious emu swagger with French beret
            strut_x = 0.35 + (t_sec - 27.0) * 0.12
            whoa_stage.draw_emu_whoa(
                img,
                wx=strut_x,
                wy=0.0, wz=3.9,
                cam_pos=cam_pos, focal=focal,
                phase=phase * 0.9,
                beret=True
            )

        # Comic Dramatic Stamps
        if 0.8 <= t_sec <= 4.2:
            whoa_stage.draw_red_stamp(img, text_tag="OPERATION: GREAT EMU WAR", cy_ratio=0.20)
        elif 16.5 <= t_sec <= 20.0:
            whoa_stage.draw_red_stamp(img, text_tag="10,000 ROUNDS EXPENDED", cy_ratio=0.20)
        elif t_sec >= 28.5:
            whoa_stage.draw_red_stamp(img, text_tag="VICTORY: EMUS", cy_ratio=0.22)

        # Stream frame directly into FFmpeg
        pipeline.write_frame_to_pipe(pipe, img)

        # Progress reporting
        now = time.time()
        if show_progress and (now - last_print > 4.0 or frame_idx == total_frames - 1):
            pct = (frame_idx + 1) / total_frames * 100.0
            fps_speed = (frame_idx + 1) / (now - t_start)
            eta = (total_frames - frame_idx - 1) / max(0.1, fps_speed)
            print(f"   [{pct:5.1f}%] Frame {frame_idx+1:4d}/{total_frames:4d} | Speed: {fps_speed:4.1f} fps | ETA: {eta:4.1f}s")
            last_print = now

    # Close pipe and finalize
    pipeline.close_ffmpeg_pipe(pipe)
    t_end = time.time()
    elapsed = t_end - t_start
    print(f"==================================================")
    print(f"✅ Render Complete!")
    print(f"   Output File: {out_mp4}")
    if os.path.exists(out_mp4):
        file_sz = os.path.getsize(out_mp4) / (1024 * 1024)
        print(f"   File Size  : {file_sz:.2f} MB")
    print(f"   Total Time : {elapsed:.2f} s ({total_frames / elapsed:.1f} fps)")
    print(f"==================================================")
    return out_mp4

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Render Great Emu War episode to iOS-playable MP4.")
    parser.add_argument("--out", default="emu_war_episode.mp4", help="Output MP4 filename")
    parser.add_argument("--width", type=int, default=720, help="Video width (default: 720)")
    parser.add_argument("--height", type=int, default=1280, help="Video height (default: 1280)")
    parser.add_argument("--fps", type=int, default=30, help="Video frame rate (default: 30)")
    parser.add_argument("--duration", type=float, default=35.5, help="Episode duration in seconds (default: 35.5)")
    parser.add_argument("--fast", action="store_true", help="Fast preview mode (15 fps, 10 seconds)")
    args = parser.parse_args()

    fps = 15 if args.fast else args.fps
    duration = 10.0 if args.fast else args.duration

    render_episode(
        out_mp4=args.out,
        width=args.width,
        height=args.height,
        fps=fps,
        duration=duration
    )
