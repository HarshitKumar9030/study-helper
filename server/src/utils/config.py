"""
Configuration management for Study Helper application.
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration settings."""
    
    # Application Settings
    APP_NAME = "Study Helper"
    VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "study_helper")
    
    # NextAuth JWT Configuration
    NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
    NEXTAUTH_URL = os.getenv("NEXTAUTH_URL", "http://localhost:3000")
    JWT_ALGORITHM = "HS256"
    
    # API Configuration
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api")
    API_TIMEOUT = int(os.getenv("API_TIMEOUT", "30"))
    
    # Voice Settings
    VOICE_ENABLED = os.getenv("VOICE_ENABLED", "true").lower() == "true"
    VOICE_RATE = int(os.getenv("VOICE_RATE", "150"))
    VOICE_VOLUME = float(os.getenv("VOICE_VOLUME", "0.8"))
    
    # Focus Mode Settings
    FOCUS_MODE_ENABLED = os.getenv("FOCUS_MODE_ENABLED", "true").lower() == "true"
    DEFAULT_BLOCKED_SITES = [
        "facebook.com", "twitter.com", "instagram.com", "youtube.com",
        "tiktok.com", "snapchat.com", "reddit.com", "twitch.tv",
        "netflix.com", "hulu.com", "disney.com", "amazon.com"
    ]
    BLOCKED_SITES = os.getenv("BLOCKED_SITES", ",".join(DEFAULT_BLOCKED_SITES)).split(",")
    
    # Google AI (Gemini) Configuration
    GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    
    # UI Settings
    THEME_MODE = os.getenv("THEME_MODE", "dark")  # light, dark, auto
    WINDOW_WIDTH = int(os.getenv("WINDOW_WIDTH", "1200"))
    WINDOW_HEIGHT = int(os.getenv("WINDOW_HEIGHT", "800"))
    
    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "logs/study_helper.log")    # GUI Mode detection
    GUI_MODE = True  # Force GUI mode
    # try:
    #     import PyQt5
    # except ImportError:
    #     GUI_MODE = False
    
    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration."""
        required_fields = [
            ("NEXTAUTH_SECRET", cls.NEXTAUTH_SECRET),
            ("MONGODB_URI", cls.MONGODB_URI),
        ]
        
        missing_fields = []
        for field_name, field_value in required_fields:
            if not field_value:
                missing_fields.append(field_name)
        
        if missing_fields:
            print(f"Missing required configuration: {', '.join(missing_fields)}")
            return False
        
        return True
    
    @classmethod
    def get_env_template(cls) -> str:
        """Get environment template for .env file."""
        return """# Study Helper Configuration

# Database
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=study_helper

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google AI Configuration
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# Application Settings
DEBUG=false
VOICE_ENABLED=true
FOCUS_MODE_ENABLED=true

# UI Settings
THEME_MODE=dark
WINDOW_WIDTH=1200
WINDOW_HEIGHT=800

# Blocked Sites (comma-separated)
BLOCKED_SITES=facebook.com,twitter.com,instagram.com,youtube.com
"""
