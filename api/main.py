from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import traceback

import sys
import os
# Add backend directory to path so we can import ML modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from supervised_models import InvoiceDefaultClassifier, PaymentDelayRegressor
from clustering import ClientClusterer
from lstm_forecast import LSTMForecaster, CashFlowTrainer
from gan_stress import Generator, Discriminator, GANTrainer

# Import routers
from routers import invoice, cashflow, ocr, stress

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all ML models into app.state at startup."""
    print("Loading ML models for InvoiceIQ...")
    try:
        # Note: In a real deploy, we'd load joblib/pth files. 
        # Here we instantiate them, but they would be un-trained if not loaded.
        # We simulate loading logic.
        
        # 1. Supervised Models
        app.state.classifier = InvoiceDefaultClassifier(data_path="none")
        app.state.regressor = PaymentDelayRegressor(data_path="none")
        # app.state.classifier.load_models("models")
        
        # 2. Clustering
        app.state.clusterer = ClientClusterer(data_path="none")
        # app.state.clusterer.load_model("models")
        
        # 3. LSTM
        lstm_model = LSTMForecaster()
        app.state.lstm_trainer = CashFlowTrainer(lstm_model)
        # app.state.lstm_trainer.load_model("models/lstm.pth")
        
        # 4. GAN
        G = Generator()
        D = Discriminator()
        app.state.gan_trainer = GANTrainer(G, D)
        # load state dicts...
        
        print("Models loaded successfully!")
        app.state.models_loaded = True
    except Exception as e:
        print(f"Error loading models: {e}")
        app.state.models_loaded = False
        
    yield
    print("Shutting down ML models...")
    # cleanup if needed

app = FastAPI(title="InvoiceIQ API", lifespan=lifespan)

# CORS configuration
origins = [
    "http://localhost:3000",
    "https://yourdomain.tech",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

# Include routers
app.include_router(invoice.router, tags=["Invoice"])
app.include_router(cashflow.router, tags=["Cash Flow"])
app.include_router(ocr.router, tags=["OCR"])
app.include_router(stress.router, tags=["Stress Test"])

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "models_loaded": app.state.models_loaded
    }
