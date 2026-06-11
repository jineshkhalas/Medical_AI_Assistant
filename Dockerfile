FROM python:3.10-slim

# Set up user with UID 1000 (standard for HF Spaces)
RUN useradd -m -u 1000 user

WORKDIR /home/user/app

# Set environment variables for huggingface cache and home path
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/tmp/huggingface

# Copy requirements and install dependencies
COPY --chown=user backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt \
    && pip install --no-cache-dir fastapi uvicorn python-dotenv groq \
    && pip install --no-cache-dir https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz

# Copy backend files to work directory with correct ownership
COPY --chown=user backend/ /home/user/app/

# Switch to non-root user
USER user

# Hugging Face Spaces use port 7860 by default
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
