"""
Authentication service for Study Helper application.
"""
import hashlib
import time
from typing import Optional, Dict, Any
from src.utils.logger import get_logger

logger = get_logger(__name__)

class AuthService:
    """Authentication service for user login and registration."""
    
    def __init__(self):
        """Initialize the authentication service."""
        self.users = {
            # Default demo user for testing
            "demo": {
                "password_hash": self._hash_password("demo123"),
                "email": "demo@studyhelper.com",
                "created_at": time.time()
            }
        }
        logger.info("Authentication service initialized")
    
    def _hash_password(self, password: str) -> str:
        """Hash a password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def authenticate_user(self, username: str, password: str) -> bool:
        """
        Authenticate a user with username and password.
        
        Args:
            username: The username
            password: The password
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            if not username or not password:
                logger.warning("Authentication failed: Empty username or password")
                return False
            
            # Check if user exists
            if username not in self.users:
                logger.warning(f"Authentication failed: User '{username}' not found")
                return False
            
            # Verify password
            password_hash = self._hash_password(password)
            if self.users[username]["password_hash"] == password_hash:
                logger.info(f"User '{username}' authenticated successfully")
                return True
            else:
                logger.warning(f"Authentication failed: Invalid password for user '{username}'")
                return False
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return False
    
    def register_user(self, username: str, password: str, email: str = "") -> bool:
        """
        Register a new user.
        
        Args:
            username: The username
            password: The password
            email: The email address (optional)
            
        Returns:
            bool: True if registration successful, False otherwise
        """
        try:
            if not username or not password:
                logger.warning("Registration failed: Empty username or password")
                return False
            
            # Check if user already exists
            if username in self.users:
                logger.warning(f"Registration failed: User '{username}' already exists")
                return False
            
            # Create new user
            self.users[username] = {
                "password_hash": self._hash_password(password),
                "email": email,
                "created_at": time.time()
            }
            
            logger.info(f"User '{username}' registered successfully")
            return True
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return False
    
    def get_user_info(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get user information.
        
        Args:
            username: The username
            
        Returns:
            Dict with user info or None if user not found
        """
        if username in self.users:
            user_info = self.users[username].copy()
            # Remove sensitive information
            user_info.pop("password_hash", None)
            return user_info
        return None
    
    def change_password(self, username: str, old_password: str, new_password: str) -> bool:
        """
        Change user password.
        
        Args:
            username: The username
            old_password: The current password
            new_password: The new password
            
        Returns:
            bool: True if password changed successfully, False otherwise
        """
        try:
            # First authenticate with old password
            if not self.authenticate_user(username, old_password):
                logger.warning(f"Password change failed: Invalid old password for user '{username}'")
                return False
            
            # Update password
            self.users[username]["password_hash"] = self._hash_password(new_password)
            logger.info(f"Password changed successfully for user '{username}'")
            return True
            
        except Exception as e:
            logger.error(f"Password change error: {str(e)}")
            return False