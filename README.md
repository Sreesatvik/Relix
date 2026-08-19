# Relix // Production Disruption Early Warning System

An AI-Enabled Production Disruption Early Warning System for manufacturing plant monitoring.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

---

### Terminal 1: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Unix/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables in `backend/.env` (see `backend/.env` example):
   ```env
   OPENAI_API_KEY="your-api-key"
   OPENAI_BASE_URL="https://api.openai.com/v1"
   LLM_MODEL="gpt-4o-mini"
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

---

### Terminal 2: Frontend Setup
1. Install dependencies from the project root:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests
To run the backend integration, API, and E2E tests:
```bash
cd backend
python -m pytest
```

