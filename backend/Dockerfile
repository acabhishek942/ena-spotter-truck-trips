FROM python:3.11-slim

# Install system-level binary dependencies required for GeoDjango
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    binutils \
    libproj-dev \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# FIX: Create explicit symlinks so Python ctypes can resolve the shared objects cleanly
RUN ln -s /usr/lib/x86_64-linux-gnu/libgdal.so* /usr/lib/x86_64-linux-gnu/libgdal.so || true && \
    ln -s /usr/lib/x86_64-linux-gnu/libgeos_c.so* /usr/lib/x86_64-linux-gnu/libgeos_c.so || true

WORKDIR /app

# ... (Keep the rest of your Dockerfile exactly the same)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000

CMD python manage.py migrate --noinput && \
    python manage.py collectstatic --noinput && \
    gunicorn core.wsgi:application --bind 0.0.0.0:8000