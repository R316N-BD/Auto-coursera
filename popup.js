/**
 * POPUP.JS - Extension Popup UI Logic
 * 
 * Handles user interactions in the popup window:
 * 1. "Solve Quiz" button - triggers quiz solving
 * 2. "Bypass Course" button - marks course items as complete
 * 3. API key save functionality
 */

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const solveQuizBtn = document.getElementById('solveQuizBtn');
const bypassCourseBtn = document.getElementById('bypassCourseBtn');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const apiKeyInput = document.getElementById('apiKeyInput');
const statusMessage = document.getElementById('statusMessage');

// ============================================================================
// STATUS DISPLAY
// ============================================================================

/**
 * Shows a status message to the user
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 5000);
}

// ============================================================================
// SOLVE QUIZ - MAIN FUNCTIONALITY
// ============================================================================

/**
 * Handles the "Solve Quiz" button click
 * This triggers the entire quiz-solving workflow:
 * 1. Content script extracts questions
 * 2. Background script gets AI answers
 * 3. Content script clicks the correct options
 */
solveQuizBtn.addEventListener('click', async () => {
    console.log('[Auto Coursera Popup] Solve Quiz button clicked');
    
    // Disable button while processing
    solveQuizBtn.disabled = true;
    solveQuizBtn.textContent = 'Solving...';
    
    try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if we're on a Coursera page
        if (!tab.url.includes('coursera.org')) {
            showStatus('Please navigate to a Coursera quiz page first', 'error');
            return;
        }
        
        // Check if API key is set
        const response = await chrome.runtime.sendMessage({ action: 'getApiKey' });
        if (!response.apiKey) {
            showStatus('Please set your Gemini API key first', 'error');
            return;
        }
        
        showStatus('Extracting questions and solving quiz...', 'info');
        
        // Send message to content script to start solving
        chrome.tabs.sendMessage(tab.id, { action: 'solveQuiz' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('[Auto Coursera Popup] Error:', chrome.runtime.lastError);
                showStatus('Error: Please refresh the page and try again', 'error');
                return;
            }
            
            if (response && response.success) {
                showStatus('✓ Quiz solved successfully!', 'success');
            } else {
                showStatus('Error solving quiz: ' + (response?.error || 'Unknown error'), 'error');
            }
        });
        
    } catch (error) {
        console.error('[Auto Coursera Popup] Error:', error);
        showStatus('Error: ' + error.message, 'error');
    } finally {
        // Re-enable button after a delay
        setTimeout(() => {
            solveQuizBtn.disabled = false;
            solveQuizBtn.textContent = 'Solve Quiz';
        }, 2000);
    }
});

// ============================================================================
// BYPASS COURSE
// ============================================================================

/**
 * Handles the "Bypass Course" button click
 */
bypassCourseBtn.addEventListener('click', async () => {
    console.log('[Auto Coursera Popup] Bypass Course button clicked');
    
    bypassCourseBtn.disabled = true;
    bypassCourseBtn.textContent = 'Bypassing...';
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('coursera.org')) {
            showStatus('Please navigate to a Coursera course page first', 'error');
            return;
        }
        
        showStatus('Marking all course items as complete...', 'info');
        
        chrome.tabs.sendMessage(tab.id, { action: 'bypassCourse' }, (response) => {
            if (chrome.runtime.lastError) {
                showStatus('Error: Please refresh the page and try again', 'error');
                return;
            }
            
            if (response && response.success) {
                showStatus('✓ Course bypassed! Reload the page to see changes.', 'success');
            } else {
                showStatus('Error bypassing course', 'error');
            }
        });
        
    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            bypassCourseBtn.disabled = false;
            bypassCourseBtn.textContent = 'Bypass Course';
        }, 2000);
    }
});

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * Saves the API key to Chrome storage
 */
saveKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }
    
    saveKeyBtn.disabled = true;
    saveKeyBtn.textContent = 'Saving...';
    
    try {
        // Send to background script to save
        const response = await chrome.runtime.sendMessage({
            action: 'saveApiKey',
            apiKey: apiKey
        });
        
        if (response.success) {
            showStatus('✓ API key saved successfully!', 'success');
            apiKeyInput.value = '';
        } else {
            showStatus('Error saving API key', 'error');
        }
        
    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            saveKeyBtn.disabled = false;
            saveKeyBtn.textContent = 'Save API Key';
        }, 1000);
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Load saved API key on popup open (show masked version)
 */
async function loadSavedApiKey() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getApiKey' });
        
        if (response.success && response.apiKey) {
            // Show that a key is saved (but don't show the actual key)
            apiKeyInput.placeholder = '✓ API key is set (hidden for security)';
        }
    } catch (error) {
        console.error('[Auto Coursera Popup] Error loading API key:', error);
    }
}

// Load API key status when popup opens
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Auto Coursera Popup] Popup opened');
    loadSavedApiKey();
});
