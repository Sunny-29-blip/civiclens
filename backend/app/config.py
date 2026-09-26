import os
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()

class Settings:
    # Google Cloud & Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    # Firebase / Google Cloud Firestore Configuration (Part C: jansetu-d2106)
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "jansetu-d2106")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_SERVICE_ACCOUNT_JSON: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")

    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("1", "true", "yes")

    # Demo & Authentication Settings
    DEMO_OTP: str = os.getenv("DEMO_OTP", "123456")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "civiclens-super-secret-key-2026")

    # Indian Context Defaults
    DEFAULT_STATE: str = "Delhi"
    DEFAULT_DISTRICT: str = "Central Delhi"
    DEFAULT_LOCALITY: str = "unspecified"

settings = Settings()
