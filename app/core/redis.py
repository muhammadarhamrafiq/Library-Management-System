from redis.asyncio import ConnectionPool, Redis

from app.core.settings import settings

redis_url = f"redis://{settings.redis_host}:{settings.redis_port}"
redis_pool = ConnectionPool(host=settings.redis_host, port=settings.redis_port)


async def get_redis() -> Redis:
    return Redis(connection_pool=redis_pool)
