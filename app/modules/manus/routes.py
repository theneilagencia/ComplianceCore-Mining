from flask import Blueprint, jsonify

# Blueprint principal do módulo Manus
manus_bp = Blueprint("manus", __name__)

@manus_bp.route("/status", methods=["GET"])
def status():
    """Endpoint de verificação do módulo Manus."""
    return jsonify({
        "ok": True,
        "module": "manus",
        "status": "Módulo Manus operacional ✅"
    })
