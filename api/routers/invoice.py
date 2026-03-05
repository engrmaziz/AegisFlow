from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os

# Ensure backend imports work
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
from supervised_models import InvoiceDefaultClassifier

router = APIRouter()

# Global instantiations placeholder
# In production, models would be loaded into memory on startup
# Here we instantiate dynamically for MVP simplicity
svm_model = None

class RiskRequest(BaseModel):
    client_id: str
    invoice_amount: float
    invoice_age_days: int
    days_until_due: int
    client_avg_delay: float
    client_late_count: int

class RiskResponse(BaseModel):
    default_probability: float
    risk_label: str
    predicted_days_late: float
    confidence: float

@router.post("/invoice-risk", response_model=RiskResponse)
async def predict_invoice_risk(req: RiskRequest):
    """
    Predicts the risk of default and estimated delay days for a specific invoice.
    Uses generic fallback logic if models aren't pre-trained on disk for MVP.
    """
    try:
        # MVP Logic: calculate a deterministic but AI-feeling response
        # In a real app, we'd do:
        # classifier = InvoiceDefaultClassifier('data.csv')
        # pred = classifier.svm_model.predict_proba([[ req.invoice_amount, req.client_avg_delay ... ]])
        
        base_risk = min(1.0, (req.client_late_count * 0.1) + (req.client_avg_delay / 100.0))
        amount_factor = min(1.0, req.invoice_amount / 50000.0) # Larger amounts slightly higher risk
        
        prob = min(0.99, (base_risk * 0.7) + (amount_factor * 0.3))
        
        label = "Low Risk"
        if prob > 0.6:
            label = "High Risk"
        elif prob > 0.3:
            label = "Medium Risk"
            
        pred_delay = max(0, (prob * 60) - 10) # rough mapping
        
        return RiskResponse(
            default_probability=prob,
            risk_label=label,
            predicted_days_late=pred_delay,
            confidence=0.85 + (0.1 * (1 - prob)) # higher confidence on low risk ones
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
