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

class InvoiceDefaultClassifier:
    """Supervised Model to predict the probability an invoice will default (>30 days)."""
    def __init__(self):
        self.svm_pipeline = make_pipeline(StandardScaler(), SVC(kernel='rbf', probability=True, random_state=42))
        self.dt_model = DecisionTreeClassifier(max_depth=5, random_state=42)
        self.X_train = self.X_test = self.y_train = self.y_test = None

    def load_and_split(self, df: pd.DataFrame):
        """Prepares binary classification target: will_default if payment_delay_days > 30."""
        df['will_default'] = (df['payment_delay_days'] > 30).astype(int)
        features = ['amount', 'invoice_age_days', 'client_avg_delay']
        
        X = df[features]
        y = df['will_default']
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
        print(classification_report(self.y_test, svm_preds))
        if len(np.unique(self.y_test)) > 1:
            print(f"ROC-AUC: {roc_auc_score(self.y_test, svm_probs):.4f}")

    def predict_default_probability(self, amount, age, avg_delay):
        """Returns isolated probability metric for an invoice."""
        return self.svm_pipeline.predict_proba([[amount, age, avg_delay]])[0][1]

    def save_models(self):
        """Exports .pkl model objects."""
        joblib.dump(self.svm_pipeline, 'svm_model.pkl')
        joblib.dump(self.dt_model, 'dt_model.pkl')

class PaymentDelayRegressor:
    """Regression Model predicting the EXACT continuous amount of latency in days."""
    def __init__(self):
        self.model = Ridge(alpha=1.0)
        self.X_train = self.X_test = self.y_train = self.y_test = None

    def load_and_split(self, df: pd.DataFrame):
        features = ['amount', 'invoice_age_days', 'client_avg_delay']
        X = df[features]
        y = df['payment_delay_days']
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    def train(self):
        self.model.fit(self.X_train, self.y_train)

    def predict_days_late(self, amount, age, avg_delay) -> int:
        """Outputs an integer representing predicted delay bounds (>= 0)."""
        pred = self.model.predict([[amount, age, avg_delay]])[0]
        return max(0, int(pred))

if __name__ == "__main__":
    print("Running Supervised Models Training...")
    # Synthesize data
    np.random.seed(42)
    n_samples = 200
    df = pd.DataFrame({
        'amount': np.random.uniform(100, 10000, n_samples),
        'invoice_age_days': np.random.randint(0, 90, n_samples),
        'client_avg_delay': np.random.normal(15, 20, n_samples),
    })
    # target depends on features
    df['payment_delay_days'] = df['client_avg_delay'] + (df['amount']/1000) + np.random.normal(0, 5, n_samples)
    
    clf = InvoiceDefaultClassifier()
    clf.load_and_split(df)
    clf.train_svm()
    clf.train_decision_tree()
    clf.evaluate()
    
    reg = PaymentDelayRegressor()
    reg.load_and_split(df)
    reg.train()
    print(f"Sample regression prediction: {reg.predict_days_late(5000, 45, 10)} days")
