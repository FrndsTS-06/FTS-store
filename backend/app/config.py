import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "NovaMart Multi-Category Marketplace"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    CORS_ORIGINS: str = "*"
    
    STORE_CURRENCY: str = "USD"
    STORE_CURRENCY_SYMBOL: str = "$"
    DEFAULT_TAX_RATE: float = 0.08
    FREE_SHIPPING_THRESHOLD: float = 100.00
    STANDARD_SHIPPING_FEE: float = 9.99

    def get_cors_origins(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
