#!/usr/bin/env python3
"""
Quick test of wake word detection with medium model
"""

import os
import sys

# Add the scripts directory to path
scripts_dir = os.path.dirname(__file__)
sys.path.append(scripts_dir)

# Test wake word detection
if __name__ == "__main__":
    print("🎤 Testing Wake Word Detection with Medium Model")
    print("=" * 50)
    
    # Test with medium model and lower confidence
    wake_word = "hey study helper"
    confidence = "0.3"  # Lower confidence threshold
    
    print(f"Wake word: '{wake_word}'")
    print(f"Confidence threshold: {confidence}")
    print()
    print("Starting Vosk wake word detection...")
    print("Say 'hey study helper' clearly into your microphone")
    print("Press Ctrl+C to stop")
    print()
    
    # Import and run the wake word detection
    try:
        import vosk_wake_word
        # This should use the improved script with medium model support
    except Exception as e:
        print(f"Error importing wake word script: {e}")
        print("Make sure vosk_wake_word.py is in the scripts directory")
        sys.exit(1)
