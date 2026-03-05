FROM python:3.12-slim

# Install system dependencies needed for Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*


# Set working directory
WORKDIR /app

# Install basic system dependencies if needed (can be expanded later if necessary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements explicitly
COPY backend/requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

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
