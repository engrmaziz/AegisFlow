from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np

router = APIRouter()

class Transaction(BaseModel):
    date: str
    amount: float
    type: str

class CashflowRequest(BaseModel):
    transactions: List[Transaction]

class CashflowResponse(BaseModel):
    forecast: List[float]
    lower_bound: List[float]
    upper_bound: List[float]
    liquidity_warning: bool
    projected_30_day: float
    projected_60_day: float
    projected_90_day: float

@router.post("/predict/cashflow", response_model=CashflowResponse)
async def predict_cashflow(req: CashflowRequest):
    """
    Predicts cash flow for the next 90 days using an LSTM-inspired approach.
    For MVP, generates realistic synthetic trend data based on input transactions.
    """
    try:
        if not req.transactions:
            raise HTTPException(status_code=400, detail="No transactions provided")
            
        current_balance = sum(t.amount for t in req.transactions)
        
        # Determine basic trend from last 30 transactions
        recent = req.transactions[-30:] if len(req.transactions) > 30 else req.transactions
        daily_drift = sum(t.amount for t in recent) / len(recent) if recent else 0
        
        # We want to smooth the drift somewhat so it's not wildly unstable
        daily_drift = min(max(daily_drift, -500), 500) 
        
        forecast = []
        lower = []
        upper = []
        
        running_bal = current_balance
        volatility = np.std([t.amount for t in recent]) if len(recent) > 1 else 1000.0
        
        for day in range(1, 91):
            # Add some sine wave seasonality + drift + noise
            seasonality = np.sin(day / 30.0 * 2 * np.pi) * (volatility * 0.2)
            noise = np.random.normal(0, volatility * 0.1)
            
            running_bal += daily_drift + seasonality + noise
            forecast.append(running_bal)
            
            # Bounds widen over time
            spread = volatility * (day ** 0.5) * 0.5
            upper.append(running_bal + spread)
            lower.append(running_bal - spread)
            
        warn = min(lower) < 0
        
        return CashflowResponse(
            forecast=forecast,
            lower_bound=lower,
            upper_bound=upper,
            liquidity_warning=warn,
            projected_30_day=forecast[29],
            projected_60_day=forecast[59],
            projected_90_day=forecast[89]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
