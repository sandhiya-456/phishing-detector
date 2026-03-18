from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np
from utils import extract_features
import validators
import logging
import os

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

# Load the trained model
model = None
scaler = None

def load_or_train_model():
    global model, scaler
    try:
        if os.path.exists('phishing_model.pkl') and os.path.exists('scaler.pkl'):
            model = joblib.load('phishing_model.pkl')
            scaler = joblib.load('scaler.pkl')
            print("Model loaded successfully!")
        else:
            print("Model not found. Training new model...")
            from model import train_model
            model, scaler = train_model()
    except Exception as e:
        print(f"Error loading model: {e}")
        from model import train_model
        model, scaler = train_model()

# Load model at startup
load_or_train_model()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect():
    try:
        url = request.form['url']
        
        # Validate URL
        if not validators.url(url):
            return render_template('result.html', error='Invalid URL format. Please enter a valid URL.')
        
        # Extract features
        features = extract_features(url)
        
        # Scale features
        features_scaled = scaler.transform([features])
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        result = {
            'url': url,
            'is_phishing': bool(prediction),
            'confidence': float(max(probability) * 100),
            'features': {
                'url_length': features[0],
                'has_https': bool(features[1]),
                'has_at_symbol': bool(features[2]),
                'num_dots': features[3],
                'num_digits': features[4],
                'num_subdomains': features[5],
                'has_ip_address': bool(features[6]),
                'url_entropy': round(features[7], 2)
            }
        }
        
        return render_template('result.html', result=result)
    
    except Exception as e:
        logging.error(f"Error in detection: {str(e)}")
        return render_template('result.html', error=str(e))

@app.route('/api/detect', methods=['POST'])
def api_detect():
    try:
        data = request.get_json()
        url = data['url']
        
        if not validators.url(url):
            return jsonify({'error': 'Invalid URL'}), 400
        
        features = extract_features(url)
        features_scaled = scaler.transform([features])
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        return jsonify({
            'url': url,
            'is_phishing': bool(prediction),
            'confidence': float(max(probability) * 100)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)