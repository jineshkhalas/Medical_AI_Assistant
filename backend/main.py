import pandas as pd
from sentence_transformers import SentenceTransformer, util
import spacy
from duckduckgo_search import DDGS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import re
import json

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def setup_chatbot_brain(csv_path):
    print("Waking up the AI and loading the medical data...")
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"Error: Could not find {csv_path}.")
        return None, None, None, None

    print("Loading Sentence Transformer (for meaning)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    print("Loading SciSpaCy Medical Entity Recognizer...")
    try:
        ner_model = spacy.load("en_core_sci_sm")
    except OSError:
        print("Error: SciSpaCy model not found.")
        return None, None, None, None

    print("Converting medical questions into mathematical vectors...")
    database_embeddings = model.encode(df['Question'].tolist(), convert_to_tensor=True)
    
    print("Brain is fully loaded and ready!")
    return df, model, database_embeddings, ner_model

def extract_medical_terms(text, ner_model):
    doc = ner_model(text)
    entities = [ent.text for ent in doc.ents]
    return list(set(entities))

def is_medical_query(user_query):
    prompt = f"""
    You are a strict domain classifier for a healthcare application.
    Analyze the following user query: "{user_query}"
    
    Determine if this query relates to medicine, healthcare, biology, anatomy, diseases, symptoms, treatments, drugs, human wellness, or is a standard greeting/polite conversation starter (e.g. 'hello', 'hi', 'how are you').
    
    Note: The query may contain typos or spelling mistakes (e.g. 'gynecomestia' instead of 'gynecomastia'). Please ignore these typos and classify based on the user's apparent intent.
    
    Respond with EXACTLY a JSON object:
    {{
      "is_medical": true or false,
      "reason": "brief explanation"
    }}
    """
    
    try:
        model = genai.GenerativeModel("gemini-3.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        content = response.text.strip()
        
        try:
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                if "is_medical" in data:
                    return bool(data["is_medical"])
        except Exception:
            pass
            
        content_upper = content.upper()
        has_yes = bool(re.search(r'\b(YES|TRUE)\b', content_upper))
        has_no = bool(re.search(r'\b(NO|FALSE)\b', content_upper))
        
        if has_no and not has_yes:
            return False
        return True
        
    except Exception as e:
        print(f"Gemini Guardrail Error: {e}")
        return True

def search_the_web(query):
    print("\n[Web Search] Searching the live web...")
    web_context = ""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
            if results:
                for idx, res in enumerate(results):
                    web_context += f"Source {idx+1}: {res['body']}\n"
                
                return web_context
            else:
                return None
    except Exception as e:
        print(f"\n[Web Search Error] Details: {e}") 
        return None

def synthesize_answer(user_query, context, source_name):
    print(f"Synthesizing and verifying answer using Gemini ({source_name})...")
    
    prompt = f"""
    You are a highly intelligent medical AI assistant.
    The user asked this question: "{user_query}"
    
    Here is the retrieved context from the {source_name}:
    {context}
    
    Your Task:
    1. Read the retrieved context to see if it contains useful facts.
    2. Write a single, highly readable, grammatically correct answer to the user's question.
    3. If the context contains good information, use it. If the context is irrelevant garbage, ignore it and simply answer the user's question using your own expert medical knowledge.
    """
    
    try:
        model = genai.GenerativeModel("gemini-3.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"*(Note: Gemini API failed. Error: {e})*\n\n{context}"

def ask_question(user_query, df, model, database_embeddings, ner_model):
    
    med_check = is_medical_query(user_query)
    
    if med_check is None:
        return "⚠️ System Alert: The AI servers are experiencing maximum traffic. Please try your question again in a minute.", "System Fallback", 0.0, []
    elif med_check is False:
        return "I am trained for medical questions only.", "System Guardrail", 1.0, []

    medical_terms = extract_medical_terms(user_query, ner_model)
    
    query_embedding = model.encode(user_query, convert_to_tensor=True)
    search_results = util.semantic_search(query_embedding, database_embeddings, top_k=1)
    
    best_match = search_results[0][0]
    best_index = best_match['corpus_id']
    score = best_match['score']
    
    db_answer = df.iloc[best_index]['Answer']
    
    final_answer = ""
    source_used = ""

    if score >= 0.65:
        final_answer = synthesize_answer(user_query, db_answer, "Database")
        source_used = "Database"
            
    if score < 0.65:
        web_data = search_the_web(user_query)
        if web_data:
            final_answer = synthesize_answer(user_query, web_data, "Web + AI Knowledge")
            source_used = "Web + AI Knowledge"
        else:
            final_answer = "I'm sorry, my web search failed to return any results."
            source_used = "None"

    return final_answer, source_used, score, medical_terms


if __name__ == '__main__':
    csv_file = 'MedQA_Clean_Dataset.csv' 

    df, model, database_embeddings, ner_model = setup_chatbot_brain(csv_file)

    if df is not None:
        print("\n" + "="*50)
        print("Welcome to the Medical AI Test Terminal (V5.2 - Perfected Guardrails)!")
        print("Type 'exit' to quit.")
        print("="*50 + "\n")
        
        while True:
            user_input = input("\nYou: ")
            
            if user_input.lower() == 'exit':
                print("Shutting down...")
                break
                
            final_ans, source, confidence, terms = ask_question(user_input, df, model, database_embeddings, ner_model)
            
            print("\n" + "-"*40)
            print(f"Bot: {final_ans}")
            print(f"Source({source.lower()})")
            print("-"*40)