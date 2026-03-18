import re
import math
from urllib.parse import urlparse
import tld

def extract_features(url):
    """Extract features from URL for phishing detection"""
    features = []
    
    # 1. URL Length
    features.append(len(url))
    
    # 2. Has HTTPS
    features.append(1 if url.startswith('https') else 0)
    
    # 3. Has @ symbol
    features.append(1 if '@' in url else 0)
    
    # 4. Number of dots
    features.append(url.count('.'))
    
    # 5. Number of digits
    features.append(sum(c.isdigit() for c in url))
    
    # 6. Number of subdomains
    domain_info = extract_domain_info(url)
    features.append(domain_info['subdomain_count'])
    
    # 7. Has IP address
    features.append(1 if has_ip_address(url) else 0)
    
    # 8. URL entropy
    features.append(calculate_entropy(url))
    
    return features

def extract_domain_info(url):
    """Extract domain information from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        
        # Extract subdomains
        parts = domain.split('.')
        
        # Handle cases like co.uk
        if len(parts) >= 2:
            try:
                tld_parts = tld.get_tld(domain, as_object=True)
                subdomain = tld_parts.subdomain
                subdomain_count = len(subdomain.split('.')) if subdomain else 0
            except:
                subdomain_count = max(0, len(parts) - 2)
        else:
            subdomain_count = 0
        
        return {
            'domain': domain,
            'subdomain_count': subdomain_count,
            'tld': parts[-1] if parts else ''
        }
    except:
        return {'domain': '', 'subdomain_count': 0, 'tld': ''}

def has_ip_address(url):
    """Check if URL contains IP address"""
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
    return bool(re.search(ip_pattern, domain))

def calculate_entropy(url):
    """Calculate Shannon entropy of URL"""
    if not url:
        return 0
    
    entropy = 0
    for i in range(256):
        char = chr(i)
        freq = url.count(char)
        if freq > 0:
            freq = float(freq) / len(url)
            entropy -= freq * math.log(freq, 2)
    
    return entropy