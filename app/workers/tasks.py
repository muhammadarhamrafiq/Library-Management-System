import asyncio

from celery import Celery

from app.core.database import SessionLocal
from app.core.settings import settings
from app.services import EmailService, LoanService, StatisticsService

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


@app.task(
    queue="email",
)
def send_overdue_email(email: str, loan_id: int, fine_amount: float) -> None:
    """
    Celery task to send overdue loan email to the user.

    Args:
        email (str): The recipient's email address.
        loan_id (int): The ID of the overdue loan.
        fine_amount (float): The fine amount for the overdue loan.
    """
    email_service.send_overdue_email(email, loan_id, fine_amount)


@app.task(queue="maintenance")
def process_overdue_loans():
    asyncio.run(_process_overdue_loans())


@app.task(queue="report")
def update_daily_statistics():
    asyncio.run(_update_daily_statistics())


async def _process_overdue_loans():
    async with SessionLocal() as session:
        loan_service = LoanService(session)
        overdue_loans = await loan_service.process_overdue_loans()

        for loan in overdue_loans:
            send_overdue_email.delay(
                loan.user.email,
                loan.id,
                loan.fine_amount,
            )
    await session.bind.dispose()


async def _update_daily_statistics() -> None:
    async with SessionLocal() as session:
        statistics_service = StatisticsService(session)
        await statistics_service.update_daily_statistics()
    await session.bind.dispose()


app.conf.beat_schedule = {
    "process-overdue-loans": {
        "task": process_overdue_loans.name,
        "schedule": 30,
    },
    "update-daily-statistics": {
        "task": update_daily_statistics.name,
        "schedule": 30,
    },
}
