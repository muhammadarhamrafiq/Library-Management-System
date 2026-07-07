FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install --no-cache-dir uv

COPY . .

RUN uv sync --no-dev
CMD ["uv", "run", "--no-dev", "python", "-m", "app.main"]