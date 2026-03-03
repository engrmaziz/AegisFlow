from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import numpy as np
import random

router = APIRouter()

class StressTestRequest(BaseModel):
    current_balance: float
    monthly_expenses: float

class StressScenario(BaseModel):
    scenario_id: str
    days: List[float]
    severity: str
    survivability_score: float
    description: str

class StressTestResponse(BaseModel):
    scenarios: List[StressScenario]

@router.post("/stress-test", response_model=StressTestResponse)
async def map_stress_test(req: StressTestRequest):
    """
    GAN-based adversarial stress testing simulation.
    Generates worse-case macroeconomic impacts on liquidity.
    """
    try:
        # MVP: Generate deterministic but wild scenarios to mimic GAN outputs
        scenarios = []
        
        # Scenario 1: Severe payment delays from 3 major clients
        s1_days = []
        bal = req.current_balance
        for d in range(90):
            # Assume 0 revenue, just bleeding expenses + random noise
            daily_burn = req.monthly_expenses / 30.0
            bal -= daily_burn + random.uniform(0, daily_burn * 0.5) 
            # Tiny chance of a late payment arriving
            if random.random() < 0.05:
                bal += random.uniform(1000, 5000)
            s1_days.append(float(bal))
            
        score_1 = max(0.0, min(100.0, (s1_days[-1] / req.current_balance) * 100 if req.current_balance > 0 else 0))
        scenarios.append(StressScenario(
            scenario_id="Market Constriction Shock",
            days=s1_days,
            severity="Extreme",
            survivability_score=score_1,
            description="Systemic delay of accounts receivable (90 days) coupled with sustained operational overhead."
        ))

        # Scenario 2: Unexpected tax/legal liability & moderate delays
        s2_days = []
        bal = req.current_balance
        for d in range(90):
            daily_burn = req.monthly_expenses / 30.0
            bal -= daily_burn
            
            # The unexpected shock on day 15
            if d == 15:
                bal -= random.uniform(req.current_balance * 0.2, req.current_balance * 0.5)
                
            # Sluggish revenue
            if d % 14 == 0 and d > 0:
                bal += random.uniform(req.monthly_expenses * 0.3, req.monthly_expenses * 0.6)
                
            s2_days.append(float(bal))

        score_2 = max(0.0, min(100.0, (s2_days[-1] / req.current_balance) * 100 if req.current_balance > 0 else 0))
        scenarios.append(StressScenario(
            scenario_id="Sudden Capital Expenditure",
            days=s2_days,
            severity="High",
            survivability_score=score_2,
            description="Simulates immediate unbudgeted outflow followed by suppressed revenue realization."
        ))

        # Scenario 3: Gradual margin compression
        s3_days = []
        bal = req.current_balance
        inflation_factor = 1.0
        for d in range(90):
            daily_burn = (req.monthly_expenses / 30.0) * inflation_factor
            bal -= daily_burn
            
            # Expenses slowly creeping up
            inflation_factor += 0.005 
            
            # Regular but slightly smaller revenue
            if d % 7 == 0 and d > 0:
                bal += random.uniform(req.monthly_expenses * 0.2, req.monthly_expenses * 0.25)
                
            s3_days.append(float(bal))
            
        score_3 = max(0.0, min(100.0, (s3_days[-1] / req.current_balance) * 100 if req.current_balance > 0 else 0))
        scenarios.append(StressScenario(
            scenario_id="Hyper-Inflation Margin Squeeze",
            days=s3_days,
            severity="Medium",
            survivability_score=score_3,
            description="Continuous incremental increase in operational costs against fixed revenue schedules."
        ))

        return StressTestResponse(scenarios=scenarios)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
