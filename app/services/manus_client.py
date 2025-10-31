import os
import time
import requests
from typing import Any, Dict, Optional

DEFAULT_TIMEOUT = int(os.getenv("MANUS_TIMEOUT", "20"))
MAX_RETRIES = int(os.getenv("MANUS_RETRIES", "2"))

class ManusClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or os.getenv("MANUS_BASE_URL", "").rstrip("/")
        self.api_key = api_key or os.getenv("MANUS_API_KEY", "")
        if not self.base_url or not self.api_key:
            raise RuntimeError("MANUS_BASE_URL e/ou MANUS_API_KEY não configurados no .env")

        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "QIVO/1.0 (ManusIntegration)"
        })

    def run_task(self, task: str, payload: Dict[str, Any], timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
        """
        Dispara uma tarefa no Manus. Implementa retries com backoff simples.
        """
        url = f"{self.base_url}/v1/tasks/run"
        body = {
            "task": task,
            "payload": payload
        }

        last_exc = None
        for attempt in range(1, MAX_RETRIES + 2):  # ex.: 1 tentativa + 2 retries = 3 chamadas máx.
            try:
                resp = self.session.post(url, json=body, timeout=timeout)
                if 200 <= resp.status_code < 300:
                    return resp.json() if resp.content else {"ok": True}
                # erros tratáveis (manter mensagem do servidor)
                return {
                    "ok": False,
                    "status_code": resp.status_code,
                    "error": safe_text(resp)
                }
            except requests.RequestException as e:
                last_exc = e
                if attempt <= MAX_RETRIES:
                    time.sleep(1.5 * attempt)  # backoff simples
                else:
                    break

        return {"ok": False, "error": f"RequestException: {last_exc}"}


def safe_text(resp: requests.Response) -> str:
    try:
        return resp.text[:500]
    except Exception:
        return "unknown error"
