from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import setup_chatbot_brain, ask_question
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from main import setup_chatbot_brain, ask_question

app = FastAPI(title="Medical QA API")

# Enable CORS for React (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df, model, database_embeddings, ner_model = None, None, None, None

@app.on_event("startup")
async def startup_event():
    global df, model, database_embeddings, ner_model
    print("[Brain] Initializing AI Brain... please wait.")
    CSV_PATH = os.path.join(os.path.dirname(__file__), 'MedQA_Clean_Dataset.csv')
    df, model, database_embeddings, ner_model = setup_chatbot_brain(CSV_PATH)
    print("[Brain] AI Brain is ready!")

class ChatRequest(BaseModel):
    message: str

@app.post("/ask")
async def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        ans, source, score, terms = ask_question(
            request.message, df, model, database_embeddings, ner_model
        )
        
        return {
            "answer": ans,
            "source": source,
            "confidence": float(score),
            "entities": terms
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
