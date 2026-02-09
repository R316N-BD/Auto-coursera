/**
 * BACKGROUND.JS - AI Integration for Getting Correct Answers
 * 
 * This service worker handles:
 * 1. Storing the user's Gemini API key
 * 2. Making API calls to Google Gemini to get correct answers
 * 3. Processing AI responses and returning answers to content script
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * Saves the user's Gemini API key to Chrome storage
 * @param {string} apiKey - The Gemini API key
 */
async function saveApiKey(apiKey) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
            console.log('[Auto Coursera] API key saved');
            resolve();
        });
    });
}

/**
 * Retrieves the stored Gemini API key
 * @returns {Promise<string>} - The API key or null if not set
 */
async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            resolve(result.geminiApiKey || null);
        });
    });
}

// ============================================================================
// AI ANSWER GENERATION - THE BRAIN OF THE OPERATION
// ============================================================================

/**
 * Calls Google Gemini AI to get the correct answer for a quiz question
 * THIS IS WHERE WE GET THE RIGHT ANSWER!
 * 
 * @param {string} questionText - The quiz question
 * @param {string[]} options - Array of answer options
 * @returns {Promise<string>} - The correct answer text
 */
async function getCorrectAnswerFromAI(questionText, options) {
    console.log('[Auto Coursera] Calling AI to solve question...');
    console.log('[Auto Coursera] Question:', questionText);
    console.log('[Auto Coursera] Options:', options);
    
    // Get the stored API key
    const apiKey = await getApiKey();
    
    if (!apiKey) {
        throw new Error('Gemini API key not set. Please add your API key in the extension popup.');
    }
    
    // Construct the prompt for the AI
    const prompt = buildPrompt(questionText, options);
    
    try {
        // Make API call to Gemini
        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,  // Low temperature for more deterministic answers
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 100,
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Auto Coursera] API Error:', errorText);
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the answer from the AI response
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('[Auto Coursera] Raw AI response:', aiResponse);
        
        // Parse the AI's answer to get the correct option
        const correctAnswer = parseAIResponse(aiResponse, options);
        
        console.log('[Auto Coursera] ✓ Correct answer identified:', correctAnswer);
        
        return correctAnswer;
        
    } catch (error) {
        console.error('[Auto Coursera] Error calling AI API:', error);
        throw error;
    }
}

/**
 * Builds the prompt for the AI to solve the quiz question
 * @param {string} question - The question text
 * @param {string[]} options - The answer options
 * @returns {string} - The formatted prompt
 */
function buildPrompt(question, options) {
    let prompt = `You are helping to solve a multiple choice quiz question from Coursera.

Question: ${question}

Options:
`;
    
    options.forEach((option, index) => {
        prompt += `${String.fromCharCode(65 + index)}) ${option}\n`;
    });
    
    prompt += `
Please analyze the question carefully and provide ONLY the letter (A, B, C, D, etc.) of the correct answer, followed by the full text of that option.

Format your response as: "LETTER: option text"
For example: "A: The correct answer text here"

Your answer:`;
    
    return prompt;
}

/**
 * Parses the AI's response to extract the correct answer text
 * @param {string} aiResponse - The raw response from AI
 * @param {string[]} options - The original options to match against
 * @returns {string} - The correct answer text
 */
function parseAIResponse(aiResponse, options) {
    // Try to extract letter-based answer (e.g., "A: Some answer")
    const letterMatch = aiResponse.match(/^([A-Z])[:)\s]+(.+)$/im);
    
    if (letterMatch) {
        const letter = letterMatch[1];
        const answerText = letterMatch[2].trim();
        
        // Convert letter to index (A=0, B=1, etc.)
        const index = letter.charCodeAt(0) - 65;
        
        if (index >= 0 && index < options.length) {
            // Return the actual option text (in case AI paraphrased)
            return options[index];
        }
        
        // If letter is invalid, return the text after the letter
        return answerText;
    }
    
    // If no letter format, try to find which option the AI response contains
    for (const option of options) {
        const optionLower = option.toLowerCase();
        const responseLower = aiResponse.toLowerCase();
        
        // Check if AI response mentions this option
        if (responseLower.includes(optionLower) || optionLower.includes(responseLower)) {
            return option;
        }
    }
    
    // Fallback: return the first option (shouldn't happen with good AI)
    console.warn('[Auto Coursera] Could not parse AI response, using first option');
    return options[0];
}

// ============================================================================
// MESSAGE HANDLER - Receives requests from content script
// ============================================================================

/**
 * Listen for messages from content script requesting AI answers
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Auto Coursera] Background received message:', request.action);
    
    // Handle question solving request
    if (request.action === 'solveQuestion') {
        const { question } = request;
        
        console.log('[Auto Coursera] Processing solve request...');
        
        // Call AI to get the answer (async)
        getCorrectAnswerFromAI(question.text, question.options)
            .then(answer => {
                console.log('[Auto Coursera] Sending answer back to content script:', answer);
                sendResponse({
                    success: true,
                    answer: answer
                });
            })
            .catch(error => {
                console.error('[Auto Coursera] Error solving question:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
        
        // Return true to indicate async response
        return true;
    }
    
    // Handle API key save request
    if (request.action === 'saveApiKey') {
        saveApiKey(request.apiKey)
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        
        return true;
    }
    
    // Handle API key retrieval request
    if (request.action === 'getApiKey') {
        getApiKey()
            .then(apiKey => {
                sendResponse({ success: true, apiKey: apiKey });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        
        return true;
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('[Auto Coursera] Background service worker initialized');

// Show installation message
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[Auto Coursera] Extension installed! Please set your Gemini API key.');
    } else if (details.reason === 'update') {
        console.log('[Auto Coursera] Extension updated to version', chrome.runtime.getManifest().version);
    }
});
