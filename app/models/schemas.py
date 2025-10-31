from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ManusRunTaskRequest(BaseModel):
    task: str = Field(..., description="Nome canônico da automação no Manus (ex.: 'audit.run', 'bridge.convert')")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Parâmetros da tarefa")
    timeout: Optional[int] = Field(default=20, description="Timeout em segundos (opcional)")

class ManusRunTaskResponse(BaseModel):
    ok: bool = True
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: Optional[int] = None
