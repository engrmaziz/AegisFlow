import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import numpy as np
import matplotlib.pyplot as plt
import os

class CashFlowDataset(Dataset):
    """Dataset for sequence to sequence mapping (past 30 days -> next 90 days)."""
    def __init__(self, data: np.ndarray, seq_length: int = 30, output_length: int = 90):
        self.seq_length = seq_length
        self.output_length = output_length
        
        # Normalize data
        self.mean = np.mean(data)
        self.std = np.std(data)
        self.data_norm = (data - self.mean) / (self.std + 1e-8)
        
        self.X = []
        self.Y = []
        
        # Create sliding windows
        for i in range(len(self.data_norm) - seq_length - output_length):
            self.X.append(self.data_norm[i:i+seq_length])
            self.Y.append(self.data_norm[i+seq_length:i+seq_length+output_length])
            
        self.X = torch.FloatTensor(np.array(self.X)).unsqueeze(2) # (N, seq, 1)
        self.Y = torch.FloatTensor(np.array(self.Y)) # (N, out)

    def __len__(self):
        return len(self.X)
        
    def __getitem__(self, idx):
        return self.X[idx], self.Y[idx]

class LSTMForecaster(nn.Module):
    def __init__(self, input_size=1, hidden_size=128, num_layers=2, output_size=90):
        super(LSTMForecaster, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        out, _ = self.lstm(x, (h0, c0))
        # Take the output from the last time step
        out = self.fc(out[:, -1, :])
        return out

class CashFlowTrainer:
    def __init__(self, model, dataset, learning_rate=0.001):
        self.model = model
        self.dataset = dataset
        self.criterion = nn.MSELoss()
        self.optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
        
    def train(self, epochs: int = 50, batch_size: int = 16):
        dataloader = DataLoader(self.dataset, batch_size=batch_size, shuffle=True)
        
        for epoch in range(epochs):
            epoch_loss = 0
            for seqs, targets in dataloader:
                self.optimizer.zero_grad()
                outputs = self.model(seqs)
                loss = self.criterion(outputs, targets)
                loss.backward()
                self.optimizer.step()
                epoch_loss += loss.item()
                
            if (epoch + 1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {epoch_loss/len(dataloader):.4f}')
                
    def evaluate(self):
        self.model.eval()
        with torch.no_grad():
            outputs = self.model(self.dataset.X)
            mse = self.criterion(outputs, self.dataset.Y)
            rmse = torch.sqrt(mse)
            print(f'Evaluation RMSE: {rmse.item():.4f}')
            return rmse.item()
            
    def forecast(self, recent_data: np.ndarray):
        """Returns dict with forecast format."""
        self.model.eval()
        
        # Prepare input
        recent_norm = (recent_data - self.dataset.mean) / (self.dataset.std + 1e-8)
        seq = torch.FloatTensor(recent_norm).unsqueeze(0).unsqueeze(2) # (1, 30, 1)
        
        with torch.no_grad():
            pred_norm = self.model(seq).squeeze().numpy()
            
        # Denormalize
        pred = (pred_norm * self.dataset.std) + self.dataset.mean
        
        # Bound logic
        lower = pred - (self.dataset.std * 0.5)
        upper = pred + (self.dataset.std * 0.5)
        
        return {
            "forecast": pred.tolist(),
            "lower_bound": lower.tolist(),
            "upper_bound": upper.tolist(),
            "liquidity_warning": min(lower) < 0,
            "projected_30_day": float(pred[29]) if len(pred) > 29 else 0,
            "projected_60_day": float(pred[59]) if len(pred) > 59 else 0,
            "projected_90_day": float(pred[89]) if len(pred) > 89 else 0
        }
        
    def save_model(self, path: str):
        # We also need to save mean/std to scale properly during inference
        checkpoint = {
            'state_dict': self.model.state_dict(),
            'mean': self.dataset.mean,
            'std': self.dataset.std
        }
        torch.save(checkpoint, path)

    def load_model(self, path: str):
        if os.path.exists(path):
            checkpoint = torch.load(path)
            self.model.load_state_dict(checkpoint['state_dict'])
            self.dataset.mean = checkpoint['mean']
            self.dataset.std = checkpoint['std']
            
    def plot_forecast(self, recent_data, forecast_data):
        plt.figure(figsize=(12, 6))
        
        past_x = range(-len(recent_data), 0)
        future_x = range(0, len(forecast_data['forecast']))
        
        plt.plot(past_x, recent_data, label='Recent 30 Days', color='blue')
        plt.plot(future_x, forecast_data['forecast'], label='90-Day Forecast', color='green')
        plt.fill_between(future_x, forecast_data['lower_bound'], forecast_data['upper_bound'], color='green', alpha=0.2, label='Confidence Band')
        
        plt.axhline(0, color='red', linestyle='--', label='Zero Liquidity Line')
        plt.title('LSTM Cash Flow Forecast')
        plt.legend()
        plt.savefig('cashflow_forecast.png')
        plt.close()

import pandas as pd

if __name__ == "__main__":
    print("Running LSTM Forecast Training on Real Data...")
    
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'processed', 'invoices_clean.csv')
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    
    if not os.path.exists(data_path):
        print(f"Error: Could not find {data_path}. Run data_pipeline.py first.")
    else:
        df = pd.read_csv(data_path)
        
        # We need a continuous time-series of amounts. 
        # Using InvoiceDate and summing InvoiceAmount per day to simulate daily cash inflow/outflow
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
        daily_amounts = df.groupby('InvoiceDate')['InvoiceAmount'].sum().sort_index()
        
        # Resample to fill any missing days with 0
        daily_amounts = daily_amounts.resample('D').sum().fillna(0)
        data = daily_amounts.values[-130:] # Train on latest 130 days for very fast CPU performance
        
        print(f"Loaded continuous daily cashflow series with {len(data)} days.")
        
        dataset = CashFlowDataset(data, seq_length=30, output_length=90)
        model = LSTMForecaster(input_size=1, hidden_size=128, num_layers=2, output_size=90)
        trainer = CashFlowTrainer(model, dataset, learning_rate=0.001)
        
        trainer.train(epochs=100)
        trainer.evaluate()
        
        # Save model
        os.makedirs(models_dir, exist_ok=True)
        model_save_path = os.path.join(models_dir, 'lstm_cashflow.pt')
        trainer.save_model(model_save_path)
        print(f"Model saved successfully to: {model_save_path}")
        
        # Sample forecast
        recent_30 = data[-30:]
        f_data = trainer.forecast(recent_30)
        
        print("\n--- 90-Day Sample Forecast ---")
        print(f"Projected 30-Day: ${f_data['projected_30_day']:.2f}")
        print(f"Projected 60-Day: ${f_data['projected_60_day']:.2f}")
        print(f"Projected 90-Day: ${f_data['projected_90_day']:.2f}")
        print(f"Liquidity Warning: {f_data['liquidity_warning']}")
        
        trainer.plot_forecast(recent_30, f_data)
        print("\nTraining and forecasting complete. Chart saved as 'cashflow_forecast.png'.")
