from app.app import create_app
import os

env = os.getenv("FLASK_ENV", "development")
app = create_app(env)
