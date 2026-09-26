"""
Vercel Serverless Entry Point for CivicLens FastAPI Backend.
Exports FastAPI app for /api/index.
"""
import sys
import os

current_dir = os.path.abspath(os.path.dirname(__file__))
app_dir = os.path.join(current_dir, "_app")

if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

import _app as app_pkg
sys.modules['app'] = app_pkg
import _app.config as app_config
sys.modules['app.config'] = app_config
import _app.services as app_services
sys.modules['app.services'] = app_services
import _app.routes as app_routes
sys.modules['app.routes'] = app_routes

from _app.main import app as fastapi_app

app = fastapi_app
handler = fastapi_app
