#!/usr/bin/env python3
"""
QIVO Mining - QA Notification System
Sends email and WhatsApp notifications after QA execution
Ultra-lightweight: <0.002 USD per execution
"""

import os
import smtplib
import ssl
import requests
import subprocess
import datetime
import sys
import pathlib
from email.mime.text import MIMEText

def run(command):
    """Execute shell command and return output"""
    try:
        return subprocess.check_output(command, shell=True, text=True).strip()
    except subprocess.CalledProcessError:
        return "unknown"

def send_email(subject, body):
    """Send email notification via SMTP (SendGrid)"""
    try:
        smtp_host = os.getenv("SMTP_HOST", "smtp.sendgrid.net")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        email_from = os.getenv("EMAIL_FROM", "QIVO QA Bot <qa@qivo.ai>")
        email_to = os.getenv("EMAIL_TO")
        
        if not all([smtp_user, smtp_pass, email_to]):
            print("⚠️  Email credentials not configured, skipping email notification")
            return
        
        # Create SMTP connection
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls(context=ssl.create_default_context())
        server.login(smtp_user, smtp_pass)
        
        # Create message
        msg = MIMEText(body, "html")
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = email_to
        
        # Send
        server.sendmail(email_from, [email_to], msg.as_string())
        server.quit()
        
        print(f"✅ Email sent to {email_to}")
        
    except Exception as e:
        print(f"❌ Email failed: {e}")

def send_whatsapp(message):
    """Send WhatsApp notification via Twilio (with Gupshup fallback)"""
    try:
        # Try Twilio first
        twilio_sid = os.getenv("TWILIO_SID")
        twilio_token = os.getenv("TWILIO_TOKEN")
        whatsapp_from = os.getenv("WHATSAPP_FROM", "whatsapp:+14155238886")
        whatsapp_to = os.getenv("WHATSAPP_TO")
        
        if not all([twilio_sid, twilio_token, whatsapp_to]):
            print("⚠️  WhatsApp credentials not configured, skipping WhatsApp notification")
            return
        
        # Twilio API
        url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
        response = requests.post(
            url,
            data={
                "From": whatsapp_from,
                "To": whatsapp_to,
                "Body": message
            },
            auth=(twilio_sid, twilio_token),
            timeout=8
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ WhatsApp sent via Twilio to {whatsapp_to}")
            return
        else:
            raise Exception(f"Twilio failed with status {response.status_code}")
            
    except Exception as twilio_error:
        print(f"⚠️  Twilio failed: {twilio_error}, trying Gupshup fallback...")
        
        # Fallback to Gupshup
        try:
            gupshup_api = os.getenv("GUPSHUP_API", "https://api.gupshup.io/sm/api/v1/msg")
            gupshup_key = os.getenv("GUPSHUP_KEY")
            gupshup_app = os.getenv("GUPSHUP_APP", "QIVO_QA")
            
            if not gupshup_key:
                print("❌ Gupshup credentials not configured")
                return
            
            response = requests.post(
                gupshup_api,
                headers={"apikey": gupshup_key},
                data={
                    "channel": "whatsapp",
                    "source": whatsapp_from.replace("whatsapp:", ""),
                    "destination": whatsapp_to.replace("whatsapp:", ""),
                    "message": message,
                    "app": gupshup_app
                },
                timeout=8
            )
            
            if response.status_code == 200:
                print(f"✅ WhatsApp sent via Gupshup to {whatsapp_to}")
            else:
                raise Exception(f"Gupshup failed with status {response.status_code}")
                
        except Exception as gupshup_error:
            print(f"❌ WhatsApp notification failed (both Twilio and Gupshup): {gupshup_error}")

def log_status(state, icon, branch, commit, pr_url, prod_url):
    """Append QA result to historical log"""
    log_path = pathlib.Path("docs/QA_STATUS_LOG.md")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    entry = f"| {now} | {icon} {state} | `{branch}@{commit}` | [PR]({pr_url}) | [Prod]({prod_url}) |\n"
    
    # Create header if file doesn't exist
    header = "# QIVO Mining - QA Status Log\n\n"
    header += "Histórico de execuções do QA automático semanal.\n\n"
    header += "| Timestamp (UTC) | Status | Branch@Commit | PR | Produção |\n"
    header += "|-----------------|--------|---------------|----|-----------|\n"
    
    if not log_path.exists():
        log_path.write_text(header)
    
    # Append entry
    with open(log_path, "a") as f:
        f.write(entry)
    
    print(f"✅ Status logged to {log_path}")

def main():
    """Main notification logic"""
    print("🔔 QIVO QA Notification System")
    print("=" * 60)
    
    # Get git info
    branch = run("git rev-parse --abbrev-ref HEAD")
    commit = run("git rev-parse --short HEAD")
    
    # Get URLs
    repo_url = os.getenv("REPO_URL", "https://github.com/theneilagencia/ComplianceCore-Mining")
    prod_url = os.getenv("PROD_URL", "https://qivo-mining.onrender.com")
    pr_url = f"{repo_url}/compare/main...{branch}"
    
    # Get QA status
    qa_status = os.getenv("QA_STATUS", "SUCCESS").upper()
    qa_partial = os.getenv("QA_PARTIAL", "0") == "1"
    
    # Determine state
    if qa_status != "SUCCESS":
        state, icon, color = "FAILURE", "❌", "#c62828"
    elif qa_partial:
        state, icon, color = "PARTIAL", "⚠️", "#f9a825"
    else:
        state, icon, color = "SUCCESS", "✅", "#2e7d32"
    
    # ISO timestamp
    iso_timestamp = datetime.datetime.utcnow().isoformat() + "Z"
    
    print(f"\nStatus: {icon} {state}")
    print(f"Branch: {branch}")
    print(f"Commit: {commit}")
    print(f"PR: {pr_url}")
    print(f"Prod: {prod_url}")
    print(f"Time: {iso_timestamp}")
    print()
    
    # Email body (HTML)
    email_html = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">{icon} QIVO QA — {state}</h1>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 10px 0;"><strong>Branch:</strong> {branch}</p>
            <p style="margin: 0 0 10px 0;"><strong>Commit:</strong> {commit}</p>
            <p style="margin: 0 0 20px 0;"><strong>Timestamp:</strong> {iso_timestamp}</p>
            <div style="display: flex; gap: 10px;">
                <a href="{pr_url}" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Ver PR
                </a>
                <a href="{prod_url}" style="background: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Produção
                </a>
            </div>
        </div>
    </div>
    """
    
    # WhatsApp message (plain text)
    whatsapp_msg = f"""QIVO QA {icon} {state}
{branch}@{commit}

Aprovar PR: {pr_url}
Produção: {prod_url}

{iso_timestamp}"""
    
    # Send notifications
    send_email(f"QIVO QA — {state}", email_html)
    send_whatsapp(whatsapp_msg)
    log_status(state, icon, branch, commit, pr_url, prod_url)
    
    # Exit with error code if failed
    if state == "FAILURE":
        print("\n❌ QA failed, exiting with code 1")
        sys.exit(1)
    elif state == "PARTIAL":
        print("\n⚠️  QA passed with warnings, exiting with code 0")
        sys.exit(0)
    else:
        print("\n✅ QA passed successfully, exiting with code 0")
        sys.exit(0)

if __name__ == "__main__":
    main()

