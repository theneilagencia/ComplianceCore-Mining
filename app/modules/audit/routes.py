from flask import Blueprint, jsonify

audit_bp = Blueprint("audit", __name__)

@audit_bp.route("/status")
def audit_status():
    return jsonify({
        "module": "Auditoria & KRCI",
        "status": "ativo ✅"
    })
