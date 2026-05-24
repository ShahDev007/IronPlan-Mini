import sys
import os

# Point to backend/ so absolute imports (from db import ..., from models import ...) resolve correctly.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app  # noqa: F401
