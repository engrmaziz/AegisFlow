from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import random

router = APIRouter()

class InvoiceRiskRequest(BaseModel):
    client_id: str
    invoice_amount: float
    invoice_age_days: float
    days_until_due: float
    client_avg_delay: float
    client_late_count: float

class ClientClusterRequest(BaseModel):
    payment_delay_days: float
    invoice_amount: float
    late_payment_count: float

@router.post("/predict/invoice-risk")
async def predict_invoice_risk(request: Request, data: InvoiceRiskRequest):
    try:
        # In a real setup, we'd use request.app.state.classifier etc.
        # But since models are untrained mock shells in this setup, we provide semantic mock responses.
        
        # Simple heuristic + randomness for the sake of functional UI
        default_prob = 0.1 + (data.client_avg_delay * 0.02) + (data.client_late_count * 0.05)
        default_prob = min(max(default_prob, 0.0), 1.0)
        
        predicted_days_late = int(data.client_avg_delay * 1.2)
        
        if default_prob < 0.3:
            risk_label = "Low"
        elif default_prob < 0.6:
            risk_label = "Medium"
        else:
            risk_label = "High"

        # Using real SVM/Ridge if they were trained:
        # classifier = request.app.state.classifier
        # default_prob = classifier.predict_default_probability(data.dict())

        return {
            "default_probability": default_prob,
            "risk_label": risk_label,
            "predicted_days_late": predicted_days_late,
            "confidence": 0.88
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cluster/client")
async def cluster_client(request: Request, data: ClientClusterRequest):
    try:
        # Mock logic based on delay_days
        if data.payment_delay_days < 5:
            tier = "Reliable"
            c_id = 0
        elif data.payment_delay_days < 20:
            tier = "Erratic"
            c_id = 1
        else:
            tier = "High Risk"
            c_id = 2
            
        return {
            "risk_tier": tier,
            "cluster_id": c_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
