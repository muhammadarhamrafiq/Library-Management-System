import resend

from app.core.settings import settings

resend.api_key = settings.resend_api_key

FROM_EMAIL = "LMS <lms@mail.arhamrafiq.dev>"


class EmailService:
    def send_reg_otp(self, email: str, otp: str) -> None:
        """
        Send registration OTP to the user's email.

        Args:
            email (str): The recipient's email address.
            otp (str): The one-time password to be sent.
        """
        resend.Emails.send(
            {
                "from": FROM_EMAIL,
                "to": [email],
                "subject": "Verify your email",
                "html": f"""
                    <p>Your verification code is:</p>
                    <h2>{otp}</h2>
                    <p>This code expires in 20 minutes.</p>
                """,
            }
        )

    def send_pwreset_otp(self, email: str, otp: str) -> None:
        """
        Send password reset OTP to the user's email.

        Args:
            email (str): The recipient's email address.
            otp (str): The one-time password to be sent.
        """
        resend.Emails.send(
            {
                "from": FROM_EMAIL,
                "to": [email],
                "subject": "Reset your password",
                "html": f"""
                    <p>Your password reset code is:</p>
                    <h2>{otp}</h2>
                    <p>This code expires in 20 minutes. If you didn't request
                    this, you can safely ignore this email.</p>
                """,
            }
        )

    def send_overdue_email(self, email: str, loan_id: int, fine_amount: float) -> None:
        """
        Send overdue loan email to the user.

        Args:
            email (str): The recipient's email address.
            loan_id (int): The ID of the overdue loan.
            fine_amount (float): The fine amount for the overdue loan.
        """
        resend.Emails.send(
            {
                "from": FROM_EMAIL,
                "to": [email],
                "subject": "Your library loan is overdue",
                "html": f"""
                    <p>Loan #{loan_id} is overdue.</p>
                    <p>Current fine: ${fine_amount:.2f}</p>
                """,
            }
        )
