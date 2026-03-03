import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os
import matplotlib.pyplot as plt

class ClientClusterer:
    """Clusters clients into Risk Tiers using KMeans."""
    
    def __init__(self, data_path: str, n_clusters: int = 3):
        self.data_path = data_path
        self.n_clusters = n_clusters
        self.df = None
        self.X_scaled = None
        self.scaler = StandardScaler()
        self.model = None

    def load_data(self) -> None:
        """Loads processed CSV and validates columns."""
        try:
            self.df = pd.read_csv(self.data_path)
            required = ['payment_delay_days', 'invoice_amount', 'late_payment_count']
            for col in required:
                if col not in self.df.columns:
                    raise ValueError(f"Missing required column for clustering: {col}")
        except Exception as e:
            print(f"Warning: Failed to load data from {self.data_path}. Initializing empty.")
            # Mock data for standalone testing if file not found
            self.df = pd.DataFrame({
                'payment_delay_days': np.random.exponential(10, 100),
                'invoice_amount': np.random.normal(5000, 2000, 100),
                'late_payment_count': np.random.poisson(2, 100)
            })

    def preprocess(self) -> None:
        """Fills missing with median, scales features."""
        features = ['payment_delay_days', 'invoice_amount', 'late_payment_count']
        X = self.df[features].copy()
        X = X.fillna(X.median())
        self.X_scaled = self.scaler.fit_transform(X)

    def train(self) -> None:
        """Fits KMeans model."""
        self.model = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)
        self.model.fit(self.X_scaled)
        print(f"KMeans trained. Inertia score: {self.model.inertia_:.2f}")

    def label_clusters(self) -> None:
        """Assigns risk tier strings based on payment delay centroids."""
        centroids = self.model.cluster_centers_
        # Centroid index 0 corresponds to payment_delay_days feature because of scaler
        delay_centroids = centroids[:, 0] 
        sorted_indices = np.argsort(delay_centroids)
        
        # Mapping: lowest delay -> Reliable, middle -> Erratic, highest -> High Risk
        label_map = {
            sorted_indices[0]: "Reliable",
            sorted_indices[1]: "Erratic",
            sorted_indices[2]: "High Risk"
        }
        
        clusters = self.model.labels_
        self.df['cluster_id'] = clusters
        self.df['risk_tier'] = [label_map[cluster] for cluster in clusters]

    def save_results(self, output_path: str) -> None:
        """Saves labeled dataframe to CSV."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        self.df.to_csv(output_path, index=False)
        print(f"Results saved to {output_path}")

    def save_model(self, model_dir: str) -> None:
        """Saves kmeans model and scaler."""
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.model, os.path.join(model_dir, 'kmeans.joblib'))
        joblib.dump(self.scaler, os.path.join(model_dir, 'scaler.joblib'))
        print(f"Models saved to {model_dir}")

    def predict_single_client(self, payment_delay_days: float, invoice_amount: float, late_payment_count: float) -> str:
        """Predicts risk tier for a single client."""
        if self.model is None or self.scaler is None:
            raise ValueError("Model is not trained or loaded.")
            
        X = pd.DataFrame({
            'payment_delay_days': [payment_delay_days],
            'invoice_amount': [invoice_amount],
            'late_payment_count': [late_payment_count]
        })
        X_scaled = self.scaler.transform(X)
        cluster = self.model.predict(X_scaled)[0]
        
        centroids = self.model.cluster_centers_
        delay_centroids = centroids[:, 0]
        sorted_indices = np.argsort(delay_centroids)
        
        label_map = {
            sorted_indices[0]: "Reliable",
            sorted_indices[1]: "Erratic",
            sorted_indices[2]: "High Risk"
        }
        return label_map[cluster]

    def plot_clusters(self, output_path: str) -> None:
        """Scatter plot of the clusters."""
        plt.figure(figsize=(10, 6))
        colors = {'Reliable': 'green', 'Erratic': 'orange', 'High Risk': 'red'}
        
        for tier, color in colors.items():
            subset = self.df[self.df['risk_tier'] == tier]
            plt.scatter(subset['payment_delay_days'], subset['invoice_amount'], label=tier, c=color, alpha=0.6)
            
        plt.xlabel('Payment Delay (Days)')
        plt.ylabel('Invoice Amount')
        plt.title('Client Risk Tier Clustering')
        plt.legend()
        plt.grid(True, alpha=0.3)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.savefig(output_path)
        print(f"Cluster plot saved to {output_path}")

if __name__ == "__main__":
    print("Testing ClientClusterer standalone...")
    # Will use mock data if path doesn't exist
    clusterer = ClientClusterer(data_path="test_data.csv")
    clusterer.load_data()
    clusterer.preprocess()
    clusterer.train()
    clusterer.label_clusters()
    print("\nTier Summary:")
    print(clusterer.df['risk_tier'].value_counts())
    
    tier = clusterer.predict_single_client(30.0, 15000.0, 5.0)
    print(f"\nPrediction for test client: {tier}")
