from flask import Flask
from app.initialize_functions import initialize_route
from flask_cors import CORS
import logging
import traceback

def create_app(env: str = "development") -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    is_dev = env == "development"

    app.config.update(
        DEBUG=is_dev,
        ENV=env,
        PROPAGATE_EXCEPTIONS=is_dev
    )

    # =========================
    # LOGGING (Docker-friendly)
    # =========================
    logging.basicConfig(
        level=logging.DEBUG if is_dev else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler()]
    )

    app.logger.setLevel(logging.DEBUG if is_dev else logging.INFO)

    # =========================
    # REGISTRO DE ROTAS
    # =========================
    initialize_route(app)

    app.logger.info("🚀 Flask app iniciado com logging ativo")

    return app

