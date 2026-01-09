from flask import Flask
from app.modules.main.route import main_bp


def initialize_route(app: Flask):
    with app.app_context():
        app.register_blueprint(main_bp, url_prefix='/api/v1/main')