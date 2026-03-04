import pandas as pd
import numpy as np
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os

class InvoiceDefaultClassifier:
    """Supervised Model to predict the probability an invoice will default / be late."""
    def __init__(self):
        self.svm_pipeline = make_pipeline(StandardScaler(), SVC(kernel='rbf', probability=True, random_state=42))
        self.dt_model = DecisionTreeClassifier(max_depth=5, random_state=42)
        self.X_train = self.X_test = self.y_train = self.y_test = None

    def load_and_split(self, df: pd.DataFrame):
        """Prepares binary classification target: 1 = late payment and 0 = on time."""
        features = ['InvoiceAmount', 'invoice_age_days', 'days_until_due']
        
        X = df[features].fillna(0)
        
        if 'is_late' in df.columns:
            y = df['is_late']
        else:
            y = (df['payment_delay_days'] > 0).astype(int)
            
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    def train_svm(self):
        """Trains SVM with StandardScaler."""
        self.svm_pipeline.fit(self.X_train, self.y_train)

    def train_decision_tree(self):
        """Trains basic Decision Tree."""
        self.dt_model.fit(self.X_train, self.y_train)

    def evaluate(self):
        """Evaluates SVM classification reports & ROC-AUC."""
        svm_preds = self.svm_pipeline.predict(self.X_test)
        svm_probs = self.svm_pipeline.predict_proba(self.X_test)[:, 1]
        
        print("--- SVM Evaluation ---")
        print(classification_report(self.y_test, svm_preds, zero_division=0))
        if len(np.unique(self.y_test)) > 1:
            print(f"ROC-AUC: {roc_auc_score(self.y_test, svm_probs):.4f}")

    def predict_default_probability(self, amount, age, days_until_due):
        """Returns isolated probability metric for an invoice."""
        return self.svm_pipeline.predict_proba([[amount, age, days_until_due]])[0][1]

    def save_models(self, models_dir='models'):
        """Exports .joblib model objects."""
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(self.svm_pipeline, os.path.join(models_dir, 'svm_model.joblib'))
        joblib.dump(self.dt_model, os.path.join(models_dir, 'dt_model.joblib'))

class PaymentDelayRegressor:
    """Regression Model predicting the EXACT continuous amount of latency in days."""
    def __init__(self):
        self.model = Ridge(alpha=1.0)
        self.X_train = self.X_test = self.y_train = self.y_test = None

    def load_and_split(self, df: pd.DataFrame):
        features = ['InvoiceAmount', 'invoice_age_days', 'days_until_due']
        X = df[features].fillna(0)
        y = df['payment_delay_days'].fillna(0)
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    def train(self):
        self.model.fit(self.X_train, self.y_train)

    def predict_days_late(self, amount, age, days_until_due) -> int:
        """Outputs an integer representing predicted delay bounds (>= 0)."""
        pred = self.model.predict([[amount, age, days_until_due]])[0]
        return max(0, int(pred))
        
    def save_models(self, models_dir='models'):
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(self.model, os.path.join(models_dir, 'ridge_model.joblib'))

if __name__ == "__main__":
    print("Running Supervised Models Training...")
    
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'processed', 'invoices_clean.csv')
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    
    if not os.path.exists(data_path):
        print(f"Error: Could not find {data_path}")
    else:
        df = pd.read_csv(data_path)
        
        print("\n--- Training InvoiceDefaultClassifier ---")
        clf = InvoiceDefaultClassifier()
        clf.load_and_split(df)
        clf.train_svm()
        clf.train_decision_tree()
        clf.evaluate()
        clf.save_models(models_dir)
        
        print("\n--- Training PaymentDelayRegressor ---")
        reg = PaymentDelayRegressor()
        reg.load_and_split(df)
        reg.train()
        print(f"Sample regression prediction: {reg.predict_days_late(5000, 45, 10)} days late")
        reg.save_models(models_dir)
        
        print(f"\nAll models saved successfully to: {models_dir}")
