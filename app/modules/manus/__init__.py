from flask import Flask
from dotenv import load_dotenv
from app.extensions import db, migrate  # ✅ agora importamos de extensions.py

load_dotenv()
