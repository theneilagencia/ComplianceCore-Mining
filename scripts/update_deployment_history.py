#!/usr/bin/env python3
"""
Update deployment history after each deploy
"""

import os
import json
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DEPLOY_STATUS = os.getenv("DEPLOY_STATUS", "unknown")
COMMIT_SHA = os.getenv("COMMIT_SHA", "unknown")

def main():
    history_file = PROJECT_ROOT / "docs" / "DEPLOYMENT_HISTORY.json"
    
    # Load existing history
    history = []
    if history_file.exists():
        with open(history_file) as f:
            history = json.load(f)
    
    # Add new entry
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "commit_sha": COMMIT_SHA,
        "status": DEPLOY_STATUS,
        "environment": os.getenv("ENVIRONMENT", "production")
    }
    
    history.append(entry)
    
    # Keep only last 100 deploys
    history = history[-100:]
    
    # Save
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)
    
    print(f"✅ Deployment history updated: {len(history)} entries")

if __name__ == "__main__":
    main()
