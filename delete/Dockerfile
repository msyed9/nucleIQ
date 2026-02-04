FROM python:3.10-slim
WORKDIR /app

# Install runtime deps
RUN pip install --no-cache-dir faker openpyxl

# Copy generator scripts
COPY generator.py generator_fixed.py ./

# Default output inside container (mount a host folder to persist)
ENV OUTPUT_DIR=/data/newschool

CMD ["python", "generator.py"]
