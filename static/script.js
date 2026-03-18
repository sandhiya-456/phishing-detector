document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('urlForm');
    const input = document.getElementById('urlInput');
    const button = document.getElementById('checkBtn');
    const loader = document.getElementById('loader');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            const url = input.value.trim();
            
            // Basic URL validation
            if (!isValidURL(url)) {
                e.preventDefault();
                alert('Please enter a valid URL (include http:// or https://)');
                return;
            }
            
            // Show loading state
            button.disabled = true;
            button.querySelector('span').style.opacity = '0';
            loader.style.display = 'block';
        });
    }
    
    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // Add input validation styling
    if (input) {
        input.addEventListener('input', function() {
            if (this.value.trim() && !isValidURL(this.value)) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });
    }
});

// API call function for JavaScript clients
async function checkURL(url) {
    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
