"""
Vercel Serverless Entry Point for CivicLens FastAPI Backend.
Vercel expects a file at /api/index.py that exports the ASGI app as `app`.
"""
import sys
import os

api_dir = os.path.abspath(os.path.dirname(__file__))
root_dir = os.path.abspath(os.path.join(api_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for p in [api_dir, root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except ImportError:
    from backend.app.main import app

handler = app
