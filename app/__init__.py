import os
from flask import Flask
from dotenv import load_dotenv
from app.extensions import db, migrate  # ✅ Extensões centralizadas

load_dotenv()


def create_app():
    app = Flask(__name__)

    # 🔧 Garante que o banco fique na raiz do projeto (não em /instance)
    app.instance_path = "."
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///compliance.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Inicializa extensões
    db.init_app(app)
    migrate.init_app(app, db)

    # Importa e registra todos os módulos (blueprints)
    from app.modules.radar.routes import radar_bp
    from app.modules.reports.routes import reports_bp
    from app.modules.audit.routes import audit_bp
    from app.modules.bridge.routes import bridge_bp
    from app.modules.admin.routes import admin_bp
    from app.modules.manus.routes import manus_bp
    from app.modules.validator.routes import validator_bp  # ✅ novo módulo IA

    app.register_blueprint(radar_bp, url_prefix="/radar")
    app.register_blueprint(reports_bp, url_prefix="/reports")
    app.register_blueprint(audit_bp, url_prefix="/audit")
    app.register_blueprint(bridge_bp, url_prefix="/bridge")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(manus_bp, url_prefix="/manus")
    app.register_blueprint(validator_bp, url_prefix="/validator")

    # ✅ define a rota raiz **depois de criar o app**
    @app.route("/")
    def home():
        return {
            "status": "QIVO backend modular running 🚀",
            "mode": "production",
            "database": app.config["SQLALCHEMY_DATABASE_URI"]
        }

    return app


# ✅ cria a instância principal do Flask app
app = create_app()
