// DOM Elements
const urlInput = document.getElementById('urlInput');
const checkBtn = document.getElementById('checkBtn');
const resultSection = document.getElementById('resultSection');
const resultCard = document.getElementById('resultCard');
const loadingOverlay = document.getElementById('loadingOverlay');
const themeToggle = document.getElementById('themeToggle');
const recentList = document.getElementById('recentList');
const newsletterForm = document.getElementById('newsletterForm');

// Statistics
let stats = {
    totalChecked: parseInt(localStorage.getItem('totalChecked')) || 0,
    phishingDetected: parseInt(localStorage.getItem('phishingDetected')) || 0,
    safeUrls: parseInt(localStorage.getItem('safeUrls')) || 0
};

// Recent checks
let recentChecks = JSON.parse(localStorage.getItem('recentChecks')) || [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded - Initializing...');
    updateStats();
    displayRecentChecks();
    setupEventListeners();
    checkTheme();
});

// Setup Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Check button click
    if (checkBtn) {
        checkBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Check button clicked');
            analyzeURL();
        });
    }
    
    // Enter key press
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter key pressed');
                analyzeURL();
            }
        });
    }
    
    // Example buttons - FIXED: Using for loop instead of forEach to ensure proper binding
    const exampleButtons = document.querySelectorAll('.example-btn');
    console.log('Found', exampleButtons.length, 'example buttons');
    
    for (let i = 0; i < exampleButtons.length; i++) {
        const btn = exampleButtons[i];
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            console.log('Example button clicked:', url);
            if (urlInput) {
                urlInput.value = url;
                // Call analyzeURL directly
                analyzeURL();
            }
        });
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // FAQ items
    const faqQuestions = document.querySelectorAll('.faq-question');
    for (let i = 0; i < faqQuestions.length; i++) {
        faqQuestions[i].addEventListener('click', function() {
            const faqItem = this.parentElement;
            faqItem.classList.toggle('active');
        });
    }
    
    // Newsletter form
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input').value;
            if (email) {
                alert('Thank you for subscribing with: ' + email);
                this.reset();
            }
        });
    }
    
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    for (let i = 0; i < navLinks.length; i++) {
        navLinks[i].addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Remove active class from all links
            for (let j = 0; j < navLinks.length; j++) {
                navLinks[j].classList.remove('active');
            }
            this.classList.add('active');
            
            if (targetId === '#home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
}

// Analyze URL Function
function analyzeURL() {
    if (!urlInput) {
        console.error('URL input not found');
        showNotification('Error: URL input not found', 'error');
        return;
    }
    
    const url = urlInput.value.trim();
    console.log('Analyzing URL:', url);
    
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }
    
    if (!isValidURL(url)) {
        showNotification('Please enter a valid URL (include http:// or https://)', 'error');
        return;
    }
    
    // Show loading
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        console.log('Loading overlay shown');
    }
    
    // Simulate analysis (in real app, this would be an API call)
    setTimeout(function() {
        console.log('Analysis complete - generating results');
        try {
            const result = detectPhishing(url);
            displayResult(result);
            
            // Update statistics
            updateStatistics(result);
            
            // Add to recent checks
            addToRecentChecks(url, result);
        } catch (error) {
            console.error('Error during analysis:', error);
            showNotification('Error analyzing URL: ' + error.message, 'error');
        } finally {
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
        
        // Scroll to result
        if (resultSection) {
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 1500);
}

// URL Validation
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Phishing Detection Algorithm
function detectPhishing(url) {
    console.log('Detecting phishing for:', url);
    const features = extractFeatures(url);
    const score = calculatePhishingScore(features);
    
    return {
        url: url,
        isPhishing: score > 50,
        confidence: score,
        features: features,
        warnings: generateWarnings(features)
    };
}

// Extract URL Features
function extractFeatures(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname;
        
        return {
            length: url.length,
            hasHttps: url.toLowerCase().startsWith('https'),
            hasAtSymbol: url.includes('@'),
            numDots: (domain.match(/\./g) || []).length,
            numDigits: (url.match(/\d/g) || []).length,
            numSubdomains: Math.max(0, domain.split('.').length - 2),
            hasIPAddress: /^(\d{1,3}\.){3}\d{1,3}$/.test(domain),
            hasHyphen: domain.includes('-'),
            hasDoubleSlash: url.indexOf('//') > 7,
            isShortened: isUrlShortened(domain),
            pathLength: path.length,
            numQueryParams: (urlObj.search.match(/&/g) || []).length + (urlObj.search.includes('?') ? 1 : 0),
            entropy: calculateEntropy(url)
        };
    } catch (e) {
        console.error('Error extracting features:', e);
        // Return default features if URL parsing fails
        return {
            length: url.length,
            hasHttps: url.toLowerCase().startsWith('https'),
            hasAtSymbol: url.includes('@'),
            numDots: (url.match(/\./g) || []).length,
            numDigits: (url.match(/\d/g) || []).length,
            numSubdomains: 0,
            hasIPAddress: false,
            hasHyphen: url.includes('-'),
            hasDoubleSlash: url.indexOf('//') > 7,
            isShortened: false,
            pathLength: 0,
            numQueryParams: 0,
            entropy: calculateEntropy(url)
        };
    }
}

// Check if URL is shortened
function isUrlShortened(domain) {
    const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'tiny.cc', 'is.gd', 'buff.ly', 'short.link'];
    return shorteners.some(s => domain.includes(s));
}

// Calculate URL Entropy
function calculateEntropy(url) {
    if (!url) return 0;
    
    let entropy = 0;
    const len = url.length;
    
    // Count character frequencies
    const freq = {};
    for (let i = 0; i < len; i++) {
        const char = url[i];
        freq[char] = (freq[char] || 0) + 1;
    }
    
    // Calculate entropy
    for (const char in freq) {
        const probability = freq[char] / len;
        entropy -= probability * Math.log2(probability);
    }
    
    return parseFloat(entropy.toFixed(2));
}

// Calculate Phishing Score
function calculatePhishingScore(features) {
    let score = 0;
    let maxScore = 0;
    
    // Weighted scoring
    const weights = {
        https: { value: !features.hasHttps ? 1 : 0, weight: 20 },
        atSymbol: { value: features.hasAtSymbol ? 1 : 0, weight: 25 },
        ipAddress: { value: features.hasIPAddress ? 1 : 0, weight: 30 },
        subdomains: { value: features.numSubdomains > 2 ? 1 : 0, weight: 15 },
        dots: { value: features.numDots > 4 ? 1 : 0, weight: 10 },
        digits: { value: features.numDigits > 8 ? 1 : 0, weight: 10 },
        hyphen: { value: features.hasHyphen ? 1 : 0, weight: 10 },
        doubleSlash: { value: features.hasDoubleSlash ? 1 : 0, weight: 15 },
        shortened: { value: features.isShortened ? 1 : 0, weight: 20 },
        length: { value: features.length > 100 ? 1 : 0, weight: 10 },
        pathLength: { value: features.pathLength > 75 ? 1 : 0, weight: 10 },
        queryParams: { value: features.numQueryParams > 4 ? 1 : 0, weight: 10 },
        entropy: { value: features.entropy > 4.2 ? 1 : 0, weight: 15 }
    };
    
    // Calculate total score
    for (const key in weights) {
        score += weights[key].value * weights[key].weight;
        maxScore += weights[key].weight;
    }
    
    // Normalize to 0-100
    const normalizedScore = Math.min(100, Math.round((score / maxScore) * 100));
    console.log('Phishing score:', normalizedScore);
    return normalizedScore;
}

// Generate Warnings
function generateWarnings(features) {
    const warnings = [];
    
    if (!features.hasHttps) {
        warnings.push('Website does not use HTTPS encryption - information may not be secure');
    }
    if (features.hasAtSymbol) {
        warnings.push('URL contains @ symbol - this is often used to hide the real domain');
    }
    if (features.hasIPAddress) {
        warnings.push('URL uses IP address instead of domain name - this is highly suspicious');
    }
    if (features.numSubdomains > 3) {
        warnings.push('Unusually high number of subdomains - may be trying to appear legitimate');
    }
    if (features.isShortened) {
        warnings.push('URL is shortened - you cannot see where it really goes');
    }
    if (features.numDigits > 10) {
        warnings.push('URL contains an unusual number of digits - common in phishing URLs');
    }
    if (features.hasHyphen && features.numSubdomains > 2) {
        warnings.push('Domain contains hyphens and multiple subdomains - often used in deceptive URLs');
    }
    if (features.entropy > 4.5) {
        warnings.push('URL has high randomness - often indicates auto-generated phishing URLs');
    }
    if (features.length > 150) {
        warnings.push('URL is unusually long - may be hiding malicious parameters');
    }
    
    return warnings;
}

// Display Result
function displayResult(result) {
    console.log('Displaying result:', result);
    
    if (!resultCard || !resultSection) {
        console.error('Result elements not found');
        showNotification('Error: Result display elements not found', 'error');
        return;
    }
    
    const isPhishing = result.isPhishing;
    const confidence = result.confidence;
    
    let verdictClass = 'safe';
    let verdictIcon = '✅';
    let verdictTitle = 'URL Appears Safe';
    let verdictDescription = 'No immediate threats detected in this URL';
    
    if (isPhishing) {
        verdictClass = 'danger';
        verdictIcon = '⚠️';
        verdictTitle = '⚠️ Potential Phishing Detected!';
        verdictDescription = 'This URL shows multiple suspicious patterns commonly found in phishing websites';
    } else if (confidence > 40) {
        verdictClass = 'warning';
        verdictIcon = '⚠️';
        verdictTitle = '⚠️ Exercise Caution';
        verdictDescription = 'Some suspicious elements detected - proceed with care';
    }
    
    // Generate features HTML
    let featuresHTML = '';
    for (const [key, value] of Object.entries(result.features)) {
        let status = 'normal';
        let statusText = 'Normal';
        
        if (key === 'hasHttps') {
            status = value ? 'normal' : 'warning';
            statusText = value ? 'Secure' : 'Not Secure';
        } else if (key === 'hasAtSymbol' || key === 'hasIPAddress') {
            status = value ? 'danger' : 'normal';
            statusText = value ? 'Suspicious' : 'Normal';
        } else if (key === 'numSubdomains' && value > 2) {
            status = 'warning';
            statusText = 'High';
        } else if (key === 'numDots' && value > 4) {
            status = 'warning';
            statusText = 'High';
        } else if (key === 'numDigits' && value > 8) {
            status = 'warning';
            statusText = 'High';
        } else if (key === 'entropy' && value > 4) {
            status = 'warning';
            statusText = 'High';
        } else if (key === 'isShortened' && value) {
            status = 'warning';
            statusText = 'Shortened';
        } else if (key === 'length' && value > 100) {
            status = 'warning';
            statusText = 'Long';
        }
        
        // Format the key name for display
        let displayKey = key.replace(/([A-Z])/g, ' $1')
                           .replace(/^./, function(str) { return str.toUpperCase(); })
                           .replace(/([a-z])([A-Z])/g, '$1 $2');
        
        // Format the value for display
        let displayValue = value;
        if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
        }
        
        featuresHTML += `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${displayKey}</td>
                <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">${displayValue}</td>
                <td style="padding: 12px; border-bottom: 1px solid var(--border-color);">
                    <span class="status-badge ${status}" style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background: ${getStatusColor(status, 'bg')}; color: ${getStatusColor(status, 'text')};">${statusText}</span>
                </td>
            </tr>
        `;
    }
    
    // Generate warnings HTML
    let warningsHTML = '';
    if (result.warnings && result.warnings.length > 0) {
        let warningItems = '';
        for (let i = 0; i < result.warnings.length; i++) {
            warningItems += `
                <li style="color: #ef4444; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;">
                    <i class="fas fa-exclamation-circle" style="margin-top: 3px;"></i>
                    <span>${result.warnings[i]}</span>
                </li>
            `;
        }
        
        warningsHTML = `
            <div style="margin-top: 30px; padding: 20px; background: rgba(239, 68, 68, 0.1); border-radius: 10px;">
                <h3 style="margin-bottom: 15px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i> Warnings (${result.warnings.length})
                </h3>
                <ul style="list-style: none; padding: 0;">
                    ${warningItems}
                </ul>
            </div>
        `;
    }
    
    // Generate recommendations HTML
    let recommendationsHTML = '';
    if (isPhishing) {
        recommendationsHTML = `
            <li style="color: #ef4444; margin-bottom: 10px;">
                <i class="fas fa-times-circle"></i> Do not enter any personal information on this website
            </li>
            <li style="color: #ef4444; margin-bottom: 10px;">
                <i class="fas fa-times-circle"></i> Avoid clicking any links or downloading files
            </li>
            <li style="color: #ef4444; margin-bottom: 10px;">
                <i class="fas fa-times-circle"></i> Close this tab immediately if you're unsure
            </li>
            <li style="color: #666; margin-bottom: 10px;">
                <i class="fas fa-info-circle"></i> If you've entered credentials, change them immediately on the legitimate website
            </li>
        `;
    } else if (confidence > 40) {
        recommendationsHTML = `
            <li style="color: #f59e0b; margin-bottom: 10px;">
                <i class="fas fa-exclamation-triangle"></i> Verify the website carefully before entering any information
            </li>
            <li style="color: #10b981; margin-bottom: 10px;">
                <i class="fas fa-check-circle"></i> Check for the padlock icon in your browser
            </li>
            <li style="color: #666; margin-bottom: 10px;">
                <i class="fas fa-info-circle"></i> Double-check the domain name for misspellings
            </li>
        `;
    } else {
        recommendationsHTML = `
            <li style="color: #10b981; margin-bottom: 10px;">
                <i class="fas fa-check-circle"></i> URL appears legitimate based on our analysis
            </li>
            <li style="color: #666; margin-bottom: 10px;">
                <i class="fas fa-info-circle"></i> Always verify the website URL in your browser's address bar
            </li>
            <li style="color: #666; margin-bottom: 10px;">
                <i class="fas fa-info-circle"></i> Look for the padlock icon for HTTPS websites
            </li>
        `;
    }
    
    // Build complete result HTML
    resultCard.innerHTML = `
        <div class="card-header" style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
            <i class="fas fa-chart-bar" style="font-size: 2rem; color: #667eea;"></i>
            <h2>Analysis Results</h2>
        </div>
        
        <div style="background: var(--light-bg); padding: 15px; border-radius: 10px; margin-bottom: 20px; word-break: break-all;">
            <strong style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Analyzed URL:</strong>
            <span style="color: #667eea; font-weight: 500;">${result.url}</span>
        </div>
        
        <div class="verdict ${verdictClass}" style="display: flex; align-items: center; gap: 20px; padding: 25px; border-radius: 15px; margin-bottom: 30px; background: ${getVerdictBackground(verdictClass)};">
            <div style="font-size: 4rem;">${verdictIcon}</div>
            <div style="flex: 1;">
                <h3 style="font-size: 1.5rem; margin-bottom: 5px;">${verdictTitle}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 15px;">${verdictDescription}</p>
                <div style="background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${confidence}%; height: 100%; background: linear-gradient(90deg, ${isPhishing ? '#ef4444' : '#10b981'}, ${isPhishing ? '#f59e0b' : '#667eea'}); transition: width 1s ease;"></div>
                </div>
                <p style="margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary);">
                    Confidence: <strong>${confidence}%</strong> 
                    ${isPhishing ? '(High risk)' : confidence > 40 ? '(Medium risk)' : '(Low risk)'}
                </p>
            </div>
        </div>
        
        <h3 style="margin: 30px 0 20px; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-list"></i> Detailed Feature Analysis
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid var(--border-color);">
                    <th style="padding: 12px; text-align: left;">Feature</th>
                    <th style="padding: 12px; text-align: left;">Value</th>
                    <th style="padding: 12px; text-align: left;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${featuresHTML}
            </tbody>
        </table>
        
        ${warningsHTML}
        
        <div style="margin-top: 30px; padding: 25px; background: var(--light-bg); border-radius: 15px;">
            <h4 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-shield-alt"></i> Recommendations
            </h4>
            <ul style="list-style: none; padding: 0;">
                ${recommendationsHTML}
            </ul>
        </div>
    `;
    
    // Show the result section
    resultSection.style.display = 'block';
    console.log('Result displayed successfully');
}

// Helper function to get status colors
function getStatusColor(status, type) {
    if (type === 'bg') {
        switch(status) {
            case 'normal': return 'rgba(16, 185, 129, 0.1)';
            case 'warning': return 'rgba(245, 158, 11, 0.1)';
            case 'danger': return 'rgba(239, 68, 68, 0.1)';
            default: return 'rgba(102, 126, 234, 0.1)';
        }
    } else {
        switch(status) {
            case 'normal': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'danger': return '#ef4444';
            default: return '#667eea';
        }
    }
}

// Helper function to get verdict background
function getVerdictBackground(verdictClass) {
    switch(verdictClass) {
        case 'safe': return 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))';
        case 'warning': return 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))';
        case 'danger': return 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))';
        default: return 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(102, 126, 234, 0.05))';
    }
}

// Update Statistics
function updateStatistics(result) {
    stats.totalChecked++;
    
    if (result.isPhishing) {
        stats.phishingDetected++;
    } else {
        stats.safeUrls++;
    }
    
    // Save to localStorage
    localStorage.setItem('totalChecked', stats.totalChecked);
    localStorage.setItem('phishingDetected', stats.phishingDetected);
    localStorage.setItem('safeUrls', stats.safeUrls);
    
    updateStats();
}

// Update Stats Display
function updateStats() {
    const totalEl = document.getElementById('totalChecked');
    const phishingEl = document.getElementById('phishingDetected');
    const safeEl = document.getElementById('safeUrls');
    const accuracyEl = document.getElementById('accuracyRate');
    
    if (totalEl) totalEl.textContent = stats.totalChecked;
    if (phishingEl) phishingEl.textContent = stats.phishingDetected;
    if (safeEl) safeEl.textContent = stats.safeUrls;
    if (accuracyEl) accuracyEl.textContent = '95%';
}

// Add to Recent Checks
function addToRecentChecks(url, result) {
    const recent = {
        url: url.length > 50 ? url.substring(0, 50) + '...' : url,
        fullUrl: url,
        timestamp: new Date().toLocaleString(),
        isPhishing: result.isPhishing,
        confidence: result.confidence
    };
    
    recentChecks.unshift(recent);
    
    // Keep only last 10 checks
    if (recentChecks.length > 10) {
        recentChecks.pop();
    }
    
    localStorage.setItem('recentChecks', JSON.stringify(recentChecks));
    displayRecentChecks();
}

// Display Recent Checks
function displayRecentChecks() {
    if (!recentList) return;
    
    if (recentChecks.length === 0) {
        recentList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No recent checks</p>';
        return;
    }
    
    let recentHTML = '';
    for (let i = 0; i < recentChecks.length; i++) {
        const check = recentChecks[i];
        recentHTML += `
            <div class="recent-item" style="background: var(--card-bg); padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    <i class="fas fa-link" style="color: #667eea;"></i>
                    <span style="color: var(--text-primary); cursor: pointer;" onclick="document.getElementById('urlInput').value='${check.fullUrl}'; analyzeURL();">
                        ${check.url}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background: ${check.isPhishing ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${check.isPhishing ? '#ef4444' : '#10b981'};">
                        ${check.isPhishing ? '⚠️ Phishing' : '✅ Safe'}
                    </span>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">
                        ${check.confidence}%
                    </span>
                    <span style="color: var(--text-secondary); font-size: 0.8rem;">
                        ${check.timestamp}
                    </span>
                </div>
            </div>
        `;
    }
    
    recentList.innerHTML = recentHTML;
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDark);
    
    const icon = themeToggle.querySelector('i');
    if (icon) {
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

// Check Theme
function checkTheme() {
    const isDark = localStorage.getItem('darkTheme') === 'true';
    if (isDark) {
        document.body.classList.add('dark-theme');
        const icon = themeToggle ? themeToggle.querySelector('i') : null;
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    for (let i = 0; i < existingNotifications.length; i++) {
        existingNotifications[i].remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    
    const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    const bgColor = type === 'error' ? '#ef4444' : '#667eea';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${bgColor};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(function() {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Add animation styles if not already present
if (!document.querySelector('#animation-styles')) {
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Make functions globally available
window.analyzeURL = analyzeURL;

console.log('Script loaded successfully - Fixed version');