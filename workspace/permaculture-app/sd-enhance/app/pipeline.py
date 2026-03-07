"""
Stable Diffusion + ControlNet enhancement pipeline.

Wraps diffusers into a reusable class that loads once at startup
and serves multiple requests via .enhance().
"""

import threading
import uuid
from pathlib import Path

import torch
from PIL import Image
from diffusers import (
    ControlNetModel,
    StableDiffusionControlNetPipeline,
    UniPCMultistepScheduler,
)
from controlnet_aux import HEDdetector, LineartDetector

CONTROLNET_IDS = {
    "lineart": "lllyasviel/control_v11p_sd15_lineart",
    "scribble_hed": "lllyasviel/control_v11p_sd15_scribble",
}

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs"


class EnhancePipeline:
    """Thread-safe SD + ControlNet pipeline with progress tracking."""

    def __init__(self, config: dict):
        self.config = config
        self.pipe = None
        self.preprocessors: dict = {}
        self.ready = False
        self._lock = threading.Lock()
        self.progress = _idle_progress()

    # ------------------------------------------------------------------
    # Model loading (call once at startup)
    # ------------------------------------------------------------------

    def load(self):
        """Download (if needed) and load all models into memory."""
        self._set_progress("loading", 0, 0, "Downloading ControlNet preprocessors...")

        self.preprocessors["lineart"] = LineartDetector.from_pretrained(
            "lllyasviel/Annotators"
        )
        self.preprocessors["scribble_hed"] = HEDdetector.from_pretrained(
            "lllyasviel/Annotators"
        )

        method = self.config["controlnet"]["preprocessor"]
        controlnet_id = CONTROLNET_IDS[method]
        use_cuda = torch.cuda.is_available()
        dtype = torch.float16 if use_cuda else torch.float32

        self._set_progress("loading", 0, 0, f"Downloading ControlNet model...")
        controlnet = ControlNetModel.from_pretrained(controlnet_id, torch_dtype=dtype)

        checkpoint = self.config["model"]["checkpoint"]
        self._set_progress("loading", 0, 0, f"Downloading {checkpoint}...")
        self.pipe = StableDiffusionControlNetPipeline.from_pretrained(
            checkpoint,
            controlnet=controlnet,
            torch_dtype=dtype,
            safety_checker=None,
        )

        self.pipe.scheduler = UniPCMultistepScheduler.from_config(
            self.pipe.scheduler.config
        )

        if use_cuda:
            self.pipe.enable_model_cpu_offload()
        else:
            self.pipe = self.pipe.to("cpu")

        self.ready = True
        self.progress = _idle_progress()
        print(f"Pipeline ready  (device={'cuda' if use_cuda else 'cpu'})")

    # ------------------------------------------------------------------
    # Enhancement (called per-request)
    # ------------------------------------------------------------------

    def enhance(self, image_path: str, overrides: dict | None = None) -> str:
        """
        Enhance a sketch image.

        Returns the absolute path to the generated output PNG.
        """
        overrides = overrides or {}

        with self._lock:
            try:
                return self._run(image_path, overrides)
            except Exception as exc:
                self._set_progress("error", 0, 0, str(exc))
                raise

    def _run(self, image_path: str, overrides: dict) -> str:
        cfg = self.config
        strength = overrides.get("strength", cfg["controlnet"]["strength"])
        steps = overrides.get("steps", cfg["generation"]["steps"])
        preprocessor = overrides.get(
            "preprocessor", cfg["controlnet"]["preprocessor"]
        )
        width = cfg["generation"]["width"]
        height = cfg["generation"]["height"]
        seed = cfg["generation"].get("seed", -1)

        # --- Phase 1: preprocess ---
        self._set_progress("preprocessing", 0, 0, "Preprocessing sketch...")

        image = Image.open(image_path).convert("RGB")
        image = image.resize((width, height), Image.LANCZOS)

        detector = self.preprocessors[preprocessor]
        if preprocessor == "scribble_hed":
            control_image = detector(image, scribble=True)
        else:
            control_image = detector(image)

        # --- Phase 2: generate ---
        total = steps
        self._set_progress("generating", 0, total, f"Starting denoising ({total} steps)...")

        def on_step_end(_pipe, step_index, _timestep, cb_kwargs):
            self._set_progress(
                "generating",
                step_index + 1,
                total,
                f"Denoising step {step_index + 1} / {total}",
            )
            return cb_kwargs

        generator = None
        if seed >= 0:
            generator = torch.Generator()
            generator.manual_seed(seed)

        result = self.pipe(
            prompt=cfg["prompt"]["positive"],
            negative_prompt=cfg["prompt"]["negative"],
            image=control_image,
            num_inference_steps=steps,
            guidance_scale=cfg["generation"]["guidance_scale"],
            controlnet_conditioning_scale=strength,
            generator=generator,
            callback_on_step_end=on_step_end,
        )

        output_image = result.images[0]

        # --- Phase 3: save ---
        self._set_progress("saving", total, total, "Saving result...")

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"enhanced_{uuid.uuid4().hex[:8]}.png"
        output_path = OUTPUT_DIR / filename
        output_image.save(output_path, quality=95)

        self._set_progress("done", total, total, "Complete")
        return str(output_path)

    # ------------------------------------------------------------------
    # Progress helpers
    # ------------------------------------------------------------------

    def _set_progress(self, phase: str, step: int, total: int, message: str):
        self.progress = {
            "phase": phase,
            "step": step,
            "total": total,
            "message": message,
        }


def _idle_progress() -> dict:
    return {"phase": "idle", "step": 0, "total": 0, "message": "Ready"}
