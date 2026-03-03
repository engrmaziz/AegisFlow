import pandas as pd
import numpy as np
from datetime import datetime
import os

class DataIngestor:
    """Handles loading and validating raw invoice data."""
    def __init__(self, source: str):
        self.source = source
        
    def load_csv(self) -> pd.DataFrame:
        """Load from CSV."""
        try:
            df = pd.read_csv(self.source)
            return df
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return pd.DataFrame()
            
    def validate_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ensure correct data types for core columns."""
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        if 'issue_date' in df.columns:
            df['issue_date'] = pd.to_datetime(df['issue_date'], errors='coerce')
        if 'due_date' in df.columns:
            df['due_date'] = pd.to_datetime(df['due_date'], errors='coerce')
        if 'paid_date' in df.columns:
            df['paid_date'] = pd.to_datetime(df['paid_date'], errors='coerce')
        return df
        
    def log_summary(self, df: pd.DataFrame):
        """Log dataset statistics."""
        print(f"Dataset loaded with {len(df)} rows and {len(df.columns)} columns.")
        
    def load_from_supabase(self):
        """Placeholder for Supabase connection & data fetching."""
        pass

class PreProcessor:
    """Handles data cleaning and precise feature engineering for Invoice ML context."""
    def __init__(self, df: pd.DataFrame):
        self.df = df
        
    def handle_missing_values(self) -> pd.DataFrame:
        """Drops completely malformed rows and fills reasonable defaults."""
        self.df = self.df.dropna(subset=['amount', 'due_date'])
        return self.df
        
    def engineer_features(self) -> pd.DataFrame:
        """Creates AI features like payment delay days, invoice age, and days until due."""
        now = pd.to_datetime('today')
        
        if 'paid_date' in self.df.columns and 'due_date' in self.df.columns:
            self.df['payment_delay_days'] = (self.df['paid_date'] - self.df['due_date']).dt.days
            self.df['is_late'] = (self.df['payment_delay_days'] > 0).astype(int)
            
        if 'issue_date' in self.df.columns:
            self.df['invoice_age_days'] = (now - self.df['issue_date']).dt.days
            
        if 'due_date' in self.df.columns:
            self.df['days_until_due'] = (self.df['due_date'] - now).dt.days
            
        return self.df
        
    def normalize_currency(self) -> pd.DataFrame:
        """Ensures floating-point integrity across varied inputs."""
        self.df['amount'] = self.df['amount'].round(2)
        return self.df
        
    def encode_categoricals(self) -> pd.DataFrame:
        """Converts strings like 'Paid', 'Pending' into binary columns."""
        if 'status' in self.df.columns:
            self.df = pd.get_dummies(self.df, columns=['status'], dummy_na=False)
        return self.df
        
    def get_processed_df(self) -> pd.DataFrame:
        """Returns internal state data."""
        return self.df
        
    def save_to_csv(self, path: str):
        """Dumps prepared dataframe to disk."""
        self.df.to_csv(path, index=False)
        print(f"Saved processed data to {path}")

if __name__ == "__main__":
    print("Running data pipeline on synthetic data...")
    fake_data = {
        'id': range(1, 21),
        'client_id': np.random.randint(1, 5, 20),
        'amount': np.random.uniform(100, 5000, 20),
        'issue_date': [pd.to_datetime('today') - pd.Timedelta(days=np.random.randint(10, 100)) for _ in range(20)],
        'due_date': [pd.to_datetime('today') + pd.Timedelta(days=np.random.randint(-20, 30)) for _ in range(20)],
        'paid_date': [pd.to_datetime('today') if np.random.rand() > 0.3 else pd.NaT for _ in range(20)],
        'status': ['Paid', 'Pending', 'Overdue'] * 6 + ['Paid', 'Pending']
    }
    df = pd.DataFrame(fake_data)
    
    preprocessor = PreProcessor(df)
    preprocessor.handle_missing_values()
    preprocessor.engineer_features()
    preprocessor.normalize_currency()
    preprocessor.encode_categoricals()
    processed_df = preprocessor.get_processed_df()
    
    print("\nProcessed DataFrame Sample:")
    print(processed_df.head())
