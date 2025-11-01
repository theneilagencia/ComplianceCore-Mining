"""
Aplicação Flask para o Radar Regulatório.
"""

from flask import Flask
from flask_cors import CORS
import logging
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def create_app():
    """Cria e configura a aplicação Flask."""
    app = Flask(__name__)
    
    # CORS para permitir frontend
    CORS(app)
    
    # Configurações
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['DATABASE_URL'] = os.getenv('DATABASE_URL', 
        'postgresql://qivo_mining_user:Rf5NbORtZ1Opy88ah1cTCdE8TUxxEpq3@dpg-d3sjth6uk2gs73fqop30-a.oregon-postgres.render.com/qivo_mining')
    
    # Registrar blueprints
    from app.modules.radar_regulatory.routes import radar_bp
    app.register_blueprint(radar_bp)
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'QIVO Radar Regulatory'}
    
    logger.info("Aplicação Flask Radar Regulatory iniciada")
    
    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
