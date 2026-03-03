import numpy as np

def initialize_parameters(layer_dims: list) -> dict:
    """Initializes weights with He initialization and biases to zero."""
    np.random.seed(42)
    parameters = {}
    L = len(layer_dims)
    
    for l in range(1, L):
        parameters[f'W{l}'] = np.random.randn(layer_dims[l], layer_dims[l-1]) * np.sqrt(2 / layer_dims[l-1])
        parameters[f'b{l}'] = np.zeros((layer_dims[l], 1))
        
    return parameters

def relu(Z: np.ndarray) -> np.ndarray:
    """ReLU activation."""
    return np.maximum(0, Z)

def relu_backward(dA: np.ndarray, Z: np.ndarray) -> np.ndarray:
    """Backward pass for ReLU."""
    dZ = np.array(dA, copy=True)
    dZ[Z <= 0] = 0
    return dZ

def sigmoid(Z: np.ndarray) -> np.ndarray:
    """Sigmoid activation."""
    return 1 / (1 + np.exp(-Z))

def sigmoid_backward(dA: np.ndarray, Z: np.ndarray) -> np.ndarray:
    """Backward pass for Sigmoid."""
    s = sigmoid(Z)
    dZ = dA * s * (1 - s)
    return dZ

def forward_propagation(X: np.ndarray, parameters: dict) -> tuple:
    """Performs forward pass for a 2-layer NN: Linear -> ReLU -> Linear -> Sigmoid."""
    caches = {}
    
    W1 = parameters['W1']
    b1 = parameters['b1']
    W2 = parameters['W2']
    b2 = parameters['b2']
    
    # Layer 1: Z1 = W1·X + b1
    Z1 = np.dot(W1, X) + b1
    # Layer 1: A1 = relu(Z1)
    A1 = relu(Z1)
    
    # Layer 2: Z2 = W2·A1 + b2
    Z2 = np.dot(W2, A1) + b2
    # Layer 2: A2 = sigmoid(Z2)
    A2 = sigmoid(Z2)
    
    caches = (Z1, A1, Z2, A2)
    
    return A2, caches

def compute_loss(AL: np.ndarray, Y: np.ndarray) -> float:
    """Computes Binary Cross Entropy Loss."""
    m = Y.shape[1]
    
    # L = -1/m * Σ(Y*log(AL) + (1-Y)*log(1-AL))
    # Add epsilon to prevent log(0)
    epsilon = 1e-15
    AL = np.clip(AL, epsilon, 1 - epsilon)
    cost = -1/m * np.sum(Y * np.log(AL) + (1 - Y) * np.log(1 - AL))
    
    cost = np.squeeze(cost)
    return float(cost)

def backward_propagation(AL: np.ndarray, Y: np.ndarray, caches: tuple, parameters: dict) -> dict:
    """Performs backward propagation."""
    m = Y.shape[1]
    Z1, A1, Z2, A2 = caches
    
    W2 = parameters['W2']
    
    # ---- Layer 2 (Output) ----
    
    # Gradient of Loss w.r.t A2: dL/dA2
    # dL/dA2 = -(Y/AL) + ((1-Y)/(1-AL))
    dA2 = -(np.divide(Y, AL) - np.divide(1 - Y, 1 - AL))
    
    # Gradient of Loss w.r.t Z2: dL/dZ2
    # dL/dZ2 = dL/dA2 * dA2/dZ2 = dA2 * (A2 * (1 - A2)) = A2 - Y
    dZ2 = sigmoid_backward(dA2, Z2)
    # alternatively: dZ2 = AL - Y is a famous shortcut for sigmoid BCE
    
    # Gradient of Loss w.r.t W2: dL/dW2
    # dL/dW2 = 1/m * dL/dZ2 · A1.T
    dW2 = 1./m * np.dot(dZ2, A1.T)
    
    # Gradient of Loss w.r.t b2: dL/db2
    # dL/db2 = 1/m * Σ(dL/dZ2)
    db2 = 1./m * np.sum(dZ2, axis=1, keepdims=True)
    
    # ---- Layer 1 (Hidden) ----
    
    # Gradient of Loss w.r.t A1: dL/dA1
    # dL/dA1 = W2.T · dL/dZ2
    dA1 = np.dot(W2.T, dZ2)
    
    # Gradient of Loss w.r.t Z1: dL/dZ1
    # dL/dZ1 = dL/dA1 * dA1/dZ1 = dA1 * relu_deriv(Z1)
    dZ1 = relu_backward(dA1, Z1)
    
    # Gradient of Loss w.r.t W1: dL/dW1
    # dL/dW1 = 1/m * dL/dZ1 · X.T
    dW1 = 1./m * np.dot(dZ1, X.T)
    
    # Gradient of Loss w.r.t b1: dL/db1
    # dL/db1 = 1/m * Σ(dL/dZ1)
    db1 = 1./m * np.sum(dZ1, axis=1, keepdims=True)
    
    grads = {"dW1": dW1, "db1": db1, "dW2": dW2, "db2": db2}
    
    return grads

def update_parameters(parameters: dict, grads: dict, learning_rate: float) -> dict:
    """Updates network weights and biases using Gradient Descent."""
    parameters['W1'] = parameters['W1'] - learning_rate * grads['dW1']
    parameters['b1'] = parameters['b1'] - learning_rate * grads['db1']
    parameters['W2'] = parameters['W2'] - learning_rate * grads['dW2']
    parameters['b2'] = parameters['b2'] - learning_rate * grads['db2']
    
    return parameters

def train(X: np.ndarray, Y: np.ndarray, layer_dims: list, learning_rate: float=0.01, num_iterations: int=1000) -> dict:
    """Main training loop."""
    parameters = initialize_parameters(layer_dims)
    
    for i in range(num_iterations):
        AL, caches = forward_propagation(X, parameters)
        cost = compute_loss(AL, Y)
        grads = backward_propagation(AL, Y, caches, parameters)
        parameters = update_parameters(parameters, grads, learning_rate)
        
        if i % 100 == 0:
            print(f"Cost after iteration {i}: {cost:.4f}")
            
    return parameters

def predict(X: np.ndarray, parameters: dict) -> np.ndarray:
    """Predicts a binary outcome given features X."""
    AL, _ = forward_propagation(X, parameters)
    predictions = (AL > 0.5).astype(int)
    return predictions

if __name__ == "__main__":
    from sklearn.linear_model import LogisticRegression
    
    print("Testing Custom NumPy Neural Net...")
    # Mock data [features_dim x num_samples]
    # Lets make a simple binary classification problem
    np.random.seed(42)
    # Features: invoice_amount, invoice_age, days_until_due
    X_train = np.random.randn(3, 200)
    
    # Generate labels dependent on some linear combination + non-linearity
    Y_train = (np.sin(X_train[0, :] * 2) + X_train[1, :] * 1.5 - X_train[2, :] * 0.5 > 0).astype(int).reshape(1, 200)
    
    layer_dims = [X_train.shape[0], 5, 1] # 3 -> 5 -> 1
    
    trained_params = train(X_train, Y_train, layer_dims, learning_rate=0.05, num_iterations=2000)
    
    preds_custom = predict(X_train, trained_params)
    accuracy_custom = np.mean(preds_custom == Y_train) * 100
    
    print(f"\nCustom NN Training Accuracy: {accuracy_custom:.2f}%")
    
    # Compare with Sklearn Logistic Regression
    clf = LogisticRegression()
    clf.fit(X_train.T, np.squeeze(Y_train))
    preds_lr = clf.predict(X_train.T)
    accuracy_lr = np.mean(preds_lr == np.squeeze(Y_train)) * 100
    
    print(f"Sklearn Logistic Regression Training Accuracy: {accuracy_lr:.2f}%")
