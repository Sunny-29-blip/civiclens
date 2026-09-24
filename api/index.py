"""
Vercel Serverless Entry Point for CivicLens FastAPI Backend.
Vercel expects a file at /api/index.py that exports the ASGI app as `app`.
"""
import sys
import os

# Add the project root and backend to the Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from backend.app.main import app
