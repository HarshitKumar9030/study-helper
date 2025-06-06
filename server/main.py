#!/usr/bin/env python3


import os
import sys
import threading
import time
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from src.core.app import StudyHelperApp
from src.utils.logger import setup_logger
from src.utils.config import Config

def main():
    try:
        load_dotenv()
        
        logger = setup_logger()
        logger.info("🚀 Starting Study Helper Application...")
        
        config = Config()
        
        if not config.validate():
            logger.error("❌ Configuration validation failed. Please check your .env file.")
            sys.exit(1)
        
        app = StudyHelperApp(config)
        
        logger.info("✅ Study Helper is ready!")
        app.run()
        
    except KeyboardInterrupt:
        logger.info("👋 Study Helper shutting down gracefully...")
    except Exception as e:
        logger.error(f"💥 Unexpected error: {e}")
        raise
    finally:
        if 'app' in locals():
            app.cleanup()

if __name__ == "__main__":
    main()