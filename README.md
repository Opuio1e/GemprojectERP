# GemprojectERP

A Django project. Use the steps below to set up a local development environment.

## Prerequisites
- Python 3.11+ (recommended)
- pip
- virtualenv (optional but recommended)

## Setup
1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to provide values for:
   - `SECRET_KEY`: secret key for Django.
   - `DEBUG`: `True` for development, `False` for production.
   - `ALLOWED_HOSTS`: comma-separated list of allowed hosts (e.g., `localhost,127.0.0.1`).
   - `DATABASE_URL`: optional database URL (e.g., `postgres://USER:PASSWORD@HOST:PORT/NAME`). Leave blank to use the default SQLite database.

4. Apply migrations and start the development server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

The application will be available at http://127.0.0.1:8000/ by default.
