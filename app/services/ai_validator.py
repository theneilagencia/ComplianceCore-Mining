import os
import re
import random
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_KEY) if OPENAI_KEY else None


def analyze_text(content: str):
    """
    Analisa um texto individualmente — tenta via OpenAI e faz fallback local.
    """
    if not content or not content.strip():
        return {"ok": False, "error": "Texto vazio"}

    indicators = {
        "has_reserves": bool(re.search(r"\b(reserva|tonelada|Mt|milhão|t)\b", content, re.I)),
        "has_grade": bool(re.search(r"\b(%|teor|g\/t|ppm|Cu|Fe|Au|Zn|Pb)\b", content, re.I)),
        "has_production": bool(re.search(r"\b(produzid[ao]|produção|kt|t\/ano)\b", content, re.I)),
        "length": len(content),
    }

    # pontuação de confiança (simulada)
    confidence = 0.3
    if indicators["has_reserves"]:
        confidence += 0.3
    if indicators["has_grade"]:
        confidence += 0.3
    if indicators["has_production"]:
        confidence += 0.2
    confidence = min(confidence, 1.0)

    try:
        if client and OPENAI_KEY:
            response = client.responses.create(
                model="gpt-4o-mini",
                input=f"Analise o texto e descreva brevemente os indicadores minerais:\n\n{content}"
            )
            summary = response.output[0].content[0].text.strip()
        else:
            summary = _simulate_summary(indicators)
    except Exception:
        summary = _simulate_summary(indicators)

    return {
        "ok": True,
        "summary": summary,
        "confidence": round(confidence, 2),
        "indicators": indicators,
        "text": content,
    }


def analyze_batch(texts: list[str]):
    """
    Analisa vários textos e gera um resumo consolidado.
    """
    results = [analyze_text(t) for t in texts]

    total = len(results)
    with_reserves = sum(1 for r in results if r["indicators"]["has_reserves"])
    with_grade = sum(1 for r in results if r["indicators"]["has_grade"])
    with_production = sum(1 for r in results if r["indicators"]["has_production"])
    percent_with_indicators = round(
        (sum(1 for r in results if any(r["indicators"].values())) / total) * 100, 1
    ) if total else 0

    summary = {
        "total": total,
        "with_reserves": with_reserves,
        "with_grade": with_grade,
        "with_production": with_production,
        "percent_with_indicators": percent_with_indicators,
    }

    return {"ok": True, "summary": summary, "results": results}


def _simulate_summary(indicators: dict):
    """Gera resumo textual baseado em regras simples (modo offline)."""
    parts = []
    if indicators["has_reserves"]:
        parts.append("menciona reservas")
    if indicators["has_grade"]:
        parts.append("menciona teores")
    if indicators["has_production"]:
        parts.append("menciona produção")
    if not parts:
        parts.append("não menciona indicadores minerais")
    return "Simulação local: " + " e ".join(parts)
