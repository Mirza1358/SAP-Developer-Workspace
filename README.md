# SAP Dual-Pane Developer Workspace (AI Copilot)

This project is a specialized, web-based IDE workspace designed for SAP ABAP Developers and Functional Consultants. Unlike standard "ChatGPT wrappers," this tool features a true dual-pane IDE layout with an intelligent code-extraction engine.

## Features

- **Dual-Pane IDE Layout:** A professional split-screen interface mimicking enterprise IDEs like Eclipse ADT or VS Code.
- **Intelligent Code Extraction:** When the AI generates ABAP code, it is intercepted from the chat and rendered dynamically into a dedicated Right-Pane Code Editor, keeping the chat clean and readable.
- **Modern ABAP Enforcement:** The system prompt is engineered to enforce modern SAP ABAP 7.4+ syntax (inline declarations, modern Open SQL, VALUE operators).
- **Functional Module Expertise:** Tailored to map functional workflows (FI/CO, MM, SD) directly to the relevant SAP T-Codes and backend tables.
- **Code Syntax Highlighting:** Integrated ABAP syntax highlighting via highlight.js.
- **Fiori-Inspired Aesthetics:** Uses a muted, professional dark theme with SAP Blue and Gold accents.

## Tech Stack
- **Backend:** Python / Flask
- **AI Integration:** Groq API / LLaMA (or any OpenAI-compatible API)
- **Frontend:** Vanilla JS, CSS Grid, HTML5
- **Syntax Highlighting:** Highlight.js (Atom One Dark theme)

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd SAP_ABAP_Assistant
   ```

2. **Create a Virtual Environment (Optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add your API key:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

5. **Run the Application:**
   ```bash
   python app.py
   ```
   Open your browser and navigate to `http://127.0.0.1:5000`.

## How It Works
1. **Initialize Session:** Enter your Developer ID and Role (e.g., ABAP Developer) to configure the system prompt context.
2. **Copilot Sidebar:** Use the left pane to ask the AI questions regarding T-Codes, tables, or business processes.
3. **Editor Pane:** If you request code (e.g., "Write an ALV report for MARA"), the AI generates the ABAP code which is instantly pushed into the syntax-highlighted editor on the right for easy copying.

## Why this stands out
This tool was built to explicitly demonstrate domain knowledge in the SAP ecosystem. By instructing the LLM on specific architectural patterns (like avoiding legacy `TABLES` statements and utilizing object-oriented ABAP) and structuring the frontend as an IDE plugin rather than a consumer chat app, it showcases a deep understanding of enterprise developer workflows.
