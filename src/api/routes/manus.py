"""
Manus AI - FastAPI Routes
==========================
REST API endpoints for AI-powered report generation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from src.ai.core.manus.engine import get_manus_engine, ManusEngine

router = APIRouter(prefix="/api/manus", tags=["Manus AI"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ReportGenerationRequest(BaseModel):
    """Request for generating complete report"""
    template: str = Field(
        ...,
        description="Template ID (jorc_2012, ni_43_101, prms)",
        example="jorc_2012"
    )
    project_name: str = Field(
        ...,
        description="Project name",
        example="Projeto Mineração XYZ"
    )
    commodity: Optional[str] = Field(
        default="Gold",
        description="Primary commodity",
        example="Gold"
    )
    location: Optional[str] = Field(
        default="Unknown",
        description="Project location",
        example="Minas Gerais, Brasil"
    )
    data: Dict[str, Any] = Field(
        default={},
        description="Project data (geology, resources, mining plan, etc.)"
    )
    format: str = Field(
        default="json",
        description="Output format (json, text, html)",
        example="json"
    )


class SectionGenerationRequest(BaseModel):
    """Request for generating single section"""
    section_name: str = Field(
        ...,
        description="Section name to generate",
        example="Geology and Geological Interpretation"
    )
    template: str = Field(
        ...,
        description="Template ID",
        example="jorc_2012"
    )
    project_name: str = Field(
        ...,
        description="Project name",
        example="Projeto XYZ"
    )
    data: Dict[str, Any] = Field(
        default={},
        description="Section-specific data"
    )


class ReportResponse(BaseModel):
    """Response for report generation"""
    status: str
    template: Optional[str] = None
    template_name: Optional[str] = None
    sections: Optional[int] = None
    quality: Optional[Dict] = None
    metadata: Optional[Dict] = None
    content: Optional[str] = None
    sections_data: Optional[List[Dict]] = None
    message: Optional[str] = None
    timestamp: str


# ============================================================================
# Routes
# ============================================================================

@router.post("/generate", response_model=ReportResponse)
async def generate_report(request: ReportGenerationRequest):
    """
    Generate complete technical report from template.
    
    **Supported Templates:**
    - `jorc_2012` - JORC Code 2012 (19 sections)
    - `ni_43_101` - NI 43-101 Technical Report (30 sections)
    - `prms` - PRMS Executive Summary (7 sections)
    
    **Example Request:**
    ```json
    {
      "template": "jorc_2012",
      "project_name": "Projeto Ouro Minas",
      "commodity": "Gold",
      "location": "Minas Gerais, Brasil",
      "data": {
        "geology": {
          "rock_type": "Greenstone belt",
          "mineralization": "Orogenic gold"
        },
        "resources": {
          "indicated": "1.5M tonnes @ 2.5 g/t Au",
          "inferred": "0.5M tonnes @ 2.0 g/t Au"
        }
      },
      "format": "json"
    }
    ```
    
    **Response:**
    - `status`: "success" or "error"
    - `sections`: Number of sections generated
    - `quality`: Quality control scores
    - `content`: Full report content (if format is text/html)
    - `sections_data`: Individual sections (if format is json)
    
    **Processing Time:**
    - JORC 2012: ~30-60 seconds (19 sections)
    - NI 43-101: ~60-90 seconds (30 sections)
    - PRMS: ~15-30 seconds (7 sections)
    
    **Cost (OpenAI):**
    - ~$0.50-$1.50 per report (depending on template)
    """
    try:
        manus = get_manus_engine()
        
        project_data = {
            'project_name': request.project_name,
            'commodity': request.commodity,
            'location': request.location,
            'data': request.data
        }
        
        result = await manus.generate_report(
            template=request.template,
            project_data=project_data,
            format=request.format
        )
        
        return ReportResponse(**result)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )


@router.post("/section")
async def generate_section(request: SectionGenerationRequest):
    """
    Generate single section of a report.
    
    Useful for:
    - Updating specific sections without regenerating entire report
    - Testing section generation
    - Iterative report building
    
    **Example Request:**
    ```json
    {
      "section_name": "Geology and Geological Interpretation",
      "template": "jorc_2012",
      "project_name": "Projeto XYZ",
      "data": {
        "rock_type": "Greenstone belt",
        "mineralization": "Orogenic gold",
        "structural_controls": "Shear zones"
      }
    }
    ```
    
    **Response:**
    ```json
    {
      "status": "success",
      "section_name": "Geology and Geological Interpretation",
      "content": "... generated content ...",
      "word_count": 750,
      "timestamp": "2025-11-03T..."
    }
    ```
    
    **Processing Time:** ~3-5 seconds per section
    **Cost:** ~$0.05 per section
    """
    try:
        manus = get_manus_engine()
        
        project_data = {
            'project_name': request.project_name,
            'data': request.data
        }
        
        content = await manus.generate_section(
            section_name=request.section_name,
            template=request.template,
            project_data=project_data
        )
        
        return {
            'status': 'success',
            'section_name': request.section_name,
            'template': request.template,
            'content': content,
            'word_count': len(content.split()),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating section: {str(e)}"
        )


@router.get("/templates")
async def list_templates():
    """
    List all available report templates.
    
    **Response:**
    ```json
    {
      "status": "success",
      "templates": [
        {
          "id": "jorc_2012",
          "name": "JORC Code 2012",
          "full_name": "Australasian Code for Reporting...",
          "standard": "JORC",
          "sections": 19,
          "jurisdiction": "Australia"
        },
        {
          "id": "ni_43_101",
          "name": "NI 43-101 Technical Report",
          "full_name": "National Instrument 43-101...",
          "standard": "NI 43-101",
          "sections": 30,
          "jurisdiction": "Canada"
        },
        {
          "id": "prms",
          "name": "PRMS Executive Summary",
          "full_name": "Petroleum Resources Management System",
          "standard": "PRMS",
          "sections": 7,
          "jurisdiction": "International"
        }
      ],
      "total": 3
    }
    ```
    """
    try:
        manus = get_manus_engine()
        templates = manus.get_templates()
        
        return {
            'status': 'success',
            'templates': templates,
            'total': len(templates),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing templates: {str(e)}"
        )


@router.get("/templates/{template_id}/sections")
async def get_template_sections(template_id: str):
    """
    Get sections for a specific template.
    
    **Parameters:**
    - `template_id`: Template identifier (jorc_2012, ni_43_101, prms)
    
    **Example Response:**
    ```json
    {
      "status": "success",
      "template_id": "jorc_2012",
      "sections": [
        "Summary",
        "Introduction",
        "Geology and Geological Interpretation",
        ...
      ],
      "total": 19
    }
    ```
    """
    try:
        manus = get_manus_engine()
        sections = manus.get_template_sections(template_id)
        
        if not sections:
            raise HTTPException(
                status_code=404,
                detail=f"Template '{template_id}' not found"
            )
        
        return {
            'status': 'success',
            'template_id': template_id,
            'sections': sections,
            'total': len(sections),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting sections: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check for Manus AI module.
    
    **Response:**
    ```json
    {
      "status": "healthy",
      "module": "Manus AI",
      "version": "1.0.0",
      "components": {
        "engine": {
          "status": "initialized",
          "templates_loaded": 3
        },
        "openai": {
          "status": "connected",
          "model": "gpt-4o",
          "api_key_configured": true
        }
      },
      "templates": {
        "jorc_2012": {"sections": 19, "status": "available"},
        "ni_43_101": {"sections": 30, "status": "available"},
        "prms": {"sections": 7, "status": "available"}
      },
      "statistics": {
        "reports_generated_today": 0,
        "sections_generated_today": 0,
        "average_generation_time": "45s"
      },
      "timestamp": "2025-11-03T..."
    }
    ```
    
    **Status Values:**
    - `healthy`: All systems operational
    - `degraded`: OpenAI not configured (limited functionality)
    - `error`: Critical error
    """
    try:
        manus = get_manus_engine()
        
        # Check OpenAI configuration
        openai_status = "connected" if manus.client else "not_configured"
        api_key_configured = manus.api_key is not None
        
        # Get templates info
        templates_info = {}
        for template_id in ['jorc_2012', 'ni_43_101', 'prms']:
            sections = manus.get_template_sections(template_id)
            templates_info[template_id] = {
                'sections': len(sections),
                'status': 'available'
            }
        
        overall_status = "healthy" if openai_status == "connected" else "degraded"
        
        return {
            'status': overall_status,
            'module': 'Manus AI',
            'version': '1.0.0',
            'components': {
                'engine': {
                    'status': 'initialized',
                    'templates_loaded': len(manus.templates)
                },
                'openai': {
                    'status': openai_status,
                    'model': 'gpt-4o' if openai_status == 'connected' else None,
                    'api_key_configured': api_key_configured
                }
            },
            'templates': templates_info,
            'statistics': {
                'reports_generated_today': 0,  # Would track from DB
                'sections_generated_today': 0,  # Would track from DB
                'average_generation_time': '45s'
            },
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    except Exception as e:
        return {
            'status': 'error',
            'module': 'Manus AI',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }


@router.post("/validate")
async def validate_report_content(
    content: str = Field(..., description="Report content to validate"),
    template: str = Field(..., description="Template ID")
):
    """
    Validate report content for quality and compliance.
    
    **Request:**
    ```json
    {
      "content": "... report content ...",
      "template": "jorc_2012"
    }
    ```
    
    **Response:**
    ```json
    {
      "status": "pass",
      "score": 85.5,
      "breakdown": {
        "compliance_score": 90,
        "technical_quality": 85,
        "completeness": 80,
        "presentation": 87
      },
      "statistics": {
        "word_count": 15000,
        "section_count": 19,
        "pages_estimate": 50
      },
      "issues": ["Minor formatting issues in section 5"],
      "recommendations": ["Consider adding more quantitative data"]
    }
    ```
    
    **Scoring:**
    - 90-100: Excellent (A+)
    - 80-89: Very Good (A)
    - 70-79: Good (B+)
    - 60-69: Satisfactory (B)
    - <60: Needs Review (C or lower)
    """
    try:
        manus = get_manus_engine()
        
        validation = await manus.validate_report(content, template)
        
        return {
            'status': validation.get('status', 'unknown'),
            'score': validation.get('score', 0),
            'breakdown': validation.get('breakdown', {}),
            'statistics': validation.get('statistics', {}),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating report: {str(e)}"
        )


# ============================================================================
# Utility Endpoints
# ============================================================================

@router.get("/test")
async def test_generation():
    """
    Quick test to verify Manus AI is working.
    
    Generates a single section to verify:
    - Engine initialization
    - OpenAI connectivity
    - Template loading
    
    **Response Time:** ~5 seconds
    """
    try:
        manus = get_manus_engine()
        
        # Test with simple section generation
        test_data = {
            'project_name': 'Test Project',
            'commodity': 'Gold',
            'location': 'Test Location',
            'data': {
                'summary': 'Test summary data'
            }
        }
        
        content = await manus.generate_section(
            section_name='Summary',
            template='jorc_2012',
            project_data=test_data
        )
        
        return {
            'status': 'success',
            'message': 'Manus AI is working correctly',
            'test_results': {
                'section_generated': True,
                'word_count': len(content.split()),
                'content_preview': content[:200] + '...'
            },
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Test failed: {str(e)}"
        )


@router.get("/status")
async def get_system_status():
    """
    Get detailed system status including recent activity.
    
    Similar to /health but with more operational details.
    """
    try:
        health = await health_check()
        
        return {
            **health,
            'recent_activity': {
                'last_report_generated': None,  # Would fetch from DB
                'last_section_generated': None,  # Would fetch from DB
                'total_reports': 0,              # Would fetch from DB
                'total_sections': 0              # Would fetch from DB
            },
            'capabilities': {
                'max_sections_per_report': 30,
                'supported_formats': ['json', 'text', 'html'],
                'future_formats': ['pdf', 'docx']  # Coming soon
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting status: {str(e)}"
        )
