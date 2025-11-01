"""
QIVO Intelligence Layer - FastAPI Application
API principal para módulos de inteligência artificial
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import ai
from app.modules.bridge.routes import router as bridge_router

# Inicializar FastAPI
app = FastAPI(
    title="QIVO Intelligence API",
    description="API de Inteligência Artificial para análise de conformidade regulatória em mineração",
    version="4.0.0",
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
app.include_router(bridge_router)


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "name": "QIVO Intelligence API",
        "version": "4.0.0",
        "status": "active",
        "docs": "/docs",
        "modules": [
            "✅ validator - Validação de conformidade (ATIVO)",
            "✅ bridge - Tradução normativa cross-norm (ATIVO - NOVO!)",
            "🔜 radar - Monitoramento regulatório (em breve)",
            "🔜 manus - Relatórios automáticos (em breve)"
        ]
    }


@app.get("/health")
async def health():
    """Health check geral"""
    return {
        "status": "healthy",
        "api_version": "4.0.0",
        "active_modules": ["validator", "bridge"]
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
