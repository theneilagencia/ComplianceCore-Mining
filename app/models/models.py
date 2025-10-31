from app import db
from datetime import datetime

class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 🧠 Campos novos para integração com o Validator
    status = db.Column(db.String(50), default="Pendente")
    validation_result = db.Column(db.JSON, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "validation_result": self.validation_result,
        }
