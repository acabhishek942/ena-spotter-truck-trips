FROM python:3.11-slim

# Install system-level binary dependencies required for GeoDjango
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    binutils \
    libproj-dev \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 8000

# Run migrations, static files, and start Gunicorn
CMD python manage.py migrate --noinput && \
    python manage.py collectstatic --noinput && \
    gunicorn backend.wsgi:application --bind 0.0.0.0:8000