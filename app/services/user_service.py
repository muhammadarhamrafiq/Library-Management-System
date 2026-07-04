class UserService:
    def __init__(self, session):
        self.session = session

    async def register_user(self, user_data):
        pass

    async def get_user(self, user_id):
        pass

    async def list_users(self):
        pass

    async def update_user(self, user_id, user_data):
        pass

    async def deactivate_user(self, user_id, user_data):
        pass

    async def change_role(self, user_id, role):
        pass
