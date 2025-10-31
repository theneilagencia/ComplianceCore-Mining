from flask import Flask
from dotenv import load_dotenv
from app.extensions import db, migrate  # ✅ extensão centralizada

load_dotenv()


def create_app():
    """
    Fábrica principal da aplicação Flask.
    Responsável por inicializar extensões, registrar blueprints e carregar módulos.
    """
    app = Flask(__name__)

    # Configuração do banco de dados (SQLite local)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///compliance.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Inicializa extensões globais
    db.init_app(app)
    migrate.init_app(app, db)

    # Importa modelos para registro no contexto do SQLAlchemy
    # ⚠️ Importar aqui evita circular import
    from app.modules.reports import models as reports_models

    # Importar e registrar blueprints
    from app.modules.radar.routes import radar_bp
    from app.modules.reports.routes import reports_bp
    from app.modules.audit.routes import audit_bp
    from app.modules.bridge.routes import bridge_bp
    from app.modules.admin.routes import admin_bp
    from app.modules.manus.routes import manus_bp
    from app.modules.validator.routes import validator_bp

    app.register_blueprint(radar_bp, url_prefix="/radar")
    app.register_blueprint(reports_bp, url_prefix="/reports")
    app.register_blueprint(audit_bp, url_prefix="/audit")
    app.register_blueprint(bridge_bp, url_prefix="/bridge")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(manus_bp, url_prefix="/manus")
    app.register_blueprint(validator_bp, url_prefix="/validator")

    # Endpoint raiz simples
    @app.route("/")
    def home():
        return {
            "status": "QIVO backend modular running 🚀",
            "mode": "production"
        }

    return app


# Instância principal do app Flask
app = create_app()
