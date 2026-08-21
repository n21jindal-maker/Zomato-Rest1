#!/bin/bash

# Install requirements
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
