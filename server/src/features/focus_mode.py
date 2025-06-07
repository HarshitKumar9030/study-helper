"""
Focus Mode service for blocking distracting websites and applications.
"""
import os
import time
import threading
from typing import List, Optional
from utils.config import Config
from utils.logger import get_logger

class FocusMode:
    """Focus mode for blocking distractions during study sessions."""
    
    def __init__(self):
        """Initialize focus mode."""
        self.config = Config()
        self.logger = get_logger(__name__)
        self.is_active = False
        self.session_timer = None
        self.blocked_sites = list(self.config.BLOCKED_SITES)
        
        self.logger.info("Focus Mode initialized")
    
    def is_available(self) -> bool:
        """Check if focus mode is available."""
        return self.config.FOCUS_MODE_ENABLED
    
    def start_session(self, duration_minutes: int = 25):
        """Start a focus session."""
        if self.is_active:
            self.logger.warning("Focus session already active")
            return False
        
        self.is_active = True
        self.logger.info(f"Starting {duration_minutes}-minute focus session")
        
        # Block sites
        self._block_sites()
        
        # Set timer
        self.session_timer = threading.Timer(
            duration_minutes * 60, 
            self._end_session
        )
        self.session_timer.start()
        
        return True
    
    def end_session(self):
        """End the current focus session."""
        if not self.is_active:
            return False
        
        self._end_session()
        return True
    
    def _end_session(self):
        """Internal method to end session."""
        self.is_active = False
        if self.session_timer:
            self.session_timer.cancel()
        
        # Unblock sites
        self._unblock_sites()
        
        self.logger.info("Focus session ended")
    
    def _block_sites(self):
        """Block distracting websites."""
        try:
            # This is a simple implementation using hosts file
            # In a production app, you might use more sophisticated methods
            hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
            
            if os.name == 'nt':  # Windows
                with open(hosts_path, 'r') as f:
                    content = f.read()
                
                # Add blocking entries
                with open(hosts_path, 'a') as f:
                    f.write("\n# Study Helper Focus Mode\n")
                    for site in self.blocked_sites:
                        f.write(f"127.0.0.1 {site}\n")
                        f.write(f"127.0.0.1 www.{site}\n")
                
                self.logger.info(f"Blocked {len(self.blocked_sites)} sites")
            else:
                self.logger.warning("Site blocking not implemented for this OS")
                
        except PermissionError:
            self.logger.error("Permission denied to modify hosts file. Run as administrator.")
        except Exception as e:
            self.logger.error(f"Error blocking sites: {e}")
    
    def _unblock_sites(self):
        """Unblock websites."""
        try:
            hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
            
            if os.name == 'nt':  # Windows
                with open(hosts_path, 'r') as f:
                    lines = f.readlines()
                
                # Remove blocking entries
                with open(hosts_path, 'w') as f:
                    skip_lines = False
                    for line in lines:
                        if "# Study Helper Focus Mode" in line:
                            skip_lines = True
                            continue
                        elif skip_lines and line.strip() == "":
                            skip_lines = False
                        elif not skip_lines:
                            f.write(line)
                
                self.logger.info("Unblocked websites")
            else:
                self.logger.warning("Site unblocking not implemented for this OS")
                
        except Exception as e:
            self.logger.error(f"Error unblocking sites: {e}")
    
    def get_blocked_sites(self) -> List[str]:
        """Get list of blocked sites."""
        return self.blocked_sites.copy()
    
    def add_blocked_site(self, site: str):
        """Add a site to the blocked list."""
        if site not in self.blocked_sites:
            self.blocked_sites.append(site)
            self.logger.info(f"Added {site} to blocked sites")
    
    def remove_blocked_site(self, site: str):
        """Remove a site from the blocked list."""
        if site in self.blocked_sites:
            self.blocked_sites.remove(site)
            self.logger.info(f"Removed {site} from blocked sites")
    
    def get_session_status(self) -> dict:
        """Get current session status."""
        return {
            "is_active": self.is_active,
            "blocked_sites_count": len(self.blocked_sites)
        }