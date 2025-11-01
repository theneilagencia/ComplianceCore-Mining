"""
QIVO Intelligence Layer - API Routes
Endpoints para análise de documentos com AI
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import tempfile
from pathlib import Path

from src.ai.core.validator import ValidatorAI

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

# Instância global do Validator
validator = None


def get_validator():
    """Lazy initialization do ValidatorAI"""
    global validator
    if validator is None:
        validator = ValidatorAI()
    return validator


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


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Analisa documento técnico para conformidade regulatória
    
    Formatos suportados: PDF, DOCX, TXT
    
    Retorna:
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
    
    Body:
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
    """Health check do módulo AI"""
    try:
        api_key = os.getenv('OPENAI_API_KEY')
        
        return {
            'status': 'healthy',
            'module': 'QIVO Intelligence Layer',
            'validator': 'active',
            'openai_configured': bool(api_key),
            'timestamp': ValidatorAI()._get_timestamp() if api_key else None
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }


@router.get("/capabilities")
async def get_capabilities():
    """Retorna capacidades do módulo AI"""
    return {
        'modules': {
            'validator': {
                'status': 'active',
                'description': 'Validação de conformidade regulatória',
                'standards': ['JORC', 'NI 43-101', 'PRMS'],
                'formats': ['PDF', 'DOCX', 'TXT']
            },
            'bridge': {
                'status': 'coming_soon',
                'description': 'Tradução jurídico ↔ técnico'
            },
            'radar': {
                'status': 'coming_soon',
                'description': 'Monitoramento regulatório'
            },
            'manus': {
                'status': 'coming_soon',
                'description': 'Relatórios automáticos'
            }
        },
        'endpoints': {
            '/ai/analyze': 'POST - Analisa arquivo',
            '/ai/analyze/text': 'POST - Analisa texto direto',
            '/ai/health': 'GET - Status do sistema',
            '/ai/capabilities': 'GET - Capacidades disponíveis'
        }
    }
