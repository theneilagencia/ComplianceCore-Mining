from flask import Blueprint, jsonify

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/status")
def admin_status():
    return jsonify({
        "module": "Admin Core",
        "status": "ativo ✅"
    })
