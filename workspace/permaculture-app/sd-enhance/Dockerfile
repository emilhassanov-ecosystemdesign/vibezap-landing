FROM python:3.11-slim

WORKDIR /app

# System libs needed by Pillow, OpenCV (used by controlnet_aux)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6 && \
    rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first (much smaller than CUDA version)
RUN pip install --no-cache-dir \
      torch torchvision \
      --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY config.yaml .
COPY app/ app/

# Create data directories
RUN mkdir -p uploads outputs

EXPOSE 8000

# Single worker — pipeline is loaded once, shared across requests
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
