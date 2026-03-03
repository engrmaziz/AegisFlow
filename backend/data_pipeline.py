import pandas as pd
import numpy as np
import datetime
from supabase import create_client, Client
import os
from typing import Dict, Any

class DataIngestor:
    """Class to ingest and validate invoice data from CSV or Supabase."""
    
    def __init__(self, file_path: str = None):
        """Initialize DataIngestor with optional CSV file path."""
        self.file_path = file_path

    def load_csv(self) -> pd.DataFrame:
        """Loads CSV and validates required columns."""
        try:
            df = pd.read_csv(self.file_path)
        except Exception as e:
            raise IOError(f"Failed to load CSV at {self.file_path}: {e}")
            
        required_cols = ['client_id', 'invoice_amount', 'due_date', 'paid_date', 'issue_date', 'status']
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns in CSV: {missing}")
        return df

    def load_from_supabase(self, supabase_url: str, supabase_key: str, user_id: str) -> pd.DataFrame:
        """Connects to Supabase, fetches invoices for user_id, returns DataFrame."""
        try:
            supabase: Client = create_client(supabase_url, supabase_key)
            response = supabase.table('invoices').select('*').eq('user_id', user_id).execute()
            df = pd.DataFrame(response.data)
            return df
        except Exception as e:
            raise ConnectionError(f"Failed to fetch data from Supabase: {e}")

    def validate_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ensures correct data types for processing."""
        df['invoice_amount'] = pd.to_numeric(df.get('invoice_amount', df.get('amount')), errors='coerce')
        for date_col in ['due_date', 'paid_date', 'issue_date']:
            if date_col in df.columns:
                df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        if 'status' in df.columns:
            df['status'] = df['status'].astype(str)
        return df

    def log_summary(self, df: pd.DataFrame):
        """Prints summary statistics and info about the dataset."""
        print(f"Total Rows: {len(df)}")
        print("\nColumn Types:\n", df.dtypes)
        print("\nMissing Values Count:\n", df.isnull().sum())
        if 'issue_date' in df.columns:
            print(f"\nDate Range: {df['issue_date'].min()} to {df['issue_date'].max()}")


class PreProcessor:
    """Class to clean and prepare data for ML models."""
    
    def __init__(self, df: pd.DataFrame):
        """Initialize with a pandas DataFrame."""
        self.df = df.copy()

    def handle_missing_values(self) -> None:
        """Fills NaNs with median/mode, drops null amounts."""
        self.df = self.df.dropna(subset=['invoice_amount'])
        
        for col in self.df.select_dtypes(include=[np.number]).columns:
            self.df[col] = self.df[col].fillna(self.df[col].median())
            
        for col in self.df.select_dtypes(include=['object']).columns:
            self.df[col] = self.df[col].fillna(self.df[col].mode()[0] if not self.df[col].mode().empty else "Unknown")

    def engineer_features(self) -> None:
        """Engineers time-based and status-based features."""
        today = pd.to_datetime(datetime.date.today())
        
        # Payment delay (0 if paid early or un-paid but before due date)
        if 'paid_date' in self.df.columns and 'due_date' in self.df.columns:
            delay = (self.df['paid_date'] - self.df['due_date']).dt.days
            self.df['payment_delay_days'] = np.where(self.df['status'].str.lower() == 'paid', np.maximum(delay, 0), 0)
        else:
            self.df['payment_delay_days'] = 0

        self.df['is_late'] = (self.df['payment_delay_days'] > 0).astype(int)
        
        if 'issue_date' in self.df.columns:
            self.df['invoice_age_days'] = (today - self.df['issue_date']).dt.days
            
        if 'due_date' in self.df.columns:
            self.df['days_until_due'] = (self.df['due_date'] - today).dt.days

    def normalize_currency(self, target_currency: str = 'USD') -> None:
        """Normalizes invoice amounts to a target currency."""
        # Simple hardcoded conversion dict for demo purposes
        rates = {'EUR': 1.1, 'GBP': 1.25, 'USD': 1.0}
        
        if 'currency' in self.df.columns:
            self.df['invoice_amount'] = self.df.apply(
                lambda row: row['invoice_amount'] * rates.get(row['currency'], 1.0), axis=1
            )
            self.df['currency'] = target_currency

    def encode_categoricals(self) -> None:
        """Label encodes the status column and optionally one-hot encodes payment_method."""
        if 'status' in self.df.columns:
            status_map = {k: v for v, k in enumerate(self.df['status'].unique())}
            self.df['status_encoded'] = self.df['status'].map(status_map)
            
        if 'payment_method' in self.df.columns:
            self.df = pd.get_dummies(self.df, columns=['payment_method'], drop_first=True)

    def get_processed_df(self) -> pd.DataFrame:
        """Returns the final processed DataFrame."""
        return self.df

    def save_to_csv(self, output_path: str) -> None:
        """Saves the processed DataFrame to CSV."""
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            self.df.to_csv(output_path, index=False)
            print(f"Saved processed data to {output_path}")
        except Exception as e:
            print(f"Failed to save CSV to {output_path}: {e}")

if __name__ == "__main__":
    # Standalone testing block
    print("Testing Data Pipeline module standalone...")
    # Create simple mock data to test without external files
    mock_data = {
        'client_id': ['C1', 'C2', 'C1'],
        'invoice_amount': [1000, 2500, np.nan],
        'due_date': ['2023-01-15', '2023-02-01', '2023-03-01'],
        'paid_date': ['2023-01-20', '2023-01-28', np.nan],
        'issue_date': ['2023-01-01', '2023-01-15', '2023-02-15'],
        'status': ['paid', 'paid', 'pending'],
        'currency': ['USD', 'EUR', 'USD']
    }
    df = pd.DataFrame(mock_data)
    
    ingestor = DataIngestor()
    df_val = ingestor.validate_types(df)
    ingestor.log_summary(df_val)
    
    print("\nRunning PreProcessor...")
    processor = PreProcessor(df_val)
    processor.handle_missing_values()
    processor.engineer_features()
    processor.normalize_currency()
    processor.encode_categoricals()
    
    final_df = processor.get_processed_df()
    print("\nFinal Processed Data Head:")
    print(final_df.head())
    print("Data Pipeline test complete.")
