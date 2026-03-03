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
        self.X = []
        self.Y = []
        
        # Create sliding windows
        for i in range(len(data) - seq_length - output_length):
            self.X.append(data[i:i+seq_length])
            self.Y.append(data[i+seq_length:i+seq_length+output_length])
            
        self.X = np.array(self.X, dtype=np.float32)
        self.Y = np.array(self.Y, dtype=np.float32)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        # Add feature dimension: [seq_len, 1]
        x_tensor = torch.tensor(self.X[idx]).unsqueeze(-1)
        y_tensor = torch.tensor(self.Y[idx])
        return x_tensor, y_tensor

class LSTMForecaster(nn.Module):
    """2-layer LSTM model for forecasting."""
    def __init__(self, input_size=1, hidden_size=128, num_layers=2, output_size=90, dropout=0.2):
        super(LSTMForecaster, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        return out

class CashFlowTrainer:
    """Trainer and evaluator for LSTM model."""
    def __init__(self, model, learning_rate=0.001):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = model.to(self.device)
        self.criterion = nn.MSELoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        # Track min/max for simple normalization
        self.data_min = 0
        self.data_max = 1

    def train(self, train_loader, num_epochs=100):
        self.model.train()
        for epoch in range(num_epochs):
            total_loss = 0
            for i, (sequences, labels) in enumerate(train_loader):
                sequences = sequences.to(self.device)
                labels = labels.to(self.device)
                
                # Forward pass
                outputs = self.model(sequences)
                loss = self.criterion(outputs, labels)
                
                # Backward and optimize
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                
                total_loss += loss.item()
                
            if (epoch + 1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {total_loss/len(train_loader):.4f}')

    def evaluate(self, test_loader) -> float:
        self.model.eval()
        total_loss = 0
        with torch.no_grad():
            for sequences, labels in test_loader:
                sequences, labels = sequences.to(self.device), labels.to(self.device)
                outputs = self.model(sequences)
                loss = self.criterion(outputs, labels)
                total_loss += loss.item()
        
        rmse = np.sqrt(total_loss / len(test_loader))
        print(f'Test RMSE: {rmse:.4f}')
        return float(rmse)

    def forecast(self, recent_30_days: list) -> dict:
        """Forecasts next 90 days given the last 30."""
        self.model.eval()
        # Normalize input
        recent_arr = np.array(recent_30_days)
        # Assuming model expects normalized data [0,1]
        rng = max(self.data_max - self.data_min, 1)
        norm_recent = (recent_arr - self.data_min) / rng
        
        x_tensor = torch.tensor(norm_recent, dtype=torch.float32).unsqueeze(0).unsqueeze(-1).to(self.device)
        
        with torch.no_grad():
            preds = self.model(x_tensor).cpu().numpy()[0]
            
        # Denormalize
        preds_actual = preds * rng + self.data_min
        
        # Add simple confidence bounds (growing over time)
        lower_bound = [p - (i*50) for i, p in enumerate(preds_actual)]
        upper_bound = [p + (i*50) for i, p in enumerate(preds_actual)]
        
        liquidity_warning = any(lb < 0 for lb in lower_bound)
        
        return {
            "forecast": preds_actual.tolist(),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "liquidity_warning": liquidity_warning
        }

    def save_model(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save(self.model.state_dict(), path)

    def load_model(self, path: str):
        self.model.load_state_dict(torch.load(path, map_location=self.device))
        self.model.eval()

    def plot_forecast(self, historical: np.ndarray, forecast: dict, output_path: str):
        plt.figure(figsize=(12, 6))
        
        hist_x = np.arange(-len(historical), 0)
        plt.plot(hist_x, historical, label='Historical', color='blue')
        
        pred_x = np.arange(0, len(forecast['forecast']))
        plt.plot(pred_x, forecast['forecast'], label='AI Forecast', color='orange', linestyle='--')
        
        plt.fill_between(pred_x, forecast['lower_bound'], forecast['upper_bound'], color='orange', alpha=0.2, label='Confidence Interval')
        
        # Highlight negative
        neg_indices = [i for i, v in enumerate(forecast['forecast']) if v < 0]
        if neg_indices:
            plt.scatter([pred_x[i] for i in neg_indices], [forecast['forecast'][i] for i in neg_indices], color='red', zorder=5, label='Negative Balance')
            
        plt.axhline(0, color='red', linestyle=':', alpha=0.5)
        plt.legend()
        plt.title('90-Day Cash Flow Forecast')
        plt.savefig(output_path)
        print(f"Plot saved to {output_path}")

if __name__ == "__main__":
    print("Testing LSTM Cash Flow Forecaster standalone...")
    # Simulated daily cash flow balances (trend up + noise)
    days = 400
    base = 10000
    mock_data = np.array([base + (i*50) + np.random.normal(0, 1000) for i in range(days)])
    
    # Simple MinMax
    d_min, d_max = mock_data.min(), mock_data.max()
    norm_data = (mock_data - d_min) / (d_max - d_min)
    
    dataset = CashFlowDataset(norm_data, seq_length=30, output_length=90)
    # Just take a little chunk to test network compilation and loop
    subset = torch.utils.data.Subset(dataset, range(10))
    loader = DataLoader(subset, batch_size=2)
    
    model = LSTMForecaster()
    trainer = CashFlowTrainer(model)
    trainer.data_min = d_min
    trainer.data_max = d_max
    
    print("Running short training test...")
    trainer.train(loader, num_epochs=2)
    
    recent_30 = mock_data[-30:]
    result = trainer.forecast(recent_30)
    print(f"Forecast shape: {len(result['forecast'])}, Liquidity Warning: {result['liquidity_warning']}")
    trainer.plot_forecast(recent_30, result, "test_forecast.png")
