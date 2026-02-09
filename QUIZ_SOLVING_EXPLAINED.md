# Quiz Solving Code Explanation

## 🎯 Overview - How Questions Are Retrieved and Answered

This document explains **exactly** how the Auto Coursera extension gets quiz questions and clicks the right answers. The process involves three main files working together:

1. **content.js** - Extracts questions from the page and clicks answers
2. **background.js** - Calls AI to get the correct answers
3. **popup.js** - Provides the UI to trigger the process

---

## 📊 Complete Flow Diagram

```
User Click "Solve Quiz"
         ↓
    popup.js sends message
         ↓
    content.js receives command
         ↓
    extractQuizQuestions() → Scrapes DOM for questions
         ↓
    For each question:
         ↓
    getAIAnswer() → Sends to background.js
         ↓
    background.js → Calls Google Gemini AI API
         ↓
    AI returns correct answer text
         ↓
    selectCorrectAnswer() → Finds matching option
         ↓
    element.click() → CLICKS THE RIGHT ANSWER
         ↓
    Next question...
         ↓
    All done!
```

---

## 🔍 Part 1: Getting Questions (content.js)

### Function: `extractQuizQuestions()`

**Location:** `content.js` lines 23-104

This function scrapes the Coursera page to find all quiz questions and their options.

#### How it works:

```javascript
// 1. Find all question containers on the page
const questionElements = document.querySelectorAll(
    '[data-test="quiz-question"], ' +  // Coursera's test attribute
    '.rc-FormPartsQuestion, ' +         // Coursera's class name
    '.quiz-question, ' +                // Generic class
    '[class*="question-prompt"]'        // Partial class match
);

// 2. For each question found
questionElements.forEach((questionElement, index) => {
    // Extract the question text
    const questionTextElement = questionElement.querySelector(
        '.question-text, ' +
        '[class*="prompt-text"], ' +
        'p, h3'
    );
    const questionText = questionTextElement.innerText.trim();
    
    // 3. Find all answer options (radio buttons or checkboxes)
    const optionElements = questionElement.querySelectorAll(
        '[type="radio"], ' +         // Radio button inputs
        '[type="checkbox"], ' +      // Checkbox inputs
        '.rc-Option, ' +            // Coursera option class
        '[class*="option-content"]' // Partial match
    );
    
    // 4. Extract text for each option
    optionElements.forEach((optionElement, optionIndex) => {
        let optionText = '';
        
        if (optionElement.type === 'radio' || optionElement.type === 'checkbox') {
            // Get associated label text
            const label = optionElement.closest('label') || 
                          document.querySelector(`label[for="${optionElement.id}"]`);
            optionText = label.innerText.trim();
        }
        
        options.push({
            text: optionText,        // The answer text
            element: optionElement,  // The DOM element to click
            index: optionIndex       // Position (0, 1, 2, 3...)
        });
    });
});
```

#### What it returns:

```javascript
[
    {
        questionNumber: 1,
        questionText: "What is the capital of France?",
        options: [
            { text: "London", element: <HTMLInputElement>, index: 0 },
            { text: "Paris", element: <HTMLInputElement>, index: 1 },
            { text: "Berlin", element: <HTMLInputElement>, index: 2 },
            { text: "Madrid", element: <HTMLInputElement>, index: 3 }
        ],
        questionElement: <HTMLDivElement>
    },
    // ... more questions
]
```

---

## 🤖 Part 2: Getting the Right Answer (background.js)

### Function: `getCorrectAnswerFromAI()`

**Location:** `background.js` lines 54-112

This function sends the question to Google's Gemini AI and gets the correct answer.

#### Step-by-step process:

```javascript
async function getCorrectAnswerFromAI(questionText, options) {
    // 1. Get the user's saved API key
    const apiKey = await getApiKey();
    
    // 2. Build the prompt for the AI
    const prompt = buildPrompt(questionText, options);
    // Example prompt:
    // "Question: What is the capital of France?
    //  Options:
    //  A) London
    //  B) Paris
    //  C) Berlin
    //  D) Madrid
    //  Please provide ONLY the letter of the correct answer..."
    
    // 3. Make API call to Google Gemini
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,  // Low = more consistent
                    topK: 1,
                    maxOutputTokens: 100
                }
            })
        }
    );
    
    // 4. Parse the AI's response
    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    // Example: "B: Paris"
    
    // 5. Extract the correct answer text
    const correctAnswer = parseAIResponse(aiResponse, options);
    // Returns: "Paris"
    
    return correctAnswer;
}
```

#### Example API interaction:

**Request to Gemini:**
```
Question: What is the capital of France?
Options:
A) London
B) Paris
C) Berlin
D) Madrid

Please analyze and provide the letter of the correct answer.
```

**Response from Gemini:**
```
B: Paris
```

**Parsed result:**
```
"Paris"
```

---

## 🖱️ Part 3: Clicking the Right Answer (content.js)

### Function: `selectCorrectAnswer()`

**Location:** `content.js` lines 109-189

**THIS IS THE CORE FUNCTION THAT CLICKS THE CORRECT ANSWER!**

#### How it finds and clicks the right option:

```javascript
function selectCorrectAnswer(question, correctAnswerText) {
    // correctAnswerText = "Paris" (from AI)
    
    // 1. Find the option that matches the AI's answer
    let selectedOption = null;
    
    question.options.forEach(option => {
        const optionLower = option.text.toLowerCase();      // "paris"
        const answerLower = correctAnswerText.toLowerCase(); // "paris"
        
        // Check for exact match
        if (optionLower === answerLower) {
            selectedOption = option;  // Found it!
        }
        
        // Or check if one contains the other
        if (optionLower.includes(answerLower) || 
            answerLower.includes(optionLower)) {
            selectedOption = option;
        }
    });
    
    // 2. Get the DOM element (the actual radio button or checkbox)
    const element = selectedOption.element;
    
    // 3. CLICK IT! (Multiple methods for reliability)
    
    // Method 1: Direct click
    element.click();
    
    // Method 2: Set checked property (for inputs)
    if (element.type === 'radio' || element.type === 'checkbox') {
        element.checked = true;
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
    }
    
    // Method 3: Click parent label (for custom styled inputs)
    const parentLabel = element.closest('label');
    if (parentLabel) {
        parentLabel.click();
    }
    
    // Method 4: Simulate full mouse interaction
    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        const mouseEvent = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(mouseEvent);
    });
    
    // 4. Visual feedback (green outline)
    element.style.outline = '3px solid #00ff00';
    
    return true; // Success!
}
```

#### Why multiple click methods?

Different websites handle clicks differently:
- **Direct click**: Works for standard HTML elements
- **Checked property**: Required for actual state change in forms
- **Change event**: Triggers Coursera's JavaScript listeners
- **Label click**: Works when the radio button is hidden behind custom styling
- **Mouse events**: Simulates complete user interaction for advanced detection

---

## 🔄 Part 4: Complete Workflow (content.js)

### Function: `solveQuiz()`

**Location:** `content.js` lines 226-281

This orchestrates the entire process:

```javascript
async function solveQuiz() {
    // STEP 1: Extract all questions from the page
    const questions = extractQuizQuestions();
    // Returns: [question1, question2, question3, ...]
    
    // STEP 2: Process each question one by one
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // STEP 2a: Get AI answer for this question
        const aiAnswer = await getAIAnswer(question);
        // Sends to background.js → Gemini AI → returns "Paris"
        
        // STEP 2b: Click the correct answer
        const success = selectCorrectAnswer(question, aiAnswer);
        // Finds "Paris" option → clicks it
        
        // Wait a bit before next question
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // STEP 3: All done!
    alert('Quiz solving complete!');
}
```

---

## 💬 Part 5: Message Passing

The extension components communicate using Chrome's message passing:

### Popup → Content Script

**Location:** `popup.js` line 52

```javascript
// User clicks "Solve Quiz" button in popup
chrome.tabs.sendMessage(tab.id, { action: 'solveQuiz' });
```

### Content Script → Background Script

**Location:** `content.js` line 200

```javascript
// Content script needs AI answer
chrome.runtime.sendMessage({
    action: 'solveQuestion',
    question: {
        text: "What is the capital of France?",
        options: ["London", "Paris", "Berlin", "Madrid"]
    }
});
```

### Background Script → Content Script (response)

**Location:** `background.js` line 168

```javascript
// Background script returns AI answer
sendResponse({
    success: true,
    answer: "Paris"
});
```

---

## 📝 Real Example Walkthrough

Let's trace a complete example:

### 1. User opens quiz page
```
Page shows:
Question: What is 2 + 2?
○ 3
○ 4
○ 5
○ 6
```

### 2. User clicks "Solve Quiz" in popup
```javascript
popup.js → sends 'solveQuiz' message to content.js
```

### 3. Content script extracts question
```javascript
extractQuizQuestions() finds:
{
    questionText: "What is 2 + 2?",
    options: [
        { text: "3", element: <input type="radio" ...> },
        { text: "4", element: <input type="radio" ...> },
        { text: "5", element: <input type="radio" ...> },
        { text: "6", element: <input type="radio" ...> }
    ]
}
```

### 4. Content script asks background for answer
```javascript
getAIAnswer() → sends to background.js:
{
    action: 'solveQuestion',
    question: {
        text: "What is 2 + 2?",
        options: ["3", "4", "5", "6"]
    }
}
```

### 5. Background script calls Gemini AI
```javascript
Prompt sent to AI:
"Question: What is 2 + 2?
 Options:
 A) 3
 B) 4
 C) 5
 D) 6
 
 Provide the letter and text of correct answer."

AI responds: "B: 4"

Parsed result: "4"
```

### 6. Content script clicks the answer
```javascript
selectCorrectAnswer(question, "4")
→ Finds option with text "4"
→ Gets the <input> element
→ element.click() ← THE ACTUAL CLICK!
→ element.checked = true
→ Dispatches change event
```

### 7. Result
```
Page now shows:
Question: What is 2 + 2?
○ 3
◉ 4  ← SELECTED AND CLICKED!
○ 5
○ 6
```

---

## 🎯 Summary: The Key Code Locations

### Getting Questions:
- **File:** `content.js`
- **Function:** `extractQuizQuestions()` (lines 23-104)
- **What it does:** Scrapes DOM using `querySelectorAll()` to find questions and options

### Getting Right Answer:
- **File:** `background.js`
- **Function:** `getCorrectAnswerFromAI()` (lines 54-112)
- **What it does:** Calls Google Gemini AI API with the question and gets back the correct answer

### Clicking Right Answer:
- **File:** `content.js`
- **Function:** `selectCorrectAnswer()` (lines 109-189)
- **What it does:** 
  1. Matches AI answer to option text
  2. Gets the DOM element (radio button)
  3. **Calls `element.click()`** ← THE MAIN CLICK!
  4. Also sets `checked = true` and dispatches events
  5. Adds visual feedback (green outline)

### Orchestration:
- **File:** `content.js`
- **Function:** `solveQuiz()` (lines 226-281)
- **What it does:** Coordinates the entire process for all questions

---

## 🔧 Technical Details

### DOM Selectors Used:
```javascript
// Questions
'[data-test="quiz-question"]'
'.rc-FormPartsQuestion'
'.quiz-question'

// Options
'[type="radio"]'
'[type="checkbox"]'
'.rc-Option'

// Text
'.question-text'
'[class*="prompt-text"]'
```

### Events Dispatched:
```javascript
new Event('change', { bubbles: true })      // Form change
new MouseEvent('click', { bubbles: true })  // Mouse click
new MouseEvent('mousedown', ...)            // Mouse press
new MouseEvent('mouseup', ...)              // Mouse release
```

### API Endpoint:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

---

## ⚠️ Important Notes

1. **Multiple click methods** ensure compatibility with Coursera's custom UI
2. **AI parsing** handles various response formats (letter-based or text-based)
3. **String matching** uses case-insensitive comparison and substring detection
4. **Visual feedback** (green outline) confirms selection
5. **Sequential processing** prevents race conditions (one question at a time)

---

This is the complete code flow for how Auto Coursera gets quiz questions and clicks the right answers! 🎉
