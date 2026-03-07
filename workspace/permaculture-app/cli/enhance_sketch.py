#!/usr/bin/env python3
"""
Permaculture Sketch Enhancer CLI

Transforms a pencil sketch into an enhanced architectural permaculture
illustration using Stable Diffusion with ControlNet.

Usage:
    python enhance_sketch.py <input_image>
    python enhance_sketch.py sketch.jpg -o ./results --strength 0.8
    python enhance_sketch.py sketch.png --preprocessor scribble_hed --steps 50

Models are auto-downloaded from HuggingFace on first run.
"""

import argparse
import sys
import os
from datetime import datetime
from pathlib import Path

import yaml
import torch
from PIL import Image
from diffusers import (
    StableDiffusionControlNetPipeline,
    ControlNetModel,
    UniPCMultistepScheduler,
)
from controlnet_aux import LineartDetector, HEDdetector


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_CONFIG = Path(__file__).parent / "config.yaml"


def load_config(config_path: str = None) -> dict:
    """Load configuration from YAML file."""
    path = Path(config_path) if config_path else DEFAULT_CONFIG
    if not path.is_file():
        print(f"Error: Config file not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, "r") as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------------------
# ControlNet preprocessors
# ---------------------------------------------------------------------------

CONTROLNET_MODELS = {
    "lineart": "lllyasviel/control_v11p_sd15_lineart",
    "scribble_hed": "lllyasviel/control_v11p_sd15_scribble",
}


def get_preprocessor(method: str):
    """Return the appropriate ControlNet preprocessor."""
    print(f"  Loading {method} preprocessor (auto-download if needed)...")
    if method == "lineart":
        return LineartDetector.from_pretrained("lllyasviel/Annotators")
    if method == "scribble_hed":
        return HEDdetector.from_pretrained("lllyasviel/Annotators")
    raise ValueError(
        f"Unknown preprocessor '{method}'. Choose 'lineart' or 'scribble_hed'."
    )


# ---------------------------------------------------------------------------
# Pipeline construction
# ---------------------------------------------------------------------------

def build_pipeline(config: dict):
    """Build the SD + ControlNet pipeline, auto-downloading models."""
    method = config["controlnet"]["preprocessor"]
    controlnet_id = CONTROLNET_MODELS[method]
    checkpoint = config["model"]["checkpoint"]

    use_cuda = torch.cuda.is_available()
    dtype = torch.float16 if use_cuda else torch.float32

    print(f"  ControlNet : {controlnet_id}")
    controlnet = ControlNetModel.from_pretrained(
        controlnet_id,
        torch_dtype=dtype,
    )

    print(f"  Checkpoint : {checkpoint}")
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        checkpoint,
        controlnet=controlnet,
        torch_dtype=dtype,
        safety_checker=None,
    )

    # Fast scheduler
    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

    # Device placement
    if use_cuda:
        pipe.enable_model_cpu_offload()  # streams layers to GPU on demand
    else:
        pipe = pipe.to("cpu")
        print("  WARNING: Running on CPU — generation will be very slow.")

    return pipe


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------

def preprocess_image(image_path: str, config: dict):
    """Load sketch, resize, and run the ControlNet preprocessor."""
    image = Image.open(image_path).convert("RGB")

    width = config["generation"]["width"]
    height = config["generation"]["height"]
    image = image.resize((width, height), Image.LANCZOS)

    method = config["controlnet"]["preprocessor"]
    preprocessor = get_preprocessor(method)

    if method == "scribble_hed":
        control_image = preprocessor(image, scribble=True)
    else:
        control_image = preprocessor(image)

    return image, control_image


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

def generate(pipe, control_image: Image.Image, config: dict) -> Image.Image:
    """Run the Stable Diffusion + ControlNet pipeline."""
    gen = config["generation"]
    seed = gen.get("seed", -1)

    generator = None
    if seed >= 0:
        generator = torch.Generator()
        generator.manual_seed(seed)

    result = pipe(
        prompt=config["prompt"]["positive"],
        negative_prompt=config["prompt"]["negative"],
        image=control_image,
        num_inference_steps=gen["steps"],
        guidance_scale=gen["guidance_scale"],
        controlnet_conditioning_scale=config["controlnet"]["strength"],
        generator=generator,
    )

    return result.images[0]


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Enhance a pencil sketch into an architectural permaculture illustration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  %(prog)s sketch.jpg
  %(prog)s sketch.png -o ./results --strength 0.8
  %(prog)s sketch.jpg --preprocessor scribble_hed --steps 50
  %(prog)s sketch.jpg --seed 42 --save-control
        """,
    )

    parser.add_argument(
        "input",
        help="Path to input pencil sketch image (JPG/PNG/WEBP)",
    )
    parser.add_argument(
        "-o", "--output-dir",
        default=str(Path(__file__).parent / "outputs"),
        help="Output directory (default: cli/outputs/)",
    )
    parser.add_argument(
        "-c", "--config",
        default=None,
        help="Path to config.yaml (default: cli/config.yaml)",
    )
    parser.add_argument(
        "--strength",
        type=float,
        default=None,
        help="Override ControlNet conditioning strength (0.0–1.0)",
    )
    parser.add_argument(
        "--preprocessor",
        choices=["lineart", "scribble_hed"],
        default=None,
        help="Override ControlNet preprocessor method",
    )
    parser.add_argument(
        "--steps",
        type=int,
        default=None,
        help="Override number of inference steps",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducible results",
    )
    parser.add_argument(
        "--prompt",
        default=None,
        help="Override the positive prompt",
    )
    parser.add_argument(
        "--save-control",
        action="store_true",
        help="Also save the preprocessed control image",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    # --- Validate input ------------------------------------------------
    if not os.path.isfile(args.input):
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    # --- Load config ---------------------------------------------------
    config = load_config(args.config)

    # --- Apply CLI overrides -------------------------------------------
    if args.strength is not None:
        config["controlnet"]["strength"] = args.strength
    if args.preprocessor is not None:
        config["controlnet"]["preprocessor"] = args.preprocessor
    if args.steps is not None:
        config["generation"]["steps"] = args.steps
    if args.seed is not None:
        config["generation"]["seed"] = args.seed
    if args.prompt is not None:
        config["prompt"]["positive"] = args.prompt

    # --- Prepare output dir --------------------------------------------
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # --- Banner --------------------------------------------------------
    print("=" * 60)
    print("  Permaculture Sketch Enhancer")
    print("=" * 60)
    print(f"  Input        : {args.input}")
    print(f"  Preprocessor : {config['controlnet']['preprocessor']}")
    print(f"  Strength     : {config['controlnet']['strength']}")
    print(f"  Checkpoint   : {config['model']['checkpoint']}")
    print(f"  Steps        : {config['generation']['steps']}")
    print(f"  Guidance     : {config['generation']['guidance_scale']}")
    print(f"  Resolution   : {config['generation']['width']}x{config['generation']['height']}")
    seed_display = config["generation"].get("seed", -1)
    print(f"  Seed         : {'random' if seed_display < 0 else seed_display}")
    print(f"  Output dir   : {output_dir}")
    print("=" * 60)

    # --- Step 1: Preprocess --------------------------------------------
    print("\n[1/3] Preprocessing sketch...")
    original, control_image = preprocess_image(args.input, config)

    if args.save_control:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        control_path = output_dir / f"control_{ts}.png"
        control_image.save(control_path)
        print(f"  Control image saved: {control_path}")

    # --- Step 2: Load models -------------------------------------------
    print("\n[2/3] Loading models (auto-downloading from HuggingFace if needed)...")
    pipe = build_pipeline(config)

    # --- Step 3: Generate ----------------------------------------------
    print("\n[3/3] Generating enhanced illustration...")
    result = generate(pipe, control_image, config)

    # --- Save result ---------------------------------------------------
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"enhanced_{ts}.png"
    result.save(output_path, quality=95)

    print("\n" + "=" * 60)
    print(f"  Done! Output saved to: {output_path}")
    print(f"  Resolution: {result.size[0]}x{result.size[1]}")
    print("=" * 60)


if __name__ == "__main__":
    main()
