from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.ensemble import IsolationForest

router = APIRouter()

class InvoiceAnomalyData(BaseModel):
    invoice_id: str
    amount: float
    vendor_code: int

class AnomalyRequest(BaseModel):
    invoices: List[InvoiceAnomalyData]

class EvaluatedInvoice(BaseModel):
    invoice_id: str
    amount: float
    vendor_code: int
    is_anomaly: bool
    anomaly_score: float

class AnomalyResponse(BaseModel):
    evaluated_invoices: List[EvaluatedInvoice]

@router.post("/detect", response_model=AnomalyResponse)
async def detect_anomalies(req: AnomalyRequest):
    """
    Evaluates a batch of invoices using Isolation Forest to detect AI fraud and anomalies
    based on the invoice amount and vendor patterns.
    """
    if not req.invoices:
        raise HTTPException(status_code=400, detail="No invoices provided.")

    try:
        # Extract features
        X = np.array([[inv.vendor_code, inv.amount] for inv in req.invoices])
        
        # Standardize features so amount variance doesn't completely overwhelm vendor code structure
        X_mean = X.mean(axis=0)
        X_std = X.std(axis=0) + 1e-8
        X_scaled = (X - X_mean) / X_std

        # Initialize and fit Isolation Forest
        # contamination represents the theoretical percentage of anomalies in the dataset
        # In a generic MVP without a pretrained model disk file, we fit it dynamically onto the batch.
        clf = IsolationForest(contamination=0.05, random_state=42)
        
        # Provide enough training redundancy if payload is extremely tiny
        if len(req.invoices) < 3:
            X_scaled = np.vstack([X_scaled] * 10) # Over-sample array temporarily to run math
            
        predictions = clf.fit_predict(X_scaled)
        scores = clf.decision_function(X_scaled)

        result = []
        for i, inv in enumerate(req.invoices):
            result.append(
                EvaluatedInvoice(
                    invoice_id=inv.invoice_id,
                    amount=inv.amount,
                    vendor_code=inv.vendor_code,
                    # IsolationForest returns -1 for out-of-distribution anomalous data, 1 for inliers
                    is_anomaly=bool(predictions[i] == -1),
                    anomaly_score=float(scores[i])
                )
            )

        return AnomalyResponse(evaluated_invoices=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")
