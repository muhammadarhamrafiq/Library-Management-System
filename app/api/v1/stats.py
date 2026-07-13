from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import require_role
from app.core.services import get_stats_service
from app.models import Role
from app.services import StatisticsService

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/daily")
async def get_daily_stats(
    stats_service: Annotated[StatisticsService, Depends(get_stats_service)],
    _: Annotated[dict, Depends(require_role(Role.LIBRARIAN.value, Role.ADMIN.value))],
):
    """
    Endpoint to retrieve the latest daily statistics snapshot.
    Powers the librarian/admin dashboard cards.
    Requires librarian or admin role.
    """
    stats = await stats_service.get_daily_stats()
    return stats
