from flask import Flask
from app.initialize_functions import initialize_route
from flask_cors import CORS

def create_app(config=None) -> Flask:
    """
    Create a Flask application.

    Args:
        config: The configuration object to use.

    Returns:
        A Flask application instance.
    """
    app = Flask(__name__)
    cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    initialize_route(app)
    return app
