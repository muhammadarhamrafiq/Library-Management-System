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
