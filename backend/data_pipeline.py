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
        if 'InvoiceAmount' in df.columns:
            df['InvoiceAmount'] = pd.to_numeric(df['InvoiceAmount'], errors='coerce')
        if 'InvoiceDate' in df.columns:
            df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        if 'DueDate' in df.columns:
            df['DueDate'] = pd.to_datetime(df['DueDate'], errors='coerce')
        if 'SettledDate' in df.columns:
            df['SettledDate'] = pd.to_datetime(df['SettledDate'], errors='coerce')
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
        self.df = self.df.dropna(subset=['InvoiceAmount', 'DueDate'])
        return self.df
        
    def engineer_features(self) -> pd.DataFrame:
        """Creates AI features like payment delay days, invoice age, and days until due."""
        now = pd.to_datetime('today')
        
        if 'SettledDate' in self.df.columns and 'DueDate' in self.df.columns:
            self.df['payment_delay_days'] = (self.df['SettledDate'] - self.df['DueDate']).dt.days
            self.df['is_late'] = (self.df['payment_delay_days'] > 0).astype(int)
            
        if 'InvoiceDate' in self.df.columns:
            self.df['invoice_age_days'] = (now - self.df['InvoiceDate']).dt.days
            
        if 'DueDate' in self.df.columns:
            self.df['days_until_due'] = (self.df['DueDate'] - now).dt.days
            
        return self.df
        
    def normalize_currency(self) -> pd.DataFrame:
        """Ensures floating-point integrity across varied inputs."""
        if 'InvoiceAmount' in self.df.columns:
            self.df['InvoiceAmount'] = self.df['InvoiceAmount'].round(2)
        return self.df
        
    def encode_categoricals(self) -> pd.DataFrame:
        """Converts strings like 'Paid', 'Pending' into binary columns."""
        if 'PaperlessBill' in self.df.columns:
            self.df = pd.get_dummies(self.df, columns=['PaperlessBill'], dummy_na=False)
        if 'Disputed' in self.df.columns:
            self.df['Disputed'] = self.df['Disputed'].map({'Yes': 1, 'No': 0}).fillna(0)
        return self.df
        
    def get_processed_df(self) -> pd.DataFrame:
        """Returns internal state data."""
        return self.df
        
    def save_to_csv(self, path: str):
        """Dumps prepared dataframe to disk."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.df.to_csv(path, index=False)
        print(f"Saved processed data to {path}")

if __name__ == "__main__":
    print("Running data pipeline on raw data...")
    raw_path = os.path.join(os.path.dirname(__file__), 'data', 'raw', 'invoices.csv')
    processed_path = os.path.join(os.path.dirname(__file__), 'data', 'processed', 'invoices_clean.csv')
    
    if not os.path.exists(raw_path):
        print(f"Error: Could not find raw data at {raw_path}")
    else:
        ingestor = DataIngestor(raw_path)
        df = ingestor.load_csv()
        df = ingestor.validate_types(df)
        ingestor.log_summary(df)
        
        preprocessor = PreProcessor(df)
        preprocessor.handle_missing_values()
        preprocessor.engineer_features()
        preprocessor.normalize_currency()
        preprocessor.encode_categoricals()
        
        processed_df = preprocessor.get_processed_df()
        
        print("\nProcessed DataFrame Sample:")
        print(processed_df.head())
        
        preprocessor.save_to_csv(processed_path)
