from flask import Blueprint, request, jsonify
from app import db
from app.modules.reports.models import Report

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/status")
def reports_status():
    return jsonify({
        "module": "AI Report Generator",
        "status": "ativo ✅"
    })

@reports_bp.route("/generate", methods=["POST"])
def generate_report():
    """
    Gera um relatório técnico com base em um prompt enviado pelo cliente.
    Exemplo de payload:
    {
        "prompt": "Gerar relatório sobre mineração de cobre no Brasil"
    }
    """
    data = request.get_json()
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "O campo 'prompt' é obrigatório"}), 400

    # Simula geração de relatório (futuro: integrar com IA)
    generated_report = f"📄 Relatório técnico gerado com base no prompt: {prompt}"

    # Salva no banco (SQLite)
    report = Report(content=generated_report)
    db.session.add(report)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Relatório gerado com sucesso ✅",
        "report_id": report.id,
        "content": generated_report
    })
