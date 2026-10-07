"""
Application configuration management using Pydantic Settings.
Loads environment variables from the .env file securely.
"""

from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings Class.
    Reads environment variables from the local .env file.
    """
    PROJECT_NAME: str = "College Placement Portal API"
    API_V1_STR: str = "/api"

    # MySQL Database Connection Settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "placement_portal"

    # Optional direct connection URL override
    CUSTOM_DATABASE_URL: str | None = None

    # JWT Authentication Settings
    SECRET_KEY: str = "placement_portal_super_secure_secret_key_2026_xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours

    @property
    def DATABASE_URL(self) -> str:
        """
        Constructs the SQLAlchemy connection string.
        Checks for DATABASE_URL environment variable (from Vercel / Cloud MySQL) first.
        """
        import os
        direct = os.getenv("DATABASE_URL") or self.CUSTOM_DATABASE_URL
        if direct:
            if direct.startswith("postgres://"):
                direct = direct.replace("postgres://", "postgresql://", 1)
            elif direct.startswith("mysql://"):
                direct = direct.replace("mysql://", "mysql+pymysql://", 1)
            return direct

        # If deployed on Vercel without an external cloud database URL, fallback to local sqlite in temp directory
        if os.getenv("VERCEL"):
            import tempfile
            tmp_db = os.path.join(tempfile.gettempdir(), "placement_portal.db").replace("\\", "/")
            return f"sqlite:///{tmp_db}"

        safe_password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        return f"mysql+pymysql://{self.DB_USER}:{safe_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def SAFE_DATABASE_URI_DISPLAY(self) -> str:
        """
        Returns a sanitized database URI string with the password masked
        for safe logging and display in health checks.
        """
        import os
        direct = os.getenv("DATABASE_URL") or self.CUSTOM_DATABASE_URL
        if direct:
            return "cloud_configured_database_uri"
        return f"mysql+pymysql://{self.DB_USER}:****@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Tell Pydantic to read from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Create a single reusable settings instance
settings = Settings()
