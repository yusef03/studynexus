import resend
from app.config import settings

def send_verification_email(to_email: str, code: str):
    resend.api_key = settings.RESEND_API_KEY
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Willkommen bei StudyNexus!</h2>
        <p>Dein Verifizierungscode lautet:</p>
        <h1 style="background: #f4f4f5; padding: 12px; letter-spacing: 4px; text-align: center; border-radius: 8px;">{code}</h1>
        <p>Dieser Code ist 15 Minuten lang gültig.</p>
    </div>
    """
    
    try:
        resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": to_email,
            "subject": "Dein StudyNexus Verifizierungscode",
            "html": html_content
        })
    except Exception as e:
        print(f"Failed to send email: {e}")
