from flask import Blueprint, jsonify

radar_bp = Blueprint("radar", __name__)

@radar_bp.route("/status")
def radar_status():
    return jsonify({
        "module": "Radar Regulatório Global",
        "status": "ativo ✅"
    })
