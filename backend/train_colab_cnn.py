"""
Phase 6: Lightweight PyTorch CNN for Receipt Bounding Box Detection
Instructions for Google Colab:
1. Copy and paste this entire script into a single Colab cell, or upload it and run `python train_colab_cnn.py`.
2. Make sure you have GPU enabled in Colab (Runtime -> Change runtime type -> Hardware accelerator -> GPU).
"""

import os
import glob
import json
import zipfile
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image

# ==========================================
# 1. ENVIRONMENT & KAGGLE SETUP
# ==========================================
# ⚠️ WARNING: Never commit real API keys to version control.
# Kaggle typically expects KAGGLE_USERNAME and KAGGLE_KEY. 
# We are setting the token parameter you requested here:
os.environ['KAGGLE_API_TOKEN'] = 'KGAT_19be3c37001db435c21b33e062d50cda'

# Note: If the kaggle library complains about credentials, you may also need:
# os.environ['KAGGLE_USERNAME'] = 'your_kaggle_username'
# os.environ['KAGGLE_KEY'] = 'KGAT_19be3c37001db435c21b33e062d50cda'

def download_dataset():
    print("Downloading Kaggle Dataset...")
    # Import kaggle here so it picks up the os.environ variables set above
    import kaggle
    kaggle.api.dataset_download_files(
        'sushmithanarayan/expenses-receipt-ocr', 
        path='./receipt_data', 
        unzip=True
    )
    print("Download and extraction complete.")

# ==========================================
# 2. DATASET DEFINITION
# ==========================================
class ReceiptBBoxDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        """
        A custom Dataset to load images and their bounding box annotations.
        Note: You will likely need to adjust the annotation parsing logic based on 
        the exact format (JSON, CSV, YOLO txt) provided by the Kaggle dataset.
        """
        self.data_dir = data_dir
        self.transform = transform
        self.image_paths = glob.glob(os.path.join(data_dir, '**', '*.jpg'), recursive=True)
        # Fallback if pngs are used
        if not self.image_paths:
            self.image_paths = glob.glob(os.path.join(data_dir, '**', '*.png'), recursive=True)
            
        print(f"Found {len(self.image_paths)} images.")

    def __len__(self):
        return len(self.image_paths)

    def _get_mock_annotation(self, img_path):
        # ⚠️ This is a placeholder parser. 
        # Replace this with code that actually reads the dataset's annotations.
        # Returning a normalized dummy bounding box: [x_min, y_min, x_max, y_max] between 0 and 1.
        return torch.tensor([0.1, 0.1, 0.9, 0.9], dtype=torch.float32)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert("RGB")
        
        # Parse Real Bounding Box
        bbox = self._get_mock_annotation(img_path)
        
        if self.transform:
            image = self.transform(image)
            
        return image, bbox

# ==========================================
# 3. LIGHTWEIGHT CNN MODEL
# ==========================================
class LightweightBBoxCNN(nn.Module):
    def __init__(self):
        super(LightweightBBoxCNN, self).__init__()
        # Using MobileNetV2 as a lightweight backbone
        # We use weights=models.MobileNet_V2_Weights.DEFAULT instead of pretrained=True (deprecated)
        self.backbone = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT).features
        
        # Freeze backbone weights if you only want to train the regression head quickly
        for param in self.backbone.parameters():
            param.requires_grad = False
            
        self.regressor = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(1280, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 4), # Output: 4 coordinates (x_min, y_min, x_max, y_max)
            nn.Sigmoid()       # Sigmoid forces output between 0 and 1 (normalized coordinates)
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.regressor(features)

# ==========================================
# 4. TRAINING LOOP
# ==========================================
def run_training():
    # Hyperparameters
    BATCH_SIZE = 16
    EPOCHS = 5
    LEARNING_RATE = 0.001
    IMAGE_SIZE = 224

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    # Step A: Download Data
    # download_dataset() # Un-comment to actually download the data in Colab

    # Step B: Prepare Data
    transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # NOTE: Change './receipt_data' to wherever the images are extracted
    dataset = ReceiptBBoxDataset(data_dir='./receipt_data', transform=transform)
    
    # Check if dataset has items before proceeding (to prevent crashing with dummy paths)
    if len(dataset) == 0:
        print("Warning: No images found. Creating a tiny mock dataset in memory for demonstration.")
        # Create a tiny mock DataLoader if no real images are found
        X_mock = torch.randn(10, 3, IMAGE_SIZE, IMAGE_SIZE)
        y_mock = torch.rand(10, 4)
        mock_data = torch.utils.data.TensorDataset(X_mock, y_mock)
        dataloader = DataLoader(mock_data, batch_size=2, shuffle=True)
    else:
        dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    # Step C: Initialize Model, Loss, Optimizer
    model = LightweightBBoxCNN().to(device)
    criterion = nn.MSELoss() # Mean Squared Error is standard for Bounding Box Regression
    optimizer = optim.Adam(model.regressor.parameters(), lr=LEARNING_RATE)

    # Step D: Training Loop
    print("\nStarting Training...")
    model.train()
    for epoch in range(EPOCHS):
        epoch_loss = 0.0
        for batch_idx, (images, bboxes) in enumerate(dataloader):
            images, bboxes = images.to(device), bboxes.to(device)

            # Forward pass
            predictions = model(images)
            loss = criterion(predictions, bboxes)

            # Backward pass & optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(dataloader)
        print(f"Epoch [{epoch+1}/{EPOCHS}] - Average Loss: {avg_loss:.4f}")

    # ==========================================
    # 5. SAVE MODEL
    # ==========================================
    save_path = 'model.pth'
    torch.save(model.state_dict(), save_path)
    print(f"\nTraining Complete! Model saved successfully to {save_path}")

if __name__ == "__main__":
    # In Colab, the environment might not have kaggle installed by default.
    # You may need to run: !pip install kaggle
    run_training()
