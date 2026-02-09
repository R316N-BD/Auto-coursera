/**
 * CONTENT.JS - Quiz Question Extraction and Answer Selection
 * 
 * This script runs in the context of Coursera pages and handles:
 * 1. Extracting quiz questions from the DOM
 * 2. Selecting the correct answer option
 * 3. Communicating with the background script for AI processing
 */

// ============================================================================
// QUIZ QUESTION EXTRACTION
// ============================================================================

/**
 * Extracts all quiz questions from the current page
 * Coursera quiz questions are typically in specific DOM structures
 */
function extractQuizQuestions() {
    console.log('[Auto Coursera] Extracting quiz questions...');
    
    const questions = [];
    
    // Find all quiz question containers
    // Coursera uses various selectors - these are common patterns
    const questionElements = document.querySelectorAll(
        '[data-test="quiz-question"], ' +
        '.rc-FormPartsQuestion, ' +
        '.quiz-question, ' +
        '[class*="question-prompt"]'
    );
    
    questionElements.forEach((questionElement, index) => {
        try {
            // Extract the question text
            const questionTextElement = questionElement.querySelector(
                '.question-text, ' +
                '[class*="prompt-text"], ' +
                'p, ' +
                'h3, ' +
                '[data-test="question-prompt"]'
            );
            
            const questionText = questionTextElement ? 
                questionTextElement.innerText.trim() : '';
            
            if (!questionText) {
                console.log(`[Auto Coursera] Question ${index + 1}: No text found`);
                return;
            }
            
            // Extract all answer options
            const options = [];
            const optionElements = questionElement.querySelectorAll(
                '[type="radio"], ' +
                '[type="checkbox"], ' +
                '.rc-Option, ' +
                '[class*="option-content"]'
            );
            
            optionElements.forEach((optionElement, optionIndex) => {
                // Get the label or text associated with this option
                let optionText = '';
                
                // Check if it's an input element
                if (optionElement.type === 'radio' || optionElement.type === 'checkbox') {
                    const label = optionElement.closest('label') || 
                                  document.querySelector(`label[for="${optionElement.id}"]`);
                    optionText = label ? label.innerText.trim() : '';
                } else {
                    optionText = optionElement.innerText.trim();
                }
                
                options.push({
                    text: optionText,
                    element: optionElement,
                    index: optionIndex
                });
            });
            
            // Store the question data
            questions.push({
                questionNumber: index + 1,
                questionText: questionText,
                options: options,
                questionElement: questionElement
            });
            
            console.log(`[Auto Coursera] Question ${index + 1}: "${questionText.substring(0, 50)}..."`);
            console.log(`[Auto Coursera] Found ${options.length} options`);
            
        } catch (error) {
            console.error(`[Auto Coursera] Error extracting question ${index + 1}:`, error);
        }
    });
    
    return questions;
}

// ============================================================================
// ANSWER SELECTION - THE CORE CLICK FUNCTIONALITY
// ============================================================================

/**
 * Selects the correct answer for a quiz question
 * This is the key function that "clicks the right one"
 * 
 * @param {Object} question - The question object with options
 * @param {string} correctAnswerText - The text of the correct answer from AI
 */
function selectCorrectAnswer(question, correctAnswerText) {
    console.log(`[Auto Coursera] Selecting answer for question ${question.questionNumber}`);
    console.log(`[Auto Coursera] Looking for answer: "${correctAnswerText}"`);
    
    // Find the option that matches the correct answer
    let selectedOption = null;
    let bestMatch = 0;
    
    question.options.forEach(option => {
        // Calculate similarity (simple contains check or exact match)
        const optionLower = option.text.toLowerCase();
        const answerLower = correctAnswerText.toLowerCase();
        
        // Check for exact match
        if (optionLower === answerLower) {
            selectedOption = option;
            bestMatch = 100;
            return;
        }
        
        // Check if option contains answer or answer contains option
        if (optionLower.includes(answerLower) || answerLower.includes(optionLower)) {
            const similarity = Math.max(
                answerLower.length / optionLower.length,
                optionLower.length / answerLower.length
            ) * 100;
            
            if (similarity > bestMatch) {
                selectedOption = option;
                bestMatch = similarity;
            }
        }
    });
    
    if (!selectedOption) {
        console.error('[Auto Coursera] Could not find matching option');
        return false;
    }
    
    console.log(`[Auto Coursera] Found matching option: "${selectedOption.text}"`);
    
    // *** THIS IS WHERE THE ACTUAL CLICKING HAPPENS ***
    try {
        const element = selectedOption.element;
        
        // Method 1: Direct click on the element
        element.click();
        
        // Method 2: If it's an input (radio/checkbox), also set checked property
        if (element.type === 'radio' || element.type === 'checkbox') {
            element.checked = true;
            
            // Trigger change event to ensure Coursera's JavaScript detects it
            const changeEvent = new Event('change', { bubbles: true });
            element.dispatchEvent(changeEvent);
        }
        
        // Method 3: Click on parent label if exists (for custom styled inputs)
        const parentLabel = element.closest('label');
        if (parentLabel) {
            parentLabel.click();
        }
        
        // Method 4: Trigger all mouse events to fully simulate user interaction
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            const mouseEvent = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(mouseEvent);
        });
        
        console.log(`[Auto Coursera] ✓ Successfully selected answer`);
        
        // Highlight the selected answer (visual feedback)
        element.style.outline = '3px solid #00ff00';
        element.style.outlineOffset = '2px';
        
        return true;
        
    } catch (error) {
        console.error('[Auto Coursera] Error clicking answer:', error);
        return false;
    }
}

// ============================================================================
// AI INTEGRATION - GETTING THE RIGHT ANSWER
// ============================================================================

/**
 * Sends question to background script to get AI answer
 * @param {Object} question - The question object
 * @returns {Promise<string>} - The correct answer text
 */
async function getAIAnswer(question) {
    console.log(`[Auto Coursera] Requesting AI answer for question ${question.questionNumber}`);
    
    return new Promise((resolve, reject) => {
        // Send message to background script
        chrome.runtime.sendMessage({
            action: 'solveQuestion',
            question: {
                text: question.questionText,
                options: question.options.map(opt => opt.text)
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            
            if (response && response.success) {
                console.log(`[Auto Coursera] AI Answer: "${response.answer}"`);
                resolve(response.answer);
            } else {
                reject(new Error(response?.error || 'Failed to get AI answer'));
            }
        });
    });
}

// ============================================================================
// MAIN QUIZ SOLVING WORKFLOW
// ============================================================================

/**
 * Main function that orchestrates the entire quiz-solving process
 * This is called when user clicks "Solve Quiz" button
 */
async function solveQuiz() {
    console.log('[Auto Coursera] ============================================');
    console.log('[Auto Coursera] Starting Quiz Solving Process');
    console.log('[Auto Coursera] ============================================');
    
    try {
        // Step 1: Extract all questions from the page
        const questions = extractQuizQuestions();
        
        if (questions.length === 0) {
            alert('No quiz questions found on this page. Make sure you have a quiz open.');
            return;
        }
        
        console.log(`[Auto Coursera] Found ${questions.length} questions to solve`);
        
        // Step 2: Process each question one by one
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            
            console.log(`\n[Auto Coursera] Processing Question ${i + 1}/${questions.length}`);
            
            try {
                // Step 2a: Get AI answer for this question
                const aiAnswer = await getAIAnswer(question);
                
                // Step 2b: Select the correct answer (THE CLICKING PART)
                const success = selectCorrectAnswer(question, aiAnswer);
                
                if (!success) {
                    console.warn(`[Auto Coursera] ⚠ Failed to select answer for question ${i + 1}`);
                }
                
                // Small delay between questions
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`[Auto Coursera] Error processing question ${i + 1}:`, error);
            }
        }
        
        console.log('\n[Auto Coursera] ============================================');
        console.log('[Auto Coursera] Quiz Solving Complete!');
        console.log('[Auto Coursera] ============================================');
        
        // Show success message
        alert(`Quiz solving complete! Processed ${questions.length} questions.`);
        
        // Optional: Auto-submit the quiz
        // submitQuiz();
        
    } catch (error) {
        console.error('[Auto Coursera] Fatal error in solveQuiz:', error);
        alert('Error solving quiz: ' + error.message);
    }
}

/**
 * Optional: Submit the quiz after all answers are selected
 */
function submitQuiz() {
    console.log('[Auto Coursera] Submitting quiz...');
    
    // Find the submit button
    const submitButton = document.querySelector(
        '[data-test="quiz-submit"], ' +
        'button[type="submit"], ' +
        '.submit-button, ' +
        'button:contains("Submit")'
    );
    
    if (submitButton) {
        submitButton.click();
        console.log('[Auto Coursera] ✓ Quiz submitted');
    } else {
        console.log('[Auto Coursera] Submit button not found');
    }
}

// ============================================================================
// MESSAGE LISTENER - Receives commands from popup
// ============================================================================

/**
 * Listen for messages from the popup or background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Auto Coursera] Received message:', request.action);
    
    if (request.action === 'solveQuiz') {
        // Start the quiz solving process
        solveQuiz().then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        
        // Return true to indicate we'll send response asynchronously
        return true;
    }
    
    if (request.action === 'extractQuestions') {
        // Just extract and return questions without solving
        const questions = extractQuizQuestions();
        sendResponse({ 
            success: true, 
            questions: questions.map(q => ({
                text: q.questionText,
                options: q.options.map(opt => opt.text)
            }))
        });
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('[Auto Coursera] Content script loaded and ready');
console.log('[Auto Coursera] Waiting for commands from popup...');

// Add a visual indicator that the extension is active
if (document.location.href.includes('coursera.org/learn')) {
    console.log('[Auto Coursera] ✓ Coursera course page detected');
}
