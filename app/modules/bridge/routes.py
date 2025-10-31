from flask import Blueprint, jsonify

bridge_bp = Blueprint("bridge", __name__)

@bridge_bp.route("/status")
def bridge_status():
    return jsonify({
        "module": "Bridge Regulatória Global",
        "status": "ativo ✅"
    })
