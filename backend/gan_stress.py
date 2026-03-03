import torch
import torch.nn as nn
import numpy as np
import os

class Generator(nn.Module):
    """GAN Generator to create simulated 30-day cash flow sequences."""
    def __init__(self, latent_dim=100, output_dim=30):
        super(Generator, self).__init__()
        
        def block(in_feat, out_feat, normalize=True):
            layers = [nn.Linear(in_feat, out_feat)]
            if normalize:
                layers.append(nn.BatchNorm1d(out_feat))
            layers.append(nn.LeakyReLU(0.2, inplace=True))
            return layers

        self.model = nn.Sequential(
            *block(latent_dim, 256, normalize=False),
            *block(256, 512),
            *block(512, 256),
            nn.Linear(256, output_dim),
            nn.Tanh() # Output normalized roughly [-1, 1]
        )

    def forward(self, z):
        return self.model(z)

class Discriminator(nn.Module):
    """GAN Discriminator to test realism of generated sequences."""
    def __init__(self, input_dim=30):
        super(Discriminator, self).__init__()
        
        self.model = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Dropout(0.3),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.model(x)

class GANTrainer:
    """Trainer and generator for Stress Test scenarios using GAN."""
    def __init__(self, generator, discriminator, lr=0.0002):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.G = generator.to(self.device)
        self.D = discriminator.to(self.device)
        
        self.criterion = nn.BCELoss()
        self.opt_G = torch.optim.Adam(self.G.parameters(), lr=lr, betas=(0.5, 0.999))
        self.opt_D = torch.optim.Adam(self.D.parameters(), lr=lr, betas=(0.5, 0.999))
        
        self.data_mean = 0
        self.data_std = 1

    def train(self, real_data: np.ndarray, num_epochs=500, batch_size=32):
        """Standard GAN training loop on historical sequences."""
        self.data_mean = np.mean(real_data)
        self.data_std = np.std(real_data)
        
        # Normalize real data and split into 30-day sequences
        normalized_data = (real_data - self.data_mean) / (self.data_std + 1e-8)
        
        # Prepare sliding windows of length 30
        sequences = []
        for i in range(len(normalized_data) - 30):
            sequences.append(normalized_data[i:i+30])
        
        if not sequences:
            print("Not enough data to train GAN.")
            return
            
        dataset = torch.tensor(sequences, dtype=torch.float32)
        dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        for epoch in range(num_epochs):
            for i, real_seqs in enumerate(dataloader):
                batch_size = real_seqs.size(0)
                real_seqs = real_seqs.to(self.device)
                
                valid = torch.ones(batch_size, 1, device=self.device)
                fake = torch.zeros(batch_size, 1, device=self.device)
                
                # --- Train Discriminator ---
                self.opt_D.zero_grad()
                
                # Real loss
                real_loss = self.criterion(self.D(real_seqs), valid)
                
                # Fake loss
                z = torch.randn(batch_size, 100, device=self.device)
                gen_seqs = self.G(z)
                fake_loss = self.criterion(self.D(gen_seqs.detach()), fake)
                
                d_loss = (real_loss + fake_loss) / 2
                d_loss.backward()
                self.opt_D.step()
                
                # --- Train Generator ---
                self.opt_G.zero_grad()
                g_loss = self.criterion(self.D(gen_seqs), valid)
                g_loss.backward()
                self.opt_G.step()
                
            if (epoch + 1) % 50 == 0:
                print(f"[Epoch {epoch+1}/{num_epochs}] D_Loss: {d_loss.item():.4f} G_Loss: {g_loss.item():.4f}")

    def generate_scenarios(self, current_balance: float = None, monthly_expenses: float = None, n_scenarios: int = 5) -> list:
        """Generates worst-case stress test scenarios."""
        self.G.eval()
        z = torch.randn(n_scenarios, 100, device=self.device)
        
        with torch.no_grad():
            gen_seqs = self.G(z).cpu().numpy()
            
        # Denormalize
        gen_seqs = (gen_seqs * self.data_std) + self.data_mean
        
        # Apply stress logic: force the generated pattern to simulate a significant drop 
        # based on current balance if provided, otherwise standard output
        scenarios = []
        base_start = current_balance if current_balance else 50000
        
        for i, seq in enumerate(gen_seqs):
            # Align seq start logic to base_start
            shift = base_start - seq[0]
            shifted_seq = seq + shift
            
            # Add synthetic stress (simulate sudden drops)
            stress_factor = np.random.uniform(0.1, 0.4) # drop by 10-40% per day
            stressed_seq = [shifted_seq[0]]
            for j in range(1, 30):
                drop = shifted_seq[j] - shifted_seq[j-1] - (monthly_expenses/30 if monthly_expenses else 1000)
                # Random huge drop for chaos
                if np.random.rand() < 0.1:
                    drop -= np.abs(stressed_seq[-1]) * stress_factor
                stressed_seq.append(stressed_seq[-1] + drop)
                
            min_val = min(stressed_seq)
            
            severity = "Mild"
            if min_val < -(base_start * 0.5):
                severity = "Catastrophic"
            elif min_val < -(base_start * 0.25):
                severity = "Severe"
                
            positive_days = sum(1 for v in stressed_seq if v > 0)
            survivability = int((positive_days / 30) * 100)
            
            scenarios.append({
                "scenario_id": f"GAN_{i}_{severity[0]}",
                "days": stressed_seq,
                "severity": severity,
                "survivability_score": survivability,
                "description": f"AI Generated {severity} Market Shock Event"
            })
            
        return scenarios

    def save_models(self, model_dir: str):
        os.makedirs(model_dir, exist_ok=True)
        torch.save(self.G.state_dict(), os.path.join(model_dir, 'gan_generator.pth'))
        torch.save(self.D.state_dict(), os.path.join(model_dir, 'gan_discriminator.pth'))

if __name__ == "__main__":
    print("Testing GAN Stress Tester standalone...")
    # Mock data
    mock_real = np.random.normal(5000, 1000, 200)
    
    G = Generator()
    D = Discriminator()
    trainer = GANTrainer(G, D)
    
    # Train short period just to test loop
    trainer.train(mock_real, num_epochs=2)
    
    scenarios = trainer.generate_scenarios(current_balance=25000, monthly_expenses=10000)
    for s in scenarios:
        print(f"Scenario: {s['scenario_id']} | Severity: {s['severity']} | Score: {s['survivability_score']}%")
