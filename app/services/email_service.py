import time


class EmailService:
    def send_reg_otp(self, email: str, otp: str) -> None:
        """
        Send registration OTP to the user's email.

        Args:
            email (str): The recipient's email address.
            otp (str): The one-time password to be sent.
        """
        time.sleep(10)  # Simulate email sending delay
        print(f"Sending registration OTP '{otp}' to email: {email}")
        pass

    def send_pwreset_otp(self, email: str, otp: str) -> None:
        """
        Send password reset OTP to the user's email.

        Args:
            email (str): The recipient's email address.
            otp (str): The one-time password to be sent.
        """
        time.sleep(10)  # Simulate email sending delay
        print(f"Sending password reset OTP '{otp}' to email: {email}")
        pass

    def send_overdue_email(self, email: str, loan_id: int, fine_amount: float) -> None:
        """
        Send overdue loan email to the user.

        Args:
            email (str): The recipient's email address.
            loan_id (int): The ID of the overdue loan.
            fine_amount (float): The fine amount for the overdue loan.
        """
        time.sleep(10)  # Simulate email sending delay
        print(
            f"Sending overdue loan email to {email} "
            f"for loan ID {loan_id} with fine amount {fine_amount}"
        )
        pass
