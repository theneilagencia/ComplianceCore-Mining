"""
QIVO Intelligence Layer - FastAPI Application
API principal para módulos de inteligência artificial
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import ai

# Inicializar FastAPI
app = FastAPI(
    title="QIVO Intelligence API",
    description="API de Inteligência Artificial para análise de conformidade regulatória em mineração",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas
app.include_router(ai.router)


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "name": "QIVO Intelligence API",
        "version": "3.0.0",
        "status": "active",
        "docs": "/docs",
        "modules": [
            "validator - Validação de conformidade",
            "bridge - Tradução jurídico/técnico (em breve)",
            "radar - Monitoramento regulatório (em breve)",
            "manus - Relatórios automáticos (em breve)"
        ]
    }


@app.get("/health")
async def health():
    """Health check geral"""
    return {
        "status": "healthy",
        "api_version": "3.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_ai:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
