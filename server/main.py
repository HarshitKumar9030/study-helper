#!/usr/bin/env python3
import sys
import os
import traceback
from pathlib import Path

# Add the src directory to the Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from utils.logger import get_logger
from utils.config import Config

# Initialize logger
logger = get_logger(__name__)

def main():
    """Main entry point for the Study Helper application."""
    try:
        logger.info("=" * 60)
        logger.info("Starting Study Helper Application")
        logger.info("=" * 60)
        
        # Load configuration
        config = Config()
        logger.info(f"Configuration loaded successfully")
        logger.info(f"GUI Mode: {config.GUI_MODE}")
        
        # Import and start the application
        from core.app import StudyHelperApp
        
        # Create and run the application
        app = StudyHelperApp()
        app.run()
        
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == "__main__":
    main()