import io
import re
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms, models
import pytesseract
import os

router = APIRouter()

# 1. Recreate the LightweightBBoxCNN Model Architecture
class LightweightBBoxCNN(nn.Module):
    def __init__(self):
        super(LightweightBBoxCNN, self).__init__()
        # MobileNetV2 Backbone
        self.backbone = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT).features
        
        self.regressor = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(1280, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 4),
            nn.Sigmoid()
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.regressor(features)

# 2. Load the weights globally to avoid reloading on every request
device = torch.device('cpu')
model = LightweightBBoxCNN()

model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'backend', 'models', 'model.pth')
try:
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        model.eval()
        print("Successfully loaded LightweightBBoxCNN weights.")
    else:
        print(f"Warning: OCR model weights not found at {model_path}. Endpoint may fail.")
except Exception as e:
    print(f"Failed to load OCR model weights: {e}")

class OCRResponse(BaseModel):
    invoice_number: str | None
    total: float | None
    date: str | None
    raw_text: str

# Define router path without duplicate '/ocr' prefix since main.py adds it
@router.post("/invoice", response_model=OCRResponse)
async def process_invoice_ocr(file: UploadFile = File(...)):
    if not isinstance(model, LightweightBBoxCNN):
        raise HTTPException(status_code=500, detail="OCR CNN model not properly initialized.")

    try:
        # Preprocess the uploaded image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        orig_w, orig_h = image.size
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        # 3. Predict Normalized Bounding Box
        with torch.no_grad():
            bbox_norm = model(input_tensor)[0].tolist() # [x_min, y_min, x_max, y_max]
            
        x_min, y_min, x_max, y_max = bbox_norm
        
        # Convert normalized coordinates back to absolute image pixels
        left = max(0, int(x_min * orig_w))
        top = max(0, int(y_min * orig_h))
        right = min(orig_w, int(x_max * orig_w))
        bottom = min(orig_h, int(y_max * orig_h))
        
        # Prevent invalid cropping rectangles
        if right <= left or bottom <= top:
            # Fallback to scanning the whole image if network outputs garbage coordinates
            cropped_image = image
        else:
            cropped_image = image.crop((left, top, right, bottom))
            
        # 4. Extract text using Tesseract
        raw_text = pytesseract.image_to_string(cropped_image)
        
        # 5. Regex to parse standard financial fields
        # Invoice Number (account for OCR typos like 'Invelce' and abbreviations like 'PoS')
        inv_match = re.search(r'(?i)(?:invoice|invelce|pos)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9\-]+)', raw_text)
        invoice_number = inv_match.group(1).strip() if inv_match else None
        
        # Total Amount (e.g., "Total: 221", "Total: $1,234.56")
        total_match = re.search(r'(?i)(?:total|amount due|balance)\s*[:\-]?\s*\$?\s*([0-9,]+(?:\.\d{1,2})?)', raw_text)
        total = None
        if total_match:
            try:
                total = float(total_match.group(1).replace(',', ''))
            except ValueError:
                pass
                
        # Date (e.g., "26/02/2026", "2023-10-25" - made prefix purely optional)
        date_match = re.search(r'(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})', raw_text)
        date = date_match.group(1).strip() if date_match else None

        return OCRResponse(
            invoice_number=invoice_number,
            total=total,
            date=date,
            raw_text=raw_text
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
