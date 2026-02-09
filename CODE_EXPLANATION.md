# Auto Coursera - Code Explanation

## 📋 Overview

**Auto Coursera** is a browser extension designed to automate the completion of Coursera courses. The extension allows users to bypass video lectures, discussions, and reading materials, as well as automatically attempt quizzes using AI-powered answers.

## 🏗️ Project Architecture

This is a Chrome Extension (Manifest V3) that can be installed on Chromium-based browsers including Chrome, Opera, Brave, Edge, and Thunderbird.

### Repository Structure

```
Auto-coursera/
├── manifest.json           # Extension configuration file
├── README.md              # User documentation
├── LICENSE                # MIT License
├── banner.png             # Extension banner image
└── images/                # Extension icons
    ├── 16.png
    ├── 32.png
    ├── 48.png
    └── 128.png
```

## 📄 Manifest.json Explanation

The `manifest.json` file is the heart of the Chrome extension. Let's break down each section:

### Basic Information
```json
{
  "manifest_version": 3,
  "name": "Auto Coursera",
  "version": "1.0",
  "author": "Rahil Khan",
  "description": "Complete coursera courses in just one click..."
}
```

- **manifest_version**: Uses Manifest V3 (latest Chrome extension format)
- **name**: The display name of the extension
- **version**: Current version (1.0)
- **author**: Creator of the extension
- **description**: Brief description shown in the browser's extension manager

### Permissions
```json
"permissions": ["storage", "activeTab"]
```

- **storage**: Allows the extension to save data (like API keys) locally
- **activeTab**: Grants access to the currently active tab when the user interacts with the extension

### Action (Popup)
```json
"action": {
  "default_popup": "popup.html"
}
```

This defines the popup UI that appears when users click the extension icon in the browser toolbar. The popup would contain:
- Buttons for "Bypass course" and "Solve Quiz"
- Input field for Gemini API key
- Configuration options

### Icons
```json
"icons": {
  "128": "images/128.png",
  "16": "images/16.png",
  "48": "images/48.png",
  "32": "images/32.png"
}
```

Different icon sizes for various display contexts (toolbar, extension manager, etc.)

### Background Service Worker
```json
"background": {
  "service_worker": "background.js"
}
```

The background script (`background.js`) would run in the background and handle:
- API calls to Google's Gemini AI
- Processing quiz answers
- Managing extension state
- Coordinating between content scripts and popup

### Content Scripts
```json
"content_scripts": [
  {
    "run_at": "document_end",
    "matches": ["*://*.coursera.org/learn*"],
    "js": ["content.js"]
  },
  {
    "run_at": "document_start",
    "matches": ["*://*.coursera.org/learn*"],
    "js": ["interceptor.js"],
    "world": "MAIN"
  }
]
```

Two content scripts are injected into Coursera pages:

#### 1. content.js (Isolated World)
- **run_at**: "document_end" - Runs after the DOM is fully loaded
- **Purpose**: Manipulates the Coursera page DOM
- **Functions**:
  - Mark lectures as completed
  - Mark discussions as done
  - Mark reading materials as completed
  - Extract quiz questions
  - Auto-select correct quiz answers

#### 2. interceptor.js (Main World)
- **run_at**: "document_start" - Runs before the page loads
- **world**: "MAIN" - Runs in the page's JavaScript context (not isolated)
- **Purpose**: Intercept Coursera's API calls and responses
- **Functions**:
  - Monitor course progress API calls
  - Potentially bypass client-side validation
  - Access page's JavaScript variables and functions

### Host Permissions
```json
"host_permissions": ["*://*.coursera.org/*"]
```

Grants the extension permission to access all Coursera domains, necessary for:
- Injecting content scripts
- Making API requests
- Modifying page content

## 🔧 How the Extension Works

### 1. Course Bypass Flow
When a user clicks "Bypass course":

1. **content.js** identifies all course items in the left sidebar
2. For each item (video, reading, discussion):
   - Simulates user interaction
   - Triggers Coursera's completion API
   - Marks the item as done
3. Moves to the next item until all are completed

### 2. Quiz Solving Flow
When a user clicks "Solve Quiz":

1. **content.js** extracts:
   - Quiz questions
   - Available options (for MCQ)
2. Sends questions to **background.js**
3. **background.js**:
   - Calls Google Gemini AI API with the question
   - Receives AI-generated answer
4. **content.js**:
   - Selects the correct option
   - Submits the quiz

### 3. Data Storage
Uses Chrome's storage API to persist:
- User's Gemini API key
- Extension settings/preferences
- Course progress tracking

## 🤖 AI Integration

The extension uses **Google Gemini AI** to solve quiz questions:

1. User provides their Gemini API key
2. Key is stored securely using Chrome's storage API
3. When solving quizzes:
   - Question text is sent to Gemini
   - AI analyzes and returns the most likely correct answer
   - Extension auto-selects the answer

### API Key Setup Process
1. Visit https://aistudio.google.com/apikey
2. Create a new API key
3. Paste into extension's popup UI
4. Extension stores it for future use

## ⚠️ Important Notes

### Educational Purpose Disclaimer
The project README includes a caution:
> "This project is intended for educational purposes only. The author does not condone or support any cheating in any kind of course or certification and is not responsible for any misuse."

### Current Repository State
**Note**: The actual JavaScript files (`background.js`, `content.js`, `interceptor.js`, `popup.html`) referenced in `manifest.json` are **not included** in this repository. Users would need to:
1. Download the extension package from the releases
2. Extract it to access the complete source code
3. Or build it themselves if they have access to the full source

## 🎯 Main Features Explained

### 1. Bypass Lectures
- Automatically marks video lectures as watched
- Simulates video completion events
- Updates course progress server-side

### 2. Bypass Discussions
- Marks discussion forums as viewed/completed
- Bypasses reading requirements

### 3. Bypass Readings
- Marks reading materials as completed
- Skips mandatory reading checkpoints

### 4. Auto Quiz (MCQ only)
- Extracts multiple-choice questions
- Uses AI to determine correct answers
- Auto-selects and submits answers
- **Limitation**: Only works with single-choice MCQs

### 5. Custom API Key
- Allows users to use their own Gemini API key
- Ensures privacy (no third-party key sharing)
- User controls their API usage and costs

## 🔒 Security Considerations

1. **API Key Storage**: Stored in Chrome's local storage (not encrypted by default)
2. **Permissions**: Limited to Coursera domains only
3. **Data Privacy**: Questions and answers are sent to Google's Gemini AI
4. **Host Permissions**: Full access to Coursera pages

## 📦 Installation Process

1. Download extension from GitHub releases
2. Extract the ZIP file
3. Open `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select extracted folder
7. Extension is now installed

## 🚀 Usage Workflow

1. Navigate to a Coursera course page
2. Click the extension icon in toolbar
3. For course completion:
   - Click "Bypass course" button
   - Wait for completion
   - Reload the page
4. For quiz solving:
   - Open a quiz
   - Click "Solve Quiz" button
   - Extension auto-selects answers

## 🛠️ Technology Stack

- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: JavaScript, HTML, CSS (assumed)
- **APIs**:
  - Chrome Extension APIs (storage, tabs, activeTab)
  - Google Gemini AI API
  - Coursera's internal APIs (accessed via interceptor)

## 📝 License

MIT License - Open source and free to use/modify

---

## Summary

Auto Coursera is a browser automation tool disguised as a browser extension that:
- Automates course completion on Coursera
- Uses AI to solve quiz questions
- Operates through content script injection and API interception
- Requires user's own Gemini API key for quiz solving
- Works only on Chromium-based browsers

The extension demonstrates advanced browser extension techniques including content script injection in multiple worlds, service workers, and AI API integration, though it raises ethical questions about academic integrity.
