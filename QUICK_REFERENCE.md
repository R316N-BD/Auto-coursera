# Quick Reference: Key Code for Getting Questions and Clicking Answers

## 🎯 The Essential Functions

### 1️⃣ Getting Questions (`content.js`)

**Function:** `extractQuizQuestions()` - Lines 23-104

```javascript
function extractQuizQuestions() {
    const questions = [];
    
    // Find all quiz question containers
    const questionElements = document.querySelectorAll(
        '[data-test="quiz-question"], .rc-FormPartsQuestion, .quiz-question'
    );
    
    questionElements.forEach((questionElement, index) => {
        // Extract question text
        const questionText = questionElement.querySelector('.question-text').innerText;
        
        // Find all answer options
        const options = [];
        const optionElements = questionElement.querySelectorAll('[type="radio"], [type="checkbox"]');
        
        optionElements.forEach((optionElement) => {
            options.push({
                text: optionElement.closest('label').innerText,
                element: optionElement  // Save for clicking later
            });
        });
        
        questions.push({ questionText, options });
    });
    
    return questions;
}
```

---

### 2️⃣ Getting the Right Answer (`background.js`)

**Function:** `getCorrectAnswerFromAI()` - Lines 54-112

```javascript
async function getCorrectAnswerFromAI(questionText, options) {
    // Get API key
    const apiKey = await getApiKey();
    
    // Build prompt for AI
    const prompt = `Question: ${questionText}\nOptions:\n${options.join('\n')}`;
    
    // Call Google Gemini API
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    );
    
    const data = await response.json();
    const aiAnswer = data.candidates[0].content.parts[0].text;
    
    // Parse AI response to get answer text
    return parseAIResponse(aiAnswer, options);
}
```

---

### 3️⃣ Clicking the Right Answer (`content.js`)

**Function:** `selectCorrectAnswer()` - Lines 109-189

```javascript
function selectCorrectAnswer(question, correctAnswerText) {
    // Find the matching option
    let selectedOption = null;
    
    question.options.forEach(option => {
        if (option.text.toLowerCase().includes(correctAnswerText.toLowerCase())) {
            selectedOption = option;
        }
    });
    
    // Get the element
    const element = selectedOption.element;
    
    // *** THE ACTUAL CLICKING CODE ***
    
    // Method 1: Direct click
    element.click();
    
    // Method 2: Set checked state
    element.checked = true;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Method 3: Click parent label
    const label = element.closest('label');
    if (label) label.click();
    
    // Method 4: Simulate mouse events
    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        const mouseEvent = new MouseEvent(eventType, { bubbles: true });
        element.dispatchEvent(mouseEvent);
    });
    
    return true;
}
```

---

### 4️⃣ Main Orchestrator (`content.js`)

**Function:** `solveQuiz()` - Lines 226-281

```javascript
async function solveQuiz() {
    // Get all questions
    const questions = extractQuizQuestions();
    
    // Process each question
    for (const question of questions) {
        // Get AI answer
        const aiAnswer = await getAIAnswer(question);
        
        // Click the correct option
        selectCorrectAnswer(question, aiAnswer);
    }
    
    alert('Quiz solving complete!');
}
```

---

## 🔄 The Complete Flow

```
┌──────────────────────────────────────────────────────────────┐
│ USER CLICKS "Solve Quiz" (popup.js)                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ solveQuiz() - Main orchestrator (content.js)                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Step 1: extractQuizQuestions()                      │    │
│  │         Scans DOM for questions and options         │    │
│  │         Returns: [{questionText, options: [...]}]   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Step 2: For each question...                        │    │
│  │                                                      │    │
│  │   ┌──────────────────────────────────────────────┐ │    │
│  │   │ getAIAnswer()                                 │ │    │
│  │   │ Sends to background.js                        │ │    │
│  │   └──────────────┬───────────────────────────────┘ │    │
│  │                  │                                  │    │
│  │                  ▼                                  │    │
│  │   ┌──────────────────────────────────────────────┐ │    │
│  │   │ background.js: getCorrectAnswerFromAI()      │ │    │
│  │   │ - Calls Gemini AI API                        │ │    │
│  │   │ - Returns: "Paris" (correct answer text)     │ │    │
│  │   └──────────────┬───────────────────────────────┘ │    │
│  │                  │                                  │    │
│  │                  ▼                                  │    │
│  │   ┌──────────────────────────────────────────────┐ │    │
│  │   │ selectCorrectAnswer()                         │ │    │
│  │   │ - Finds matching option                       │ │    │
│  │   │ - element.click() ← CLICKS IT!                │ │    │
│  │   │ - Dispatches events                           │ │    │
│  │   └──────────────────────────────────────────────┘ │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                         │
                         ▼
                  ✅ All answers clicked!
```

---

## 📍 File Locations

| File | Purpose | Key Functions |
|------|---------|---------------|
| `content.js` | Extracts questions, clicks answers | `extractQuizQuestions()`, `selectCorrectAnswer()`, `solveQuiz()` |
| `background.js` | Gets AI answers | `getCorrectAnswerFromAI()` |
| `popup.js` | User interface | Button click handlers |
| `popup.html` | UI layout | "Solve Quiz" button |

---

## 🔑 The Most Important Lines

### Where questions are extracted:
**File:** `content.js` **Line 35:**
```javascript
const questionElements = document.querySelectorAll('[data-test="quiz-question"]');
```

### Where AI is called:
**File:** `background.js` **Line 73:**
```javascript
const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, { ... });
```

### Where the answer is clicked:
**File:** `content.js` **Line 156:**
```javascript
element.click();  // ← THIS IS THE ACTUAL CLICK!
```

---

## 💡 Why Multiple Click Methods?

```javascript
// 1. Direct click - standard approach
element.click();

// 2. Set checked - ensures form state changes
element.checked = true;

// 3. Dispatch change event - triggers JavaScript listeners
element.dispatchEvent(new Event('change'));

// 4. Click label - works for custom-styled inputs
parentLabel.click();

// 5. Mouse events - full simulation for detection evasion
element.dispatchEvent(new MouseEvent('click'));
```

Different methods ensure compatibility with Coursera's various UI implementations!

---

## 🎓 Summary

1. **`extractQuizQuestions()`** → Scrapes the page for questions using DOM selectors
2. **`getCorrectAnswerFromAI()`** → Sends question to Google Gemini, gets answer
3. **`selectCorrectAnswer()`** → Finds matching option and **CLICKS IT**
4. **`solveQuiz()`** → Coordinates everything

The code handles the entire pipeline from DOM scraping → AI processing → clicking!
