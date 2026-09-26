"""
Vercel Serverless Entry Point for CivicLens FastAPI Backend.
Vercel expects a file at /api/index.py that exports the ASGI app as `app`.
"""
import sys
import os

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "backend")
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from backend.app.main import app
except ImportError:
    from app.main import app

