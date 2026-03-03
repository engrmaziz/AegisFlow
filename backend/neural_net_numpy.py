import numpy as np
from sklearn.linear_model import LogisticRegression

# Pure NumPy implementation of a 2-layer Neural Network

def initialize_parameters(input_dim, hidden_dim, output_dim):
    """He initialization for weights, zeros for biases."""
    np.random.seed(42)
    W1 = np.random.randn(hidden_dim, input_dim) * np.sqrt(2. / input_dim)
    b1 = np.zeros((hidden_dim, 1))
    W2 = np.random.randn(output_dim, hidden_dim) * np.sqrt(2. / hidden_dim)
    b2 = np.zeros((output_dim, 1))
    return {'W1': W1, 'b1': b1, 'W2': W2, 'b2': b2}

def relu(Z):
    return np.maximum(0, Z)

def relu_backward(dA, Z):
    dZ = np.array(dA, copy=True)
    dZ[Z <= 0] = 0
    return dZ

def sigmoid(Z):
    # Clip to avoid overflow
    Z_clipped = np.clip(Z, -500, 500)
    return 1.0 / (1.0 + np.exp(-Z_clipped))

def sigmoid_backward(dA, Z):
    s = sigmoid(Z)
    return dA * s * (1 - s)

def forward_propagation(X, params):
    """Z1 = W1@X + b1, A1 = relu, Z2 = W2@A1 + b2, A2 = sigmoid"""
    W1, b1, W2, b2 = params['W1'], params['b1'], params['W2'], params['b2']
    Z1 = np.dot(W1, X) + b1
    A1 = relu(Z1)
    Z2 = np.dot(W2, A1) + b2
    A2 = sigmoid(Z2)
    cache = {'Z1': Z1, 'A1': A1, 'Z2': Z2, 'A2': A2}
    return A2, cache

def compute_loss(A2, Y):
    """Binary cross-entropy loss."""
    m = Y.shape[1]
    A2 = np.clip(A2, 1e-15, 1 - 1e-15)
    loss = -(1.0/m) * np.sum(Y * np.log(A2) + (1-Y) * np.log(1-A2))
    return np.squeeze(loss)

def backward_propagation(X, Y, cache, params):
    """ALL gradients with math formula comments on every line."""
    m = X.shape[1]
    W2 = params['W2']
    A1, A2 = cache['A1'], cache['A2']
    Z1, Z2 = cache['Z1'], cache['Z2']

    # dL/dZ2 = A2 - Y
    dZ2 = A2 - Y
    
    # dL/dW2 = (1/m) * dZ2 @ A1.T
    dW2 = (1.0 / m) * np.dot(dZ2, A1.T)
    
    # dL/db2 = (1/m) * sum(dZ2)
    db2 = (1.0 / m) * np.sum(dZ2, axis=1, keepdims=True)
    
    # dL/dA1 = W2.T @ dZ2
    dA1 = np.dot(W2.T, dZ2)
    
    # dL/dZ1 = dL/dA1 * relu'(Z1)
    dZ1 = relu_backward(dA1, Z1)
    
    # dL/dW1 = (1/m) * dZ1 @ X.T
    dW1 = (1.0 / m) * np.dot(dZ1, X.T)
    
    # dL/db1 = (1/m) * sum(dZ1)
    db1 = (1.0 / m) * np.sum(dZ1, axis=1, keepdims=True)

    return {'dW1': dW1, 'db1': db1, 'dW2': dW2, 'db2': db2}

def update_parameters(params, grads, learning_rate=0.01):
    params['W1'] -= learning_rate * grads['dW1']
    params['b1'] -= learning_rate * grads['db1']
    params['W2'] -= learning_rate * grads['dW2']
    params['b2'] -= learning_rate * grads['db2']
    return params

def train(X, Y, hidden_dim=4, epochs=1000, lr=0.1):
    input_dim = X.shape[0]
    output_dim = Y.shape[0]
    params = initialize_parameters(input_dim, hidden_dim, output_dim)
    
    for i in range(epochs):
        A2, cache = forward_propagation(X, params)
        cost = compute_loss(A2, Y)
        grads = backward_propagation(X, Y, cache, params)
        params = update_parameters(params, grads, lr)
        
        if i % 100 == 0:
            print(f"Cost after epoch {i}: {cost:.4f}")
    return params

def predict(X, params):
    A2, _ = forward_propagation(X, params)
    return (A2 > 0.5).astype(int)

if __name__ == "__main__":
    print("Training pure NumPy Neural Network...")
    # Synthetic binary classification data (2 features)
    np.random.seed(1)
    X = np.random.randn(2, 400)
    Y = (X[0,:]**2 + X[1,:]**2 < 1.0).astype(int).reshape(1, 400) # Circular decision boundary
    
    trained_params = train(X, Y, hidden_dim=8, epochs=1000, lr=0.5)
    predictions = predict(X, trained_params)
    acc = np.mean(predictions == Y)
    print(f"NumPy NN Accuracy: {acc*100:.2f}%")
    
    # Compare with sklearn Logistic Regression
    lr = LogisticRegression()
    lr.fit(X.T, Y.T.ravel())
    lr_preds = lr.predict(X.T)
    lr_acc = np.mean(lr_preds == Y.ravel())
    print(f"Sklearn LogisticRegression Accuracy: {lr_acc*100:.2f}%")
