FROM python:3.10-slim

WORKDIR /code

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt \
    && pip install --no-cache-dir fastapi uvicorn python-dotenv google-generativeai \
    && pip install --no-cache-dir https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz

COPY . .

# Hugging Face Spaces use port 7860 by default
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
