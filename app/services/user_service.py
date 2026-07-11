from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.exceptions import (
    BadRequestError,
    ConflictError,
    InactiveUserError,
    InvalidCredentialsError,
    NotFoundError,
)
from app.models import Role, User
from app.schemas import UserCreate, UserUpdate


class UserService:
    def __init__(self, session: AsyncSession):
        """
        UserService is a service class that provides methods
        for managing user-related operations such as registration, retrieval,
        listing, updating, deactivating, and changing user roles.

        Arguments:
            session(AsyncSession): AyncSession instance for database operations.

        Methods:
            register_user(user_data): Registers a new user with the provided data.
            get_user(user_id): Retrieves a user by their unique identifier.
            list_users(): Lists all users in the system.
            update_user(user_id, user_data): Updates information of an existing user.
            deactivate_user(user_id, user_data): Deactivates a user account.
            change_role(user_id, role): Changes the role of a user.
        """

        self._session = session

    async def register_user(self, user_data: UserCreate) -> User:
        """
        Registers a new user in the system.

        Arguments:
            user_data(UserCreate): user data for registration.

        Returns:
            user(User): The newly created user instance.

        Raises:
            ConflictError: If a user with the same email already exists.
        """

        existing_user = await self._session.execute(
            select(User).where(User.email == user_data.email)
        )

        if existing_user.scalar_one_or_none():
            raise ConflictError("A user with this email already exists.")

        hashed_password = hash_password(user_data.password)

        user = User(
            **user_data.model_dump(exclude={"password"}), password=hashed_password
        )
        self._session.add(user)

        await self._session.commit()
        await self._session.refresh(user)

        return user

    async def get_user(self, user_id: int, include_inactive: bool = False) -> User:
        """
        Retrieves a user by id.

        Arguments:
            user_id(int): The unique identifier of the user.
            include_inactive(bool): Whether to include inactive users.

        Returns:
            user(User): The user instance if found

        Raises:
            NotFoundError: If the user with the specified id does not exist.
        """

        user = await self._session.get(User, user_id)

        if not user:
            raise NotFoundError(f"User with id {user_id} not found.")

        if not include_inactive and not user.is_active:
            raise NotFoundError(f"User with id {user_id} not found.")

        return user

    async def list_users(
        self,
        search_query: str | None = None,
        full_name: str | None = None,
        email: str | None = None,
        role: Role | None = None,
        is_active: bool | None = None,
        sortBy: str | None = None,
        sortOrder: str = "asc",
        skip: int = 0,
        limit: int = 10,
    ) -> dict:
        """
        List users with optional filtering, sorting, and pagination.

        Arguments:
            search_query(str | None): Search across full_name and email.
            full_name(str | None): Filter by full name.
            email(str | None): Filter by email.
            role(Role | None): Filter by role.
            is_active(bool | None): Filter by active status.
            sortBy(str | None):
                Field to sort by.
                Allowed: id, full_name, email, created_at, is_active.
            sortOrder(str): Sort order 'asc' or 'desc'. Default is 'asc'.
            skip(int): Number of records to skip. Default is 0.
            limit(int): Maximum records to return. Default is 10.

        Returns:
            dict: Dictionary containing users list and pagination metadata.

        Raises:
            BadRequestError: If skip/limit are invalid or sortBy is not allowed.
        """

        if skip < 0:
            raise BadRequestError("skip must be >= 0")
        if limit < 1 or limit > 100:
            raise BadRequestError("limit must be between 1 and 100")

        query = select(User)

        # Apply Full Name Filter
        if full_name:
            query = query.where(User.full_name.ilike(f"%{full_name}%"))

        # Apply Email Filter
        if email:
            query = query.where(User.email.ilike(f"%{email}%"))

        # Apply Role Filter
        if role:
            query = query.where(User.role == role)

        # Apply Active Status Filter
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        # Apply Search Query (searches across full_name and email)
        if search_query:
            query = query.where(
                or_(
                    User.full_name.ilike(f"%{search_query}%"),
                    User.email.ilike(f"%{search_query}%"),
                )
            )

        # Apply Sorting
        ALLOWED_SORT_FIELDS = {"id", "full_name", "email", "created_at", "is_active"}
        if sortBy:
            if sortBy not in ALLOWED_SORT_FIELDS:
                raise BadRequestError(
                    "Invalid sort field. Allowed fields are: "
                    f"{', '.join(ALLOWED_SORT_FIELDS)}"
                )
            sort_column = getattr(User, sortBy, None)
            if sort_column:
                if sortOrder.lower() == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())

        # Get paginated results
        result = await self._session.execute(query.offset(skip).limit(limit))
        users = result.scalars().all()

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self._session.execute(count_query)
        total_count = total_result.scalar()

        # Return dict with pagination metadata
        return {
            "data": users,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1,
            "has_next": skip + limit < total_count,
            "has_previous": skip > 0,
        }

    async def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """
        Update a user's information.

        Arguments:
            user_id(int): The unique identifier of the user to update.
            user_data(UserUpdate): The data to update the user with.
        Returns:
            user(User): The updated user instance.

        Raises:
            NotFoundError: If the user with the specified id does not exist.
            ConflictError: If the new email is already in use by another user.
        """

        user = await self.get_user(user_id)

        update_data = user_data.model_dump(exclude_unset=True)

        if "email" in update_data and update_data["email"] != user.email:
            existing_user = await self._session.execute(
                select(User).where(User.email == update_data["email"])
            )

            if existing_user.scalar_one_or_none():
                raise ConflictError("A user with this email already exists.")

        for field, value in user_data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)

        await self._session.commit()
        await self._session.refresh(user)

        return user

    async def update_password(
        self, user_id: int, current_password: str, new_password: str
    ) -> User:
        """
        Update a user's password.

        Arguments:
            user_id: The ID of the user whose password is to be updated.
            current_password: The user's current password.
            new_password: The new password to set.

        Returns:
            user: The updated User object.

        Raises:
            NotFoundError: If the user with the given ID does not exist.
            InactiveUserError: If the user account is inactive.
            InvalidCredentialsError: If the current password is incorrect.
        """
        user = await self.get_user(user_id, include_inactive=True)

        if not user.is_active:
            raise InactiveUserError("User account is inactive")

        if not verify_password(current_password, user.password):
            raise InvalidCredentialsError("Invalid credentials")

        hashed_new_password = hash_password(new_password)
        user.password = hashed_new_password

        await self._session.commit()
        await self._session.refresh(user)

        return user

    async def deactivate_user(self, user_id: int) -> User:
        """
        Deactivates a user account

        Arguments:
            user_id(int): The unique identifier of the user to deactivate.

        Returns:
            user(User): The deactivated user instance.

        Raises:
            NotFoundError: If the user with the specified id does not exist.
            BadRequestError: If the user is already inactive.
        """
        user = await self.get_user(user_id, include_inactive=True)

        if not user.is_active:
            raise BadRequestError(f"User with id {user_id} is already inactive.")

        if user.role == Role.ADMIN:
            active_admin_count = await self._session.execute(
                select(func.count())
                .select_from(User)
                .where(User.role == Role.ADMIN, User.is_active.is_(True))
            )
            if active_admin_count.scalar() <= 1:
                raise BadRequestError(
                    "Cannot deactivate the last active admin account."
                )

        user.is_active = False
        await self._session.commit()
        await self._session.refresh(user)
        return user

    async def activate_user(self, user_id: int) -> User:
        """
        Activates a user account

        Arguments:
            user_id(int): The unique identifier of the user to activate.

        Returns:
            user(User): The activated user instance.

        Raises:
            NotFoundError: If the user with the specified id does not exist.
            BadRequestError: If the user is already active.
        """
        user = await self.get_user(user_id, include_inactive=True)

        if user.is_active:
            raise BadRequestError(f"User with id {user_id} is already active.")

        user.is_active = True
        await self._session.commit()
        await self._session.refresh(user)
        return user

    async def change_role(self, user_id: int, role: Role):
        """
        Changes the role of a user.

        Arguments:
            user_id(int): The unique identifier of the user.
            role(Role): The new role to assign to the user.

        Returns:
            user(User): The user instance with the updated role.

        Raises:
            NotFoundError: If the user with the specified id does not exist.
        """
        user = await self.get_user(user_id, include_inactive=True)

        if user.role == Role.ADMIN and role != Role.ADMIN:
            active_admin_count = await self._session.execute(
                select(func.count())
                .select_from(User)
                .where(User.role == Role.ADMIN, User.is_active.is_(True))
            )
            if active_admin_count.scalar() <= 1:
                raise BadRequestError(
                    "Cannot change the role of the last active admin account."
                )

        user.role = role
        await self._session.commit()
        await self._session.refresh(user)
        return user
