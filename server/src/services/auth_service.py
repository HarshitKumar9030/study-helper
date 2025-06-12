import hashlib
import time
import requests
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
from src.utils.config import Config
from src.utils.logger import get_logger

logger = get_logger(__name__)

class AuthService:
    """Authentication service for user login and registration."""
    
    def __init__(self):
        """Initialize the authentication service."""
        self.config = Config()
        self.mongodb_uri = getattr(self.config, 'MONGODB_URI', 'mongodb://localhost:27017/study-helper')
        self.nextauth_secret = getattr(self.config, 'NEXTAUTH_SECRET', '')
        self.nextjs_api_url = getattr(self.config, 'NEXTJS_API_URL', 'http://localhost:3000/api')
        
        self.client = None
        self.db = None
        self.users_collection = None
        
        # Fallback users for offline mode
        self.fallback_users = {
            "demo": {
                "password_hash": self._hash_password("demo123"),
                "email": "demo@studyhelper.com",
                "name": "Demo User",
                "role": "user",
                "created_at": time.time()
            }
        }
        
        self.current_user = None
        self.current_token = None
        
        # Try to connect to MongoDB
        self._connect_mongodb()
        
        logger.info("Authentication service initialized")
    
    def _connect_mongodb(self):
        """Connect to MongoDB database."""
        try:
            if self.mongodb_uri:
                self.client = MongoClient(self.mongodb_uri, serverSelectionTimeoutMS=5000)
                # Test connection
                self.client.admin.command('ping')
                self.db = self.client.get_database()
                self.users_collection = self.db.users
                logger.info("Connected to MongoDB successfully")
                return True
        except Exception as e:
            logger.warning(f"Failed to connect to MongoDB: {e}. Using fallback authentication.")
            self.client = None
            self.db = None
            self.users_collection = None
            return False
    
    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt (compatible with Next.js)."""
        try:
            # Use bcrypt for compatibility with Next.js
            salt = bcrypt.gensalt()
            return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        except:
            # Fallback to SHA-256
            return hashlib.sha256(password.encode()).hexdigest()
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against its hash."""
        try:
            # Try bcrypt first (Next.js compatible)
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except:
            # Fallback to SHA-256
            return hashlib.sha256(password.encode()).hexdigest() == password_hash
    
    def authenticate_user(self, username: str, password: str) -> bool:
        """
        Authenticate a user with username/email and password.
        Tries MongoDB first, then falls back to local authentication.
        
        Args:
            username: The username or email
            password: The password
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            if not username or not password:
                logger.warning("Authentication failed: Empty username or password")
                return False
              # Try MongoDB authentication first
            if self.users_collection is not None:
                try:
                    # Find user by email or username
                    user = self.users_collection.find_one({
                        "$or": [
                            {"email": username},
                            {"name": username}
                        ]
                    })
                    
                    if user and self._verify_password(password, user.get('password', '')):
                        self.current_user = {
                            'id': str(user['_id']),
                            'email': user['email'],
                            'name': user['name'],
                            'role': user.get('role', 'user')
                        }
                        logger.info(f"User '{username}' authenticated via MongoDB")
                        return True
                        
                except Exception as e:
                    logger.error(f"MongoDB authentication error: {e}")
            
            # Try Next.js authentication
            if '@' in username:  # Assume email if contains @
                if self._authenticate_with_nextjs(username, password):
                    return True
            
            # Fallback to local authentication
            return self._authenticate_local(username, password)
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return False
    
    def _authenticate_with_nextjs(self, username: str, password: str) -> bool:
        """Authenticate via Next.js API."""
        try:
            payload = {
                'email': username,
                'password': password
            }
            
            response = requests.post(
                f"{self.nextjs_api_url}/auth/signin",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    # Store user information and token
                    self.current_user = data.get('user', {})
                    self.current_token = data.get('token')
                    logger.info(f"User '{username}' authenticated via Next.js")
                    return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Next.js authentication failed: {e}")
            return False
    
    def _authenticate_local(self, username: str, password: str) -> bool:
        """Authenticate via local user store."""
        try:
            # Check if user exists in fallback users
            if username not in self.fallback_users:
                logger.warning(f"Local authentication failed: User '{username}' not found")
                return False
            
            # Verify password
            if self._verify_password(password, self.fallback_users[username]["password_hash"]):
                # Set current user from local data
                user_data = self.fallback_users[username].copy()
                user_data.pop("password_hash", None)
                user_data['username'] = username
                self.current_user = user_data
                logger.info(f"User '{username}' authenticated locally")
                return True
            else:
                logger.warning(f"Local authentication failed: Invalid password for user '{username}'")
                return False
                
        except Exception as e:
            logger.error(f"Local authentication error: {str(e)}")
            return False
    
    def register_user(self, name: str, email: str, password: str) -> bool:
        """
        Register a new user in MongoDB.
        
        Args:
            name: The user's name
            email: The email address
            password: The password
            
        Returns:
            bool: True if registration successful, False otherwise
        """
        try:
            if not name or not email or not password:
                logger.warning("Registration failed: Missing required fields")
                return False
              # Try MongoDB registration first
            if self.users_collection is not None:
                try:
                    # Check if user already exists
                    existing_user = self.users_collection.find_one({"email": email})
                    if existing_user:
                        logger.warning(f"Registration failed: Email '{email}' already exists")
                        return False
                    
                    # Create new user
                    user_data = {
                        "name": name,
                        "email": email,
                        "password": self._hash_password(password),
                        "role": "user",
                        "createdAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow()
                    }
                    
                    result = self.users_collection.insert_one(user_data)
                    if result.inserted_id:
                        logger.info(f"User '{email}' registered successfully in MongoDB")
                        return True
                        
                except Exception as e:
                    logger.error(f"MongoDB registration error: {e}")
            
            # Fallback to local storage
            username = email.split('@')[0]  # Use email prefix as username
            if username not in self.fallback_users:
                self.fallback_users[username] = {
                    "password_hash": self._hash_password(password),
                    "email": email,
                    "name": name,
                    "role": "user",
                    "created_at": time.time()
                }
                logger.info(f"User '{email}' registered successfully in fallback storage")
                return True
            else:
                logger.warning(f"Registration failed: User '{username}' already exists")
                return False
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return False
    
    def get_user_info(self, user_id: str = None) -> Optional[Dict[str, Any]]:
        """
        Get user information.
        
        Args:
            user_id: The user ID (optional, uses current user if not provided)
            
        Returns:
            Dict with user info or None if user not found
        """
        if not user_id and self.current_user:
            return self.current_user.copy()
        
        if self.users_collection is not None and user_id:
            try:
                from bson import ObjectId
                user = self.users_collection.find_one({"_id": ObjectId(user_id)})
                if user:
                    return {
                        'id': str(user['_id']),
                        'email': user['email'],
                        'name': user['name'],
                        'role': user.get('role', 'user'),
                        'createdAt': user.get('createdAt')
                    }
            except Exception as e:
                logger.error(f"Error getting user info: {e}")
        
        return None
    
    def change_password(self, old_password: str, new_password: str) -> bool:
        """
        Change current user's password.
        
        Args:
            old_password: The current password
            new_password: The new password
            
        Returns:
            bool: True if password changed successfully, False otherwise
        """
        try:
            if not self.current_user:
                logger.warning("Password change failed: No user authenticated")
                return False
              # Verify old password first
            if self.users_collection is not None:
                try:
                    from bson import ObjectId
                    user = self.users_collection.find_one({"_id": ObjectId(self.current_user['id'])})
                    if user and self._verify_password(old_password, user['password']):
                        # Update password in MongoDB
                        result = self.users_collection.update_one(
                            {"_id": ObjectId(self.current_user['id'])},
                            {
                                "$set": {
                                    "password": self._hash_password(new_password),
                                    "updatedAt": datetime.utcnow()
                                }
                            }
                        )
                        if result.modified_count > 0:
                            logger.info(f"Password changed successfully for user '{self.current_user['email']}'")
                            return True
                except Exception as e:
                    logger.error(f"MongoDB password change error: {e}")
            
            # Fallback to local storage
            username = self.current_user.get('username') or self.current_user['email'].split('@')[0]
            if username in self.fallback_users:
                if self._verify_password(old_password, self.fallback_users[username]['password_hash']):
                    self.fallback_users[username]['password_hash'] = self._hash_password(new_password)
                    logger.info(f"Password changed successfully (fallback) for user '{self.current_user['email']}'")
                    return True
            
            logger.warning("Password change failed: Invalid old password")
            return False
            
        except Exception as e:
            logger.error(f"Password change error: {str(e)}")
            return False
    
    def sync_with_nextjs(self) -> bool:
        """Sync authentication state with Next.js backend."""
        try:
            if not self.current_token:
                return False
            
            response = requests.get(
                f"{self.nextjs_api_url}/auth/session",
                headers={'Authorization': f'Bearer {self.current_token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                session_data = response.json()
                if session_data.get('user'):
                    self.current_user = session_data['user']
                    logger.info("Authentication state synced with Next.js")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Next.js sync error: {e}")
            return False
    
    def validate_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a JWT token from Next.js.
        
        Args:
            token: JWT token string
            
        Returns:
            Dict with user data if valid, None otherwise
        """
        try:
            if not token or token == "guest_mode":
                return {"username": "guest", "role": "guest", "mode": "guest"}
            
            # Decode JWT token
            payload = jwt.decode(
                token, 
                self.nextauth_secret, 
                algorithms=["HS256"]
            )
            
            return {
                "id": payload.get("id"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "role": payload.get("role", "user"),
                "exp": payload.get("exp")
            }
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None
        except Exception as e:
            logger.error(f"JWT validation error: {e}")
            return None
    
    def verify_nextauth_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify a NextAuth JWT token."""
        try:
            if not self.nextauth_secret:
                logger.warning("NextAuth secret not configured")
                return None
            
            decoded = jwt.decode(
                token, 
                self.nextauth_secret, 
                algorithms=["HS256"],
                options={"verify_exp": True}
            )
            
            logger.info(f"Token verified for user: {decoded.get('email', 'unknown')}")
            return decoded
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    def authenticate_with_token(self, token: str) -> bool:
        """
        Authenticate using a JWT token from NextAuth.
        
        Args:
            token: JWT token from Next.js
            
        Returns:
            bool: True if token is valid and user authenticated
        """
        if token == "guest_mode":
            self.current_user = {"username": "guest", "role": "guest", "mode": "guest"}
            logger.info("Guest mode authentication")
            return True
        
        user_data = self.verify_nextauth_token(token)
        if user_data:
            self.current_user = {
                'id': user_data.get('id'),
                'email': user_data.get('email'),
                'name': user_data.get('name'),
                'role': user_data.get('role', 'user')
            }
            self.current_token = token
            logger.info(f"User authenticated with token: {user_data.get('email', 'unknown')}")
            return True
        return False
    
    def get_current_user(self) -> Optional[Dict[str, Any]]:
        """Get the currently authenticated user."""
        return self.current_user
    
    def get_current_token(self) -> Optional[str]:
        """Get the current authentication token."""
        return self.current_token
    
    def logout(self):
        """Logout the current user."""
        self.current_user = None
        self.current_token = None
        logger.info("User logged out")
    
    def is_authenticated(self) -> bool:
        """Check if a user is currently authenticated."""
        return self.current_user is not None
    
    def get_user_display_name(self) -> str:
        """Get display name for current user."""
        if not self.current_user:
            return "Guest"
        
        name = self.current_user.get('name') or self.current_user.get('username') or 'User'
        return name
    
    def __del__(self):
        """Cleanup MongoDB connection."""
        if self.client:
            try:
                self.client.close()
            except:
                pass

# Global instance
auth_service = AuthService()