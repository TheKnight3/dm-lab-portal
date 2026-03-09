FROM python:3.10-slim

# Create working directory
WORKDIR /app

# Install build dependencies for psycopg2
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . ./

EXPOSE 5000

# Copy and set permissions on entrypoint
RUN chmod +x entrypoint.sh

# Environment variables for Flask
ENV FLASK_APP=app
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

ENTRYPOINT ["./entrypoint.sh"]