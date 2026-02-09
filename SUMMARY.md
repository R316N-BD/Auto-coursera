# 🎯 CODE SUMMARY: How Auto Coursera Gets Questions and Clicks Answers

## 📦 What You'll Find Here

This repository now contains the **complete source code** that shows exactly how the Auto Coursera extension:
1. **Gets quiz questions** from Coursera pages
2. **Uses AI to find the right answers**
3. **Clicks the correct options automatically**

---

## 📂 Files Added

| File | Description |
|------|-------------|
| **content.js** | Main script that extracts questions and clicks answers |
| **background.js** | Service worker that calls Google Gemini AI for answers |
| **popup.html** | User interface with "Solve Quiz" button |
| **popup.js** | Handles button clicks and user interactions |
| **QUIZ_SOLVING_EXPLAINED.md** | Detailed walkthrough with examples |
| **QUICK_REFERENCE.md** | Condensed code snippets |

---

## 🚀 Quick Start: The 3 Key Functions

### 1. Getting Questions (content.js)
```javascript
function extractQuizQuestions() {
    // Finds all quiz questions on the page
    const questionElements = document.querySelectorAll('[data-test="quiz-question"]');
    
    // Extracts text and options
    // Returns: [{questionText: "...", options: [{text: "...", element: <input>}]}]
}
```

### 2. Getting Right Answer (background.js)
```javascript
async function getCorrectAnswerFromAI(questionText, options) {
    // Calls Google Gemini AI API
    const response = await fetch('https://generativelanguage.googleapis.com/.../gemini-pro', {
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    // Returns: "Paris" (the correct answer text)
}
```

### 3. Clicking the Answer (content.js)
```javascript
function selectCorrectAnswer(question, correctAnswerText) {
    // Find the matching option
    const selectedOption = question.options.find(opt => 
        opt.text.toLowerCase().includes(correctAnswerText.toLowerCase())
    );
    
    // CLICK IT!
    selectedOption.element.click();
    selectedOption.element.checked = true;
    selectedOption.element.dispatchEvent(new Event('change'));
}
```

---

## 🔍 The Complete Flow

```
1. User clicks "Solve Quiz" button
   └─> popup.js sends message
   
2. content.js receives message
   └─> extractQuizQuestions() scans DOM
   
3. For each question:
   ├─> getAIAnswer() sends to background.js
   ├─> background.js calls Gemini AI API
   ├─> AI returns "Paris"
   └─> selectCorrectAnswer() CLICKS the "Paris" option
   
4. All questions solved!
```

---

## 📖 Documentation Files

### For Detailed Learning:
- **QUIZ_SOLVING_EXPLAINED.md** - Complete walkthrough with real examples
  - Step-by-step code flow
  - Example question walkthrough
  - Message passing explained
  - DOM selectors used

### For Quick Reference:
- **QUICK_REFERENCE.md** - Essential code snippets only
  - The 4 key functions
  - Flow diagram
  - Most important lines highlighted

### For Overall Understanding:
- **CODE_EXPLANATION.md** - High-level architecture
  - Project structure
  - Manifest explanation
  - How the extension works

---

## 🎬 The Key Code: Where Clicking Happens

**File:** `content.js`  
**Function:** `selectCorrectAnswer()`  
**Lines:** 151-180

```javascript
// *** THIS IS WHERE THE ACTUAL CLICKING HAPPENS ***
const element = selectedOption.element;

// Method 1: Direct click on the element
element.click();  // ← THE MAIN CLICK!

// Method 2: Set checked property
if (element.type === 'radio' || element.type === 'checkbox') {
    element.checked = true;
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

// Method 3: Click on parent label (for custom styled inputs)
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
```

### Why 4 different click methods?
- **Direct click**: Standard HTML interaction
- **Checked property**: Updates form state
- **Change event**: Triggers Coursera's JavaScript
- **Mouse events**: Full simulation for advanced detection

---

## 🤖 AI Integration

**File:** `background.js`  
**Function:** `getCorrectAnswerFromAI()`  
**API:** Google Gemini Pro

### Request Format:
```javascript
{
    contents: [{
        parts: [{
            text: "Question: What is 2+2?\nOptions:\nA) 3\nB) 4\nC) 5\nD) 6"
        }]
    }]
}
```

### AI Response:
```
"B: 4"
```

### Parsed Result:
```
"4"  // This gets passed to selectCorrectAnswer()
```

---

## 🎯 The Most Critical Lines

### Where questions are found:
```javascript
// content.js, line 35
const questionElements = document.querySelectorAll('[data-test="quiz-question"]');
```

### Where AI is called:
```javascript
// background.js, line 74
const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, ...);
```

### Where answers are clicked:
```javascript
// content.js, line 156
element.click();  // ← THIS LINE CLICKS THE ANSWER!
```

---

## 🛠️ How to Use This Code

1. **Review the implementation:**
   - Read `content.js` to see DOM manipulation
   - Read `background.js` to see AI integration
   - Read `popup.js` to see user interaction

2. **Understand the flow:**
   - Start with `QUIZ_SOLVING_EXPLAINED.md`
   - Check `QUICK_REFERENCE.md` for specific functions
   - Trace through a complete example

3. **Test the extension:**
   - Load the extension in Chrome
   - Navigate to a Coursera quiz
   - Click "Solve Quiz" and watch it work

---

## 📊 Code Statistics

- **Total Lines:** ~1,400 lines of JavaScript
- **Key Functions:** 15+
- **Files Created:** 8
- **DOM Selectors:** 10+
- **API Calls:** 1 (Google Gemini)
- **Click Methods:** 4 (for maximum compatibility)

---

## 🔐 Security & Privacy

- API key stored in Chrome's local storage
- Questions sent to Google Gemini AI
- No data collected by the extension itself
- All processing happens locally except AI calls

---

## ⚡ Technical Highlights

✅ **Content Script Injection** - Runs in Coursera page context  
✅ **Service Worker** - Background processing for API calls  
✅ **Message Passing** - Communication between components  
✅ **DOM Manipulation** - Extracts questions, clicks answers  
✅ **AI Integration** - Google Gemini for answer generation  
✅ **Event Simulation** - Multiple methods for clicking  
✅ **Error Handling** - Try-catch blocks throughout  
✅ **Visual Feedback** - Green outline on selected answers  

---

## 📚 Learn More

- **For beginners:** Start with `QUIZ_SOLVING_EXPLAINED.md`
- **For developers:** Check `QUICK_REFERENCE.md` and source files
- **For architecture:** Read `CODE_EXPLANATION.md`

---

## 🎓 What You've Learned

After reviewing this code, you now know:

✅ How Chrome extensions extract data from web pages  
✅ How to integrate AI APIs into browser extensions  
✅ How to simulate user interactions (clicks, events)  
✅ How content scripts and service workers communicate  
✅ How to handle asynchronous operations in extensions  
✅ How to manipulate the DOM to find and interact with elements  

---

## 🎉 Summary

The Auto Coursera extension works by:

1. **Scraping** quiz questions from the DOM using `querySelectorAll()`
2. **Sending** questions to Google Gemini AI via API
3. **Receiving** the correct answer from AI
4. **Finding** the matching option on the page
5. **Clicking** that option using `element.click()` and event dispatching

**The magic happens in 3 files:** content.js (extraction + clicking), background.js (AI calls), and popup.js (user interface).

All the code is now available in this repository with extensive comments and documentation! 🚀
