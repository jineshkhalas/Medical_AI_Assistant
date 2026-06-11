import pandas as pd
import re
import os

def clean_med_data(input_csv, output_csv):
    df_raw = pd.read_csv(input_csv)
    print("File Loaded Successfully! Processing Data...")

    clean_questions = []
    clean_answers = []

    for idx, row in df_raw.iterrows():
        text_block = str(row["Answer"])

        que_match = re.search(r'Question:\s*(.*?)\nURL:', text_block, re.DOTALL)

        ans_match = re.search(r'Answer:\s*(.*)', text_block, re.DOTALL)

        if que_match and ans_match:
            extracted_question = que_match.group(1).strip()
            extracted_answer = ans_match.group(1).strip().rstrip(')')

            clean_questions.append(extracted_question)
            clean_answers.append(extracted_answer)

    df_clean = pd.DataFrame({
        'Question': clean_questions,
        'Answer': clean_answers
    })

    df_clean = df_clean.drop_duplicates(subset=['Question'])

    df_clean.to_csv(output_csv, index = False)
    print("Cleaning Data completed")
    print(f"Save to {output_csv}")

input_file_name = 'D:\D Drive Documents\Programming_D\Projects\ML_Projects\Elevance_Projects_DataScience\MedicalQA_Chatbot\MedQA_Dataset.csv'
output_file_name = 'MedQA_Clean_Dataset.csv'

if os.path.exists(input_file_name):
    clean_med_data(input_file_name, output_file_name)
else: 
    print(f"Error: I cannot find '{input_file_name}'. Make sure it is in the same folder as this script.")