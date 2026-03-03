# Base python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for computer vision and OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements explicitly
COPY backend/requirements.txt /app/requirements.txt

# Install dependencies (ignoring versions that might conflict during MVP build process if any occur)
RUN pip install --no-cache-dir -r requirements.txt || pip install fastapi uvicorn pydantic python-multipart numpy pandas scikit-learn torch torchvision pytesseract Pillow python-dotenv supabase opencv-python httpx

# Copy ML backend specific code
COPY backend/ /app/backend/

# Copy API layer code
COPY api/ /app/api/

# Expose port for FastAPI
EXPOSE 8000

# Set Python Path and Environment variables
ENV PYTHONPATH="${PYTHONPATH}:/app"
ENV ENVIRONMENT="production"

# Command to run the application using uvicorn
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
