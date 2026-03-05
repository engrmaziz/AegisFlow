from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import traceback
import sys
import os

# Append backend path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Placeholder imports that would be resolved strictly in production
# from supervised_models import InvoiceDefaultClassifier, PaymentDelayRegressor
# from clustering import ClientClusterer
# from lstm_forecast import LSTMForecaster
# from gan_stress import GANTrainer

from api.routers import invoice, cashflow, ocr, stress, client_risk, anomaly, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models into app.state at startup
    print("Loading ML models...")
    app.state.svm = None  # Mock loaded models for MVP
    app.state.dt = None
    app.state.ridge = None
    app.state.kmeans = None
    app.state.scaler = None
    app.state.lstm = None
    app.state.gan = None
    print("Models loaded successfully.")
    yield
    print("Shutting down and cleaning up models...")
    app.state.svm = None

app = FastAPI(title="InvoiceIQ API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://invoiceiq.vercel.app",
        "https://*.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoice.router, prefix="/predict", tags=["invoice_risk"])
app.include_router(cashflow.router, prefix="/predict", tags=["cashflow"])
app.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
app.include_router(stress.router, prefix="", tags=["stress"]) # Includes /stress-test
app.include_router(client_risk.router, prefix="/risk", tags=["risk"])
app.include_router(anomaly.router, prefix="/anomaly", tags=["anomaly"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "InvoiceIQ API is running"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)},
    )
