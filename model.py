import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

def create_sample_dataset():
    """Create a sample dataset for training"""
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic features
    data = {
        'url_length': np.random.randint(10, 200, n_samples),
        'has_https': np.random.randint(0, 2, n_samples),
        'has_at_symbol': np.random.randint(0, 2, n_samples),
        'num_dots': np.random.randint(1, 10, n_samples),
        'num_digits': np.random.randint(0, 15, n_samples),
        'num_subdomains': np.random.randint(0, 5, n_samples),
        'has_ip_address': np.random.randint(0, 2, n_samples),
        'url_entropy': np.random.uniform(0, 5, n_samples)
    }
    
    # Create labels (phishing or legitimate)
    labels = []
    for i in range(n_samples):
        score = 0
        if data['url_length'][i] > 75: score += 1
        if data['has_https'][i] == 0: score += 1
        if data['has_at_symbol'][i] == 1: score += 2
        if data['num_dots'][i] > 4: score += 1
        if data['num_digits'][i] > 5: score += 1
        if data['num_subdomains'][i] > 2: score += 1
        if data['has_ip_address'][i] == 1: score += 2
        if data['url_entropy'][i] > 3: score += 1
        
        labels.append(1 if score > 4 else 0)
    
    data['label'] = labels
    return pd.DataFrame(data)

def train_model():
    """Train the phishing detection model"""
    print("Creating sample dataset...")
    df = create_sample_dataset()
    df.to_csv('features.csv', index=False)
    
    # Prepare features and labels
    feature_columns = ['url_length', 'has_https', 'has_at_symbol', 'num_dots', 
                      'num_digits', 'num_subdomains', 'has_ip_address', 'url_entropy']
    
    X = df[feature_columns]
    y = df['label']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # Train model
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(scaler.transform(X_test), y_test)
    
    print(f"Training accuracy: {train_score:.2f}")
    print(f"Testing accuracy: {test_score:.2f}")
    
    # Save model and scaler
    joblib.dump(model, 'phishing_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("Model saved successfully!")
    
    return model, scaler

if __name__ == '__main__':
    train_model()