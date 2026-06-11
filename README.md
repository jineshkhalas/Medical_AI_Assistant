# Agentic Medical Assistant Chatbot

## About
The Agentic Medical Assistant is an intelligent healthcare chatbot designed to provide accurate medical information. It combines semantic search over a curated local dataset with specialized Medical Named Entity Recognition (NER), a local LLM, and a live web search fallback. 

It features a modern **React (Vite) frontend** integrated with **Supabase** for user authentication and chat history persistence, communicating with a high-performance **FastAPI backend** that drives the AI brain.

---

## Features
- **Secure Authentication & Session History**: Powered by Supabase to handle user sign-ups, profile management, and securely persist consultation histories.
- **Strict Medical Guardrails**: Automatic domain classification using Llama 3 to deflect non-medical requests.
- **Biomedical Entity Extraction**: Utilizes SciSpaCy (`en_core_sci_sm`) to identify and extract medical terms from user inquiries.
- **Hybrid Semantic Search**: Uses Sentence-Transformers (`all-MiniLM-L6-v2`) to compute text embeddings and query the local medical dataset.
- **Smart Web Synthesis Fallback**: Automatically searches the live web via DuckDuckGo and synthesizes external facts if local dataset similarity is below `0.65`.
- **Modern UI/UX**: Responsive, dark-themed dashboard built with React 19 (Vite) and optimized CSS.

---

## Architecture & Tech Stack

### Frontend
- **Framework**: React 19 (via Vite)
- **Styling**: Vanilla CSS (Modern, dark-themed responsive UI with smooth transitions)
- **Database & Auth**: [Supabase](https://supabase.com) (handles sign-up, sign-in, user profiles, and secure storage of conversational histories)

### Backend
- **Framework**: FastAPI (Python)
- **LLM Engine**: Ollama (Llama 3) for domain classification and expert medical answers synthesis
- **Vector Search**: Sentence-Transformers (`all-MiniLM-L6-v2`) for semantic search of dataset
- **Clinical NLP & NER**: [SciSpaCy](https://allenai.github.io/scispacy/) (`en_core_sci_sm`) to extract biomedical entities
- **Search API**: DuckDuckGo Search (DDGS) as web fallback
- **Data Engine**: Pandas

---

## How it Works
1. **User Authentication**: Users sign up or sign in securely via Supabase.
2. **Conversation Persistence**: Once authenticated, the frontend fetches previous chat logs from Supabase.
3. **Query Guardrail**: When the user sends a query, the FastAPI backend uses Llama 3 to classify if the query is medical. Non-medical queries are deflected.
4. **Clinical NER**: SciSpaCy extracts medical terms from the query.
5. **Semantic Search**: The backend computes query embeddings and searches a local CSV dataset (`MedQA_Clean_Dataset.csv`) using cosine similarity.
   - **Confidence Score >= 0.65**: The closest matches are extracted and used to synthesize an answer.
   - **Confidence Score < 0.65**: The bot triggers a web search via DuckDuckGo, gathers real-time text snippets, and synthesizes a verified answer from the web context.
6. **Save to History**: The chatbot response is saved to Supabase under the active session.

---

## Project Structure
```text
MedicalQA_Chatbot/
├── backend/
│   ├── .env                    # Environment variables (GEMINI_API_KEY)
│   ├── api.py                  # FastAPI Application Entrypoint
│   ├── main.py                 # Core AI Logic & Terminal Mode
│   ├── data_prep.py            # Dataset cleaning and preprocessing script
│   ├── MedQA_Dataset.csv       # Raw medical dataset
│   ├── MedQA_Clean_Dataset.csv # Cleaned medical dataset
│   └── requirements.txt        # Backend dependencies
├── frontend/
│   ├── .env                    # Frontend environment keys (Supabase keys)
│   ├── index.html              # Entry HTML file
│   ├── package.json            # Node dependencies and scripts
│   ├── vite.config.js          # Vite compilation settings
│   ├── public/                 # Static assets
│   └── src/
│       ├── App.jsx             # React main application layout & logic
│       ├── App.css             # Main styling classes
│       ├── index.css           # Global typography & root variables
│       ├── main.jsx            # React root component hydration
│       └── supabaseClient.js   # Supabase client setup
├── .gitignore                  # Git ignore patterns
└── README.md                   # Project documentation
```

---

## Setup & Running the Application

### 1. Supabase Database Configuration
Before running the frontend, set up a Supabase project and create a `chats` table.
1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the following script to create the table and enable Row Level Security (RLS):
```sql
create table chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table chats enable row level security;

-- Create Policies to ensure users can only access their own chats
create policy "Users can insert their own chats" on chats 
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own chats" on chats 
  for select using (auth.uid() = user_id);

create policy "Users can update their own chats" on chats 
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chats" on chats 
  for delete using (auth.uid() = user_id);
```

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install backend packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Install FastAPI, Uvicorn, and Python-Dotenv (if not in requirements.txt):
   ```bash
   pip install fastapi uvicorn python-dotenv
   ```
5. Install the SciSpaCy pipeline:
   ```bash
   pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz
   ```
6. Make sure **Ollama** is running locally and has Llama 3 pulled:
   ```bash
   ollama pull llama3
   ```
7. Run the backend API:
   ```bash
   uvicorn api:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## Example Queries
- *What are the primary symptoms and diagnostic tests for Type 2 Diabetes?*
- *Explain the side effects and drug interactions of Lisinopril.*
- *What is the standard recommended treatment and recovery time for a common cold?*

---

## Author
Jinesh Khalas

---
*Disclaimer: This is an AI assistant for informational purposes only and does not replace professional medical advice.*
