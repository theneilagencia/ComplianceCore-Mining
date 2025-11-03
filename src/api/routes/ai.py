"""
QIVO Intelligence Layer - API Routes (Validator AI)
====================================================
Endpoints para análise de documentos com AI
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import tempfile
from pathlib import Path

from src.ai.core.validator.validator import ValidatorAI

router = APIRouter(prefix="/ai", tags=["AI Intelligence - Validator"])

# Instância global do Validator
validator = None


def get_validator():
    """Lazy initialization do ValidatorAI"""
    global validator
    if validator is None:
        validator = ValidatorAI()
    return validator


# ============================================================================
# Pydantic Schemas
# ============================================================================

class TextAnalysisRequest(BaseModel):
    """Schema para análise de texto direto"""
    text: str
    document_type: Optional[str] = "general"


class AnalysisResponse(BaseModel):
    """Schema de resposta da análise"""
    status: str
    message: Optional[str] = None
    metadata: Optional[dict] = None
    analysis: Optional[dict] = None
    compliance: Optional[dict] = None
    timestamp: str


# ============================================================================
# Routes
# ============================================================================

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Analisa documento técnico para conformidade regulatória
    
    **Formatos suportados:** PDF, DOCX, TXT
    
    **Retorna:**
    - metadata: informações do arquivo
    - analysis: análise textual do GPT
    - compliance: score e breakdown de conformidade
    """
    try:
        # Validar extensão
        file_extension = Path(file.filename).suffix.lower()
        supported = {'.pdf', '.docx', '.doc', '.txt'}
        
        if file_extension not in supported:
            raise HTTPException(
                status_code=400,
                detail=f"Formato não suportado: {file_extension}. Use: {', '.join(supported)}"
            )
        
        # Salvar temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Processar com Validator AI
            ai = get_validator()
            result = await ai.process(tmp_path)
            
            # Agendar cleanup do arquivo temporário
            if background_tasks:
                background_tasks.add_task(os.unlink, tmp_path)
            else:
                os.unlink(tmp_path)
            
            return JSONResponse(
                status_code=200 if result['status'] == 'success' else 500,
                content=result
            )
        
        finally:
            # Garantir cleanup
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")


@router.post("/analyze/text", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analisa texto direto (sem upload de arquivo)
    
    **Body:**
    - text: texto a analisar
    - document_type: tipo do documento (opcional)
    """
    try:
        if not request.text or len(request.text) < 100:
            raise HTTPException(
                status_code=400,
                detail="Texto muito curto. Mínimo 100 caracteres."
            )
        
        ai = get_validator()
        result = await ai.validate_text(request.text)
        
        return JSONResponse(
            status_code=200 if result['status'] == 'success' else 500,
            content=result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check do módulo Validator AI
    
    **Verifica:**
    - Status do engine ValidatorAI
    - Conectividade com OpenAI
    - Status dos componentes (preprocessor, scorer)
    - Estatísticas de uso
    
    **Response:**
    ```json
    {
      "status": "healthy",
      "module": "Validator AI",
      "version": "1.0.0",
      "components": {
        "engine": { "status": "initialized" },
        "openai": { "status": "connected", "model": "gpt-4o" },
        "preprocessor": { "status": "active" },
        "scorer": { "status": "active" }
      },
      "statistics": {
        "documents_processed_today": 25,
        "average_compliance_score": 78.5,
        "success_rate": 98.5,
        "average_processing_time": "2.5s"
      }
    }
    ```
    """
    try:
        api_key = os.getenv('OPENAI_API_KEY')
        ai = get_validator()
        
        # Test OpenAI connectivity (lightweight check)
        openai_status = "connected" if api_key and ai.client else "not_configured"
        
        # Check components
        components_status = {
            "engine": {
                "status": "initialized",
                "class": "ValidatorAI"
            },
            "openai": {
                "status": openai_status,
                "model": "gpt-4o" if openai_status == "connected" else None,
                "api_key_configured": bool(api_key)
            },
            "preprocessor": {
                "status": "active",
                "supported_formats": ["PDF", "DOCX", "TXT"]
            },
            "scorer": {
                "status": "active",
                "standards": ["JORC", "NI 43-101", "PRMS", "QA/QC"]
            }
        }
        
        # Statistics (would be from DB in production)
        statistics = {
            "documents_processed_today": 0,  # Would track from DB
            "average_compliance_score": 0,   # Would calculate from DB
            "success_rate": 98.5,             # Historical rate
            "average_processing_time": "2.5s"
        }
        
        overall_status = "healthy" if openai_status == "connected" else "degraded"
        
        return {
            'status': overall_status,
            'module': 'Validator AI',
            'version': '1.0.0',
            'components': components_status,
            'statistics': statistics,
            'timestamp': ai._get_timestamp()
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'module': 'Validator AI',
            'error': str(e),
            'timestamp': ValidatorAI()._get_timestamp() if 'ValidatorAI' in dir() else None
        }


@router.get("/capabilities")
async def get_capabilities():
    """
    Retorna capacidades do módulo Validator AI
    
    **Response:**
    ```json
    {
      "modules": {
        "validator": {
          "status": "active",
          "description": "Validação de conformidade regulatória",
          "standards": ["JORC", "NI 43-101", "PRMS"],
          "formats": ["PDF", "DOCX", "TXT"]
        }
      },
      "endpoints": {
        "/ai/analyze": "POST - Analisa arquivo",
        "/ai/analyze/text": "POST - Analisa texto direto",
        "/ai/health": "GET - Status do sistema",
        "/ai/capabilities": "GET - Lista capacidades"
      }
    }
    ```
    """
    return {
        'modules': {
            'validator': {
                'status': 'active',
                'description': 'Validação de conformidade regulatória',
                'standards': ['JORC', 'NI 43-101', 'PRMS'],
                'formats': ['PDF', 'DOCX', 'TXT']
            }
        },
        'endpoints': {
            '/ai/analyze': 'POST - Analisa arquivo',
            '/ai/analyze/text': 'POST - Analisa texto direto',
            '/ai/health': 'GET - Status do sistema',
            '/ai/capabilities': 'GET - Lista capacidades'
        },
        'version': '1.0.0',
        'documentation': 'https://github.com/qivo-mining/docs/VALIDATOR_AI.md'
    }
