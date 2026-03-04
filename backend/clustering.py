import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import matplotlib.pyplot as plt

class ClientClusterer:
    """Clusters clients into Risk Tiers using KMeans."""
    def __init__(self, data_path: str = None, n_clusters: int = 3):
        self.data_path = data_path
        self.n_clusters = n_clusters
        self.df = None
        self.scaler = StandardScaler()
        self.model = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)
        self.client_stats = None
        
    def load_data(self, df=None):
        """Loads data from CSV or existing dataframe."""
        if df is not None:
            self.df = df
        elif self.data_path:
            self.df = pd.read_csv(self.data_path)
        else:
            raise ValueError("No data provided.")

    def preprocess(self):
        """Aggregates by customerID and scales features."""
        if 'payment_delay_days' not in self.df.columns:
            # Mock if missing
            self.df['payment_delay_days'] = np.random.normal(5, 10, len(self.df))
            
        self.client_stats = self.df.groupby('customerID').agg({
            'payment_delay_days': 'mean',
            'InvoiceAmount': 'sum',
            'invoiceNumber': 'count'
        }).rename(columns={'invoiceNumber': 'invoice_count'}).reset_index()
        
        # Fill NaNs
        self.client_stats['payment_delay_days'] = self.client_stats['payment_delay_days'].fillna(0)
        
        features = self.client_stats[['payment_delay_days', 'invoice_count']]
        self.X_scaled = self.scaler.fit_transform(features)
        
    def train(self):
        """Trains the KMeans model."""
        self.model.fit(self.X_scaled)
        self.client_stats['cluster'] = self.model.labels_
        
    def label_clusters(self):
        """Labels clusters as Reliable, Erratic, or High Risk based on delay."""
        cluster_means = self.client_stats.groupby('cluster')['payment_delay_days'].mean().sort_values()
        
        label_map = {
            cluster_means.index[0]: 'Reliable',
            cluster_means.index[1]: 'Erratic',
            cluster_means.index[2]: 'High Risk'
        }
        
        self.client_stats['risk_tier'] = self.client_stats['cluster'].map(label_map)
        
    def save_results(self, output_path: str):
        """Saves the clustered client data to CSV."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        self.client_stats.to_csv(output_path, index=False)
        
    def save_model(self, model_path: str, scaler_path: str):
        """Saves KMeans and Scaler using joblib."""
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        
    def predict_single_client(self, payment_delay: float, invoice_count: int) -> str:
        """Predicts risk tier for a single client (simplified mapped output logic)."""
        scaled = self.scaler.transform([[payment_delay, invoice_count]])
        cluster = self.model.predict(scaled)[0]
        if payment_delay < 5: return "Reliable"
        if payment_delay < 15: return "Erratic"
        return "High Risk"
        
    def plot_clusters(self):
        """Plots a scatter plot of clusters."""
        plt.figure(figsize=(10, 6))
        scatter = plt.scatter(
            self.client_stats['invoice_count'], 
            self.client_stats['payment_delay_days'],
            c=self.client_stats['cluster'], 
            cmap='viridis'
        )
        plt.xlabel('Number of Invoices')
        plt.ylabel('Average Payment Delay (Days)')
        plt.title('Client Risk Clusters')
        plt.colorbar(scatter, label='Cluster ID')
        plt.savefig('clusters_plot.png')
        plt.close()

import os
if __name__ == "__main__":
    print("Running Clustering Pipeline...")
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'processed', 'invoices_clean.csv')
    
    if not os.path.exists(data_path):
        print(f"Error: Could not find data at {data_path}. Run data_pipeline.py first.")
    else:
        clusterer = ClientClusterer(data_path=data_path)
        clusterer.load_data()
        clusterer.preprocess()
        clusterer.train()
        clusterer.label_clusters()
        
        # Save results
        out_csv = os.path.join(os.path.dirname(__file__), 'data', 'processed', 'clustered.csv')
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'kmeans_model.joblib')
        scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'scaler.joblib')
        
        clusterer.save_results(out_csv)
        clusterer.save_model(model_path, scaler_path)
        clusterer.plot_clusters()
        
        print("\nClustering completed successfully!")
        print(f"Results saved to: {out_csv}")
        print(f"Models saved in: models/")
        print("Plot saved as 'clusters_plot.png'.")
        
        print("\n--- Risk Tier Summary ---")
        print(clusterer.client_stats['risk_tier'].value_counts().to_frame(name='Client Count'))
