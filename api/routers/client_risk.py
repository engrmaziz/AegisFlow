from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.cluster import KMeans

router = APIRouter()

class ClientData(BaseModel):
    client_id: str
    total_invoice_volume: float
    average_payment_delay_days: float

class ClusterRequest(BaseModel):
    clients: List[ClientData]

class ClusteredClient(BaseModel):
    client_id: str
    total_invoice_volume: float
    average_payment_delay_days: float
    cluster_id: int
    risk_label: str

class ClusterResponse(BaseModel):
    clustered_clients: List[ClusteredClient]

@router.post("/cluster", response_model=ClusterResponse)
async def cluster_clients(req: ClusterRequest):
    """
    Dynamically clusters a list of clients into 3 risk segments 
    (Low, Medium, High Risk) based on their volume and payment delay.
    """
    if not req.clients:
        raise HTTPException(status_code=400, detail="No clients provided.")
    if len(req.clients) < 3:
        raise HTTPException(status_code=400, detail="At least 3 clients are required to form 3 clusters.")

    try:
        # Extract features
        X = np.array([[c.total_invoice_volume, c.average_payment_delay_days] for c in req.clients])
        
        # Standardize features so volume magnitude doesn't heavily overpower delay
        X_mean = X.mean(axis=0)
        X_std = X.std(axis=0) + 1e-8
        X_scaled = (X - X_mean) / X_std

        # Run KMeans to segment clients into 3 buckets
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)
        centers = kmeans.cluster_centers_

        # Determine risk based heavily on payment delay (std center index 1)
        delay_centers = centers[:, 1]
        
        # Sort indices: 0 is lowest delay, 2 is highest delay
        sorted_indices = np.argsort(delay_centers)
        
        risk_map = {
            sorted_indices[0]: "Low Risk",
            sorted_indices[1]: "Medium Risk",
            sorted_indices[2]: "High Risk"
        }

        # Build final response payload mapping labels to clients
        result = []
        for i, client in enumerate(req.clients):
            c_id = int(labels[i])
            result.append(
                ClusteredClient(
                    client_id=client.client_id,
                    total_invoice_volume=client.total_invoice_volume,
                    average_payment_delay_days=client.average_payment_delay_days,
                    cluster_id=c_id,
                    risk_label=risk_map[c_id]
                )
            )

        return ClusterResponse(clustered_clients=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering algorithm failed: {str(e)}")
