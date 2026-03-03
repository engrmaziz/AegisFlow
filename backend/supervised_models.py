import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import Ridge
from sklearn.metrics import classification_report, roc_auc_score, mean_squared_error, r2_score

class InvoiceDefaultClassifier:
    """Supervised models to predict probability of invoice default."""
    
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.svm_model = None
        self.dt_model = None
        self.X_train = self.X_test = self.y_train = self.y_test = None
        
    def load_and_split(self) -> None:
        """Loads data and splits into train/test."""
        try:
            df = pd.read_csv(self.data_path)
        except Exception:
            print("Warning: Failed to load. Using mock data for InvoiceDefaultClassifier.")
            df = pd.DataFrame({
                'invoice_amount': np.random.normal(5000, 2000, 200),
                'invoice_age_days': np.random.uniform(10, 60, 200),
                'days_until_due': np.random.uniform(-30, 30, 200),
                'late_payment_count': np.random.poisson(1, 200),
                'avg_client_delay': np.random.exponential(10, 200),
                'payment_delay_days': np.random.exponential(20, 200)
            })
            
        df['will_default'] = (df['payment_delay_days'] > 30).astype(int)
        
        features = ['invoice_amount', 'invoice_age_days', 'days_until_due', 'late_payment_count', 'avg_client_delay']
        
        # Fill NA, though preprocessing should have done this
        X = df[features].fillna(0)
        y = df['will_default']
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
    def train_svm(self) -> None:
        """Trains an SVM with RBF kernel."""
        self.svm_model = SVC(kernel='rbf', probability=True, random_state=42)
        self.svm_model.fit(self.X_train, self.y_train)
        print("SVM training completed.")
        
    def train_decision_tree(self) -> None:
        """Trains a Decision Tree."""
        self.dt_model = DecisionTreeClassifier(max_depth=5, random_state=42)
        self.dt_model.fit(self.X_train, self.y_train)
        print("Decision Tree training completed.")
        
    def evaluate(self) -> None:
        """Evaluates both models."""
        for name, model in [("SVM", self.svm_model), ("Decision Tree", self.dt_model)]:
            if model is None:
                continue
            preds = model.predict(self.X_test)
            probs = model.predict_proba(self.X_test)[:, 1]
            print(f"\n--- {name} Evaluation ---")
            print(classification_report(self.y_test, preds, zero_division=0))
            try:
                print(f"ROC-AUC: {roc_auc_score(self.y_test, probs):.4f}")
            except Exception as e:
                print(f"ROC-AUC formatting error: {e}")

    def predict_default_probability(self, invoice_features: dict) -> float:
        """Uses SVM to predict default probability."""
        if self.svm_model is None:
            raise ValueError("SVM model not trained.")
        X = pd.DataFrame([invoice_features])
        return self.svm_model.predict_proba(X)[0][1]

    def save_models(self, model_dir: str) -> None:
        """Saves models using joblib."""
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.svm_model, os.path.join(model_dir, 'svm.joblib'))
        joblib.dump(self.dt_model, os.path.join(model_dir, 'decision_tree.joblib'))
        print(f"Classifier models saved to {model_dir}")


class PaymentDelayRegressor:
    """Predicts the continuous number of days an invoice will be late."""
    
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.ridge_model = None
        self.X_train = self.X_test = self.y_train = self.y_test = None
        
    def load_and_split(self) -> None:
        """Loads data and splits into train/test."""
        try:
            df = pd.read_csv(self.data_path)
        except Exception:
            print("Warning: Failed to load. Using mock data for PaymentDelayRegressor.")
            df = pd.DataFrame({
                'invoice_amount': np.random.normal(5000, 2000, 200),
                'invoice_age_days': np.random.uniform(10, 60, 200),
                'days_until_due': np.random.uniform(-30, 30, 200),
                'late_payment_count': np.random.poisson(1, 200),
                'avg_client_delay': np.random.exponential(10, 200),
                'payment_delay_days': np.random.exponential(20, 200)
            })
            
        features = ['invoice_amount', 'invoice_age_days', 'days_until_due', 'late_payment_count', 'avg_client_delay']
        X = df[features].fillna(0)
        y = df['payment_delay_days']
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    def train_ridge(self) -> None:
        """Trains Ridge regression model."""
        self.ridge_model = Ridge(alpha=1.0, random_state=42)
        self.ridge_model.fit(self.X_train, self.y_train)
        print("Ridge training completed.")

    def evaluate(self) -> None:
        """Evaluates model using RMSE and R2."""
        if self.ridge_model is None:
            return
        preds = self.ridge_model.predict(self.X_test)
        rmse = np.sqrt(mean_squared_error(self.y_test, preds))
        r2 = r2_score(self.y_test, preds)
        print("\n--- Ridge Regressor Evaluation ---")
        print(f"RMSE: {rmse:.2f} days")
        print(f"R² Score: {r2:.4f}")

    def predict_days_late(self, invoice_features: dict) -> int:
        """Predicts days late (minimum 0)."""
        if self.ridge_model is None:
            raise ValueError("Ridge model not trained.")
        X = pd.DataFrame([invoice_features])
        pred = self.ridge_model.predict(X)[0]
        return max(0, int(round(pred)))

    def save_model(self, model_dir: str) -> None:
        """Saves regression model."""
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.ridge_model, os.path.join(model_dir, 'ridge.joblib'))
        print(f"Regressor model saved to {model_dir}")


if __name__ == "__main__":
    print("Testing Supervised Models standalone...")
    
    clf = InvoiceDefaultClassifier("test_data.csv")
    clf.load_and_split()
    clf.train_svm()
    clf.train_decision_tree()
    clf.evaluate()
    clf.save_models("models")
    
    print("-" * 30)
    
    reg = PaymentDelayRegressor("test_data.csv")
    reg.load_and_split()
    reg.train_ridge()
    reg.evaluate()
    reg.save_model("models")
    
    sample_invoice = {
        'invoice_amount': 7500.0,
        'invoice_age_days': 45.0,
        'days_until_due': -15.0,  # 15 days past due
        'late_payment_count': 3,
        'avg_client_delay': 14.5
    }
    
    prob = clf.predict_default_probability(sample_invoice)
    days = reg.predict_days_late(sample_invoice)
    print(f"\nSample Prediction - Default Prob: {prob:.2f}, Days Late: {days}")
