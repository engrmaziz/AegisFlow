const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface InvoiceRiskRequest {
    client_id: string;
    invoice_amount: number;
    invoice_age_days: number;
    days_until_due: number;
    client_avg_delay: number;
    client_late_count: number;
}

export interface InvoiceRiskResponse {
    default_probability: number;
    risk_label: string;
    predicted_days_late: number;
    confidence: number;
}

export async function fetchInvoiceRisk(data: InvoiceRiskRequest): Promise<InvoiceRiskResponse> {
    try {
        const response = await fetch(`${API_URL}/predict/invoice-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error('Failed to fetch invoice risk. Please try again later.');
    }
}

export interface Transaction {
    date: string;
    amount: number;
    type: string;
}

export interface ForecastResponse {
    forecast: number[];
    lower_bound: number[];
    upper_bound: number[];
    liquidity_warning: boolean;
    projected_30_day: number;
    projected_60_day: number;
    projected_90_day: number;
}

export async function fetchCashFlowForecast(transactions: Transaction[]): Promise<ForecastResponse> {
    try {
        const response = await fetch(`${API_URL}/predict/cashflow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions }),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error('Failed to fetch cash flow forecast. Please try again later.');
    }
}

export interface ClientClusterRequest {
    payment_delay_days: number;
    invoice_amount: number;
    late_payment_count: number;
}

export interface ClusterResponse {
    risk_tier: string;
    cluster_id: number;
}

export async function fetchClientCluster(data: ClientClusterRequest): Promise<ClusterResponse> {
    try {
        const response = await fetch(`${API_URL}/cluster/client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error('Failed to fetch client cluster. Please try again later.');
    }
}

export interface OCRResponse {
    amount: number;
    due_date: string;
    confidence: number;
    raw_text: string;
}

export async function extractOCRData(imageFile: File): Promise<OCRResponse> {
    try {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await fetch(`${API_URL}/ocr/invoice`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error('Failed to extract OCR data. Please try again later.');
    }
}

export interface StressTestRequest {
    current_balance: number;
    monthly_expenses: number;
}

export interface StressScenario {
    scenario_id: string;
    days: number[];
    severity: string;
    survivability_score: number;
    description: string;
}

export interface StressTestResponse {
    scenarios: StressScenario[];
}

export async function runStressTest(data: StressTestRequest): Promise<StressTestResponse> {
    try {
        const response = await fetch(`${API_URL}/stress-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error('Failed to run stress test. Please try again later.');
    }
}
