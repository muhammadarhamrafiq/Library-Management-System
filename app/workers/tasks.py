from celery import Celery

from app.core.settings import settings
from app.services.email_service import EmailService

broker_url = f"redis://{settings.redis_host}:{settings.redis_port}/0"

app = Celery(
    "tasks",
    broker=broker_url,
)


email_service = EmailService()


@app.task(
    queue="otp",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3},
    retry_backoff=True,
)
def send_reg_otp(email: str, otp: str) -> None:
    """
    Celery task to send registration OTP to the user's email.

    Args:
        email (str): The recipient's email address.
        otp (str): The one-time password to be sent.
    """
    email_service.send_reg_otp(email, otp)


@app.task(
    queue="otp",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3},
    retry_backoff=True,
)
def send_pwreset_otp(email: str, otp: str) -> None:
    """
    Celery task to send password reset OTP to the user's email.

    Args:
        email (str): The recipient's email address.
        otp (str): The one-time password to be sent.
    """
    email_service.send_pwreset_otp(email, otp)
