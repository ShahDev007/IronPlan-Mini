import sys
import os

# Add the repo root to sys.path so `from backend.xxx import ...` works
# inside the serverless function context on Vercel.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.main import app  # noqa: F401 — Vercel discovers `app` here
