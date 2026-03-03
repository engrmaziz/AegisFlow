import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import pytesseract
import re
import os

class InvoiceCNN(nn.Module):
    """CNN to predict bounding box [x, y, w, h] of total amount/due date fields."""
    def __init__(self):
        super(InvoiceCNN, self).__init__()
        
        # input shape assuming 256x256 grayscale (1 channel)
        self.conv1 = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2) # 128x128
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2) # 64x64
        )
        self.conv3 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2) # 32x32
        )
        
        self.fc1 = nn.Sequential(
            nn.Linear(128 * 32 * 32, 512),
            nn.ReLU(),
            nn.Dropout(0.5)
        )
        
        # Output 4 coordinates: [x, y, width, height]
        self.fc2 = nn.Linear(512, 4)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        x = x.view(x.size(0), -1) # flatten
        x = self.fc1(x)
        x = self.fc2(x)
        return x

class InvoiceOCRPipeline:
    """Full pipeline for CNN-assisted OCR extraction."""
    def __init__(self, model_path: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.cnn = InvoiceCNN().to(self.device)
        
        if model_path and os.path.exists(model_path):
            self.cnn.load_state_dict(torch.load(model_path, map_location=self.device))
        
        self.cnn.eval()
        self.transform = transforms.Compose([
            transforms.Grayscale(),
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,))
        ])

    def preprocess_image(self, image_path: str) -> torch.Tensor:
        """Loads and processes image for CNN."""
        img = Image.open(image_path).convert("RGB")
        img_tensor = self.transform(img).unsqueeze(0).to(self.device)
        return img_tensor

    def extract_region(self, image_path: str, bbox: list) -> Image.Image:
        """Crops image based on bbox predictions from 256x256 scaled back to original."""
        img = Image.open(image_path).convert("RGB")
        w_orig, h_orig = img.size
        
        # Bbox is predicted as relative coordinates or scaled to 256x256.
        # Assuming our model outputs [x, y, w, h] in absolute 256x256 space.
        x_pred, y_pred, w_pred, h_pred = bbox
        
        # Scale back to original
        x_orig = max(0, int((x_pred / 256.0) * w_orig))
        y_orig = max(0, int((y_pred / 256.0) * h_orig))
        w_crop = int((w_pred / 256.0) * w_orig)
        h_crop = int((h_pred / 256.0) * h_orig)
        
        # Ensure we don't crop out of bounds
        x_end = min(x_orig + w_crop, w_orig)
        y_end = min(y_orig + h_crop, h_orig)
        
        cropped = img.crop((x_orig, y_orig, x_end, y_end))
        return cropped

    def run_tesseract(self, region_image: Image.Image) -> str:
        """Runs Tesseract OCR on region."""
        # --psm 6 assumes a single uniform block of text
        text = pytesseract.image_to_string(region_image, config='--psm 6')
        return text

    def extract_amount(self, text: str) -> float:
        """Regex to find dollar amounts."""
        pattern = r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        matches = re.findall(pattern, text)
        if matches:
            # Clean comma and convert
            clean_match = matches[-1].replace(',', '')
            try:
                return float(clean_match)
            except ValueError:
                pass
        return 0.0

    def extract_due_date(self, text: str) -> str:
        """Regex to find dates."""
        patterns = [
            r'(\d{2}/\d{2}/\d{4})',       # MM/DD/YYYY
            r'(\d{2}-\d{2}-\d{4})',       # DD-MM-YYYY
            r'(?:Due|Date).*?([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})' # Due Date: Month DD, YYYY
        ]
        
        for p in patterns:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return "Not Found"

    def process_invoice_image(self, image_path: str) -> dict:
        """End-to-end OCR processing pipeline."""
        try:
            tensor = self.preprocess_image(image_path)
            with torch.no_grad():
                bbox_pred = self.cnn(tensor)[0].cpu().numpy()
            
            # In a real deployed situation, if CNN untrained, 
            # bbox will be random. Let's provide a fallback full-image scan if bbox area is tiny.
            area = bbox_pred[2] * bbox_pred[3]
            if area < 100:
                print("Warning: CNN predicted invalid bbox. Scanning full image.")
                img = Image.open(image_path)
                cropped = img
            else:
                cropped = self.extract_region(image_path, bbox_pred.tolist())
                
            raw_text = self.run_tesseract(cropped)
            amount = self.extract_amount(raw_text)
            due_date = self.extract_due_date(raw_text)
            
            return {
                "amount": amount,
                "due_date": due_date,
                "confidence": 0.85, # placeholder for confidence score
                "raw_text": raw_text.strip()
            }
        except Exception as e:
            print(f"Error processing image: {e}")
            raise e

if __name__ == "__main__":
    print("Testing CNN OCR Pipeline standalone...")
    # Generate dummy image for testing
    dummy_img = Image.new('RGB', (800, 600), color=(255, 255, 255))
    dummy_path = "dummy_invoice.jpg"
    dummy_img.save(dummy_path)
    
    pipeline = InvoiceOCRPipeline()
    try:
        # Note: Tesseract must be installed on the system for this to fully execute
        res = pipeline.process_invoice_image(dummy_path)
        print(f"OCR Extraction Result: {res}")
    except Exception as e:
        print(f"Pipeline test encountered error (expected if tesseract missing): {e}")
        
    if os.path.exists(dummy_path):
        os.remove(dummy_path)
    print("CNN OCR Pipeline test complete.")
