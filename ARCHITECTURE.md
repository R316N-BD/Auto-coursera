# Architecture: Question Extraction → AI Answer → Click Selection

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COURSERA WEB PAGE                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Quiz Question: What is 2+2?                               │    │
│  │  ○ Option A: 3                                             │    │
│  │  ○ Option B: 4                                             │    │
│  │  ○ Option C: 5                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ (Injected)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CONTENT.JS                                   │
│                    (Content Script - Isolated)                       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ extractQuizQuestions()                                       │  │
│  │ • document.querySelectorAll('[data-test="quiz-question"]')   │  │
│  │ • Extracts question text                                     │  │
│  │ • Finds all radio/checkbox options                           │  │
│  │ • Returns: [{questionText, options: [{text, element}]}]      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                             │                                        │
│                             │ Question data                          │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ getAIAnswer(question)                                        │  │
│  │ • chrome.runtime.sendMessage({                               │  │
│  │     action: 'solveQuestion',                                 │  │
│  │     question: {text: "...", options: ["..."]}                │  │
│  │   })                                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              │ Message Passing
                              │
┌─────────────────────────────▼────────────────────────────────────────┐
│                         BACKGROUND.JS                                 │
│                    (Service Worker - Background)                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ getCorrectAnswerFromAI(questionText, options)                │   │
│  │                                                               │   │
│  │ 1. Get API key from storage                                  │   │
│  │ 2. Build prompt:                                             │   │
│  │    "Question: What is 2+2?                                   │   │
│  │     Options: A) 3  B) 4  C) 5                                │   │
│  │     Provide the letter of correct answer"                    │   │
│  │                                                               │   │
│  │ 3. Call Google Gemini API ───────────────┐                  │   │
│  └──────────────────────────────────────────┼───────────────────┘   │
│                             │                │                        │
└─────────────────────────────┼────────────────┼────────────────────────┘
                              │                │
                              │                │ HTTPS POST
                              │                ▼
                              │  ┌─────────────────────────────────────┐
                              │  │   GOOGLE GEMINI AI API               │
                              │  │   generativelanguage.googleapis.com  │
                              │  │                                      │
                              │  │   Analyzes question and options      │
                              │  │   Returns: "B: 4"                    │
                              │  └──────────────────┬───────────────────┘
                              │                     │
                              │                     │ Response
                              │  ┌──────────────────▼───────────────────┐
                              │  │ parseAIResponse(aiResponse, options) │
                              │  │ • Extracts "B" → index 1              │
                              │  │ • Returns options[1] = "4"            │
                              │  └──────────────────┬───────────────────┘
                              │                     │
                              │ Correct answer: "4" │
                              │◄────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────────┐
│                         CONTENT.JS                                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ selectCorrectAnswer(question, "4")                           │   │
│  │                                                               │   │
│  │ 1. Find matching option:                                     │   │
│  │    for each option in question.options:                      │   │
│  │      if option.text.includes("4"):                           │   │
│  │        selectedOption = option  ✓                            │   │
│  │                                                               │   │
│  │ 2. Get DOM element:                                          │   │
│  │    element = selectedOption.element                          │   │
│  │    // <input type="radio" ...>                               │   │
│  │                                                               │   │
│  │ 3. *** CLICK IT ***                                          │   │
│  │    element.click() ◄─────────── THE MAIN ACTION!            │   │
│  │    element.checked = true                                    │   │
│  │    element.dispatchEvent(new Event('change'))                │   │
│  │    parentLabel.click()                                       │   │
│  │    element.dispatchEvent(new MouseEvent('mousedown'))        │   │
│  │    element.dispatchEvent(new MouseEvent('mouseup'))          │   │
│  │    element.dispatchEvent(new MouseEvent('click'))            │   │
│  │                                                               │   │
│  │ 4. Visual feedback:                                          │   │
│  │    element.style.outline = '3px solid #00ff00'               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                             │                                         │
└─────────────────────────────┼─────────────────────────────────────────┘
                              │
                              │ DOM Mutation
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         COURSERA WEB PAGE                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Quiz Question: What is 2+2?                               │    │
│  │  ○ Option A: 3                                             │    │
│  │  ◉ Option B: 4  ◄── SELECTED! (Green outline)             │    │
│  │  ○ Option C: 5                                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Message Flow Sequence

```
1. USER ACTION
   popup.js: User clicks "Solve Quiz"
   ↓

2. TRIGGER
   popup.js → content.js
   Message: { action: 'solveQuiz' }
   ↓

3. EXTRACT
   content.js: extractQuizQuestions()
   Scans DOM → Returns questions array
   ↓

4. FOR EACH QUESTION
   content.js: solveQuiz() loop
   ↓
   
5. REQUEST ANSWER
   content.js → background.js
   Message: { action: 'solveQuestion', question: {...} }
   ↓

6. AI CALL
   background.js → Google Gemini API
   POST: Question + options
   ↓

7. AI RESPONSE
   Google Gemini → background.js
   Response: "B: 4"
   ↓

8. PARSE & RETURN
   background.js: parseAIResponse()
   Returns: "4"
   ↓

9. RECEIVE ANSWER
   background.js → content.js
   Response: { success: true, answer: "4" }
   ↓

10. FIND & CLICK
    content.js: selectCorrectAnswer()
    - Find option with text "4"
    - element.click()
    - Dispatch events
    ↓

11. VISUAL UPDATE
    Coursera page: Radio button selected
    Green outline applied
    ↓

12. NEXT QUESTION
    Loop back to step 4 until all done
```

## 🎯 Key Components Breakdown

### 1. Content Script (content.js)
- **Context:** Runs in Coursera page
- **Access:** Can read/modify DOM
- **Cannot:** Make cross-origin requests directly
- **Role:** Extract questions, manipulate page

### 2. Service Worker (background.js)
- **Context:** Runs in background
- **Access:** Can make API calls
- **Cannot:** Access page DOM
- **Role:** Handle AI API calls

### 3. Popup (popup.html + popup.js)
- **Context:** Extension popup window
- **Access:** Can send messages
- **Cannot:** Access page DOM directly
- **Role:** User interface

## 🔐 Data Flow

```
User Input (Gemini API Key)
    ↓
popup.js
    ↓
chrome.storage.local.set()
    ↓
Stored in Chrome Storage
    ↓
Retrieved by background.js
    ↓
Used in API call
```

## 📊 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Manifest | JSON | Extension configuration |
| Content Script | JavaScript | DOM manipulation |
| Service Worker | JavaScript | Background processing |
| Popup UI | HTML/CSS | User interface |
| Message Passing | Chrome APIs | Component communication |
| Storage | Chrome Storage API | API key persistence |
| AI Service | Google Gemini | Answer generation |
| HTTP Client | Fetch API | API requests |

## 🔧 DOM Selectors Used

### Finding Questions:
- `[data-test="quiz-question"]` - Coursera's test attribute
- `.rc-FormPartsQuestion` - Coursera's React class
- `.quiz-question` - Generic quiz class

### Finding Options:
- `[type="radio"]` - Radio button inputs
- `[type="checkbox"]` - Checkbox inputs
- `.rc-Option` - Coursera option wrapper

### Finding Text:
- `.question-text` - Question text wrapper
- `[class*="prompt-text"]` - Partial match for prompt
- `label` - Associated labels for inputs

## 🎨 Event Types Dispatched

| Event | Purpose |
|-------|---------|
| `click` | Trigger click handlers |
| `change` | Update form state |
| `mousedown` | Simulate mouse press |
| `mouseup` | Simulate mouse release |
| All with `bubbles: true` | Event propagation |

## 🚀 Execution Flow Summary

1. **Setup:** Extension loads, service worker initializes
2. **User Action:** Clicks "Solve Quiz"
3. **Extraction:** DOM scraped for questions
4. **AI Processing:** Each question sent to Gemini
5. **Answer Selection:** Matching options clicked
6. **Completion:** All questions solved
7. **Feedback:** User notified of completion

---

This architecture ensures separation of concerns:
- **Content script** handles page interaction
- **Service worker** handles AI communication
- **Popup** handles user interface
- **Messages** coordinate everything
