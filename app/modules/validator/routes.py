from flask import Blueprint, request, jsonify
from app.services.ai_validator import analyze_text, analyze_batch
from app.modules.reports.models import Report  # ⚙️ ajuste se o modelo estiver em outro lugar
from app.extensions import db


validator_bp = Blueprint("validator", __name__)


@validator_bp.route("/analyze", methods=["POST"])
def analyze():
    """Analisa um único texto."""
    data = request.get_json()
    content = data.get("content") if data else None
    if not content:
        return jsonify({"ok": False, "error": "Campo 'content' obrigatório"}), 400

    result = analyze_text(content)
    return jsonify(result), (200 if result["ok"] else 500)


@validator_bp.route("/report", methods=["POST"])
def analyze_report_batch():
    """Analisa múltiplos textos enviados diretamente."""
    data = request.get_json()
    texts = data.get("texts", [])
    if not texts or not isinstance(texts, list):
        return jsonify({"ok": False, "error": "Campo 'texts' deve ser uma lista"}), 400

    result = analyze_batch(texts)
    return jsonify(result), 200


@validator_bp.route("/report/<int:report_id>", methods=["POST"])
def analyze_report_id(report_id):
    """
    Analisa o texto de um relatório existente e salva o resultado.
    """
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"ok": False, "error": "Relatório não encontrado"}), 404

    result = analyze_text(report.content)
    if result["ok"]:
        report.validation_result = result  # precisa ter campo JSON na model
        report.status = "Validado"
        db.session.commit()

    return jsonify(result), (200 if result["ok"] else 500)
