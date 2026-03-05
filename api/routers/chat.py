import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str

# System prompt configuring the AI's persona
SYSTEM_PROMPT = """You are an expert financial advisor integrated into the InvoiceIQ platform.
Your objective is to assist business owners with analyzing cash flow forecasts,
interpreting Client Risk profiles clustered using K-Means, and detecting Invoice
Fraud flagged through our Isolation Forest anomaly model.

Provide concise, professional, and highly strategic financial advice.
Avoid printing raw code; focus entirely on actionable business intelligence based on
the user's queries."""

@router.post("/ask", response_model=ChatResponse)
async def ask_financial_advisor(req: ChatRequest):
    if not req.query or req.query.strip() == "":
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable is missing or not set.")

    try:
        # Initialize Groq client
        client = Groq(api_key=api_key)

        # Structure the conversation payload
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": req.query}
        ]

        # Call the Llama3 8B model via Groq API
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama3-8b-8192",
            temperature=0.7,
            max_tokens=1024
        )

        response_content = chat_completion.choices[0].message.content

        return ChatResponse(answer=response_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")
