"""
Voice Assistant service for speech recognition and text-to-speech.
"""
import speech_recognition as sr
import pyttsx3
from typing import Optional
from utils.config import Config
from utils.logger import get_logger

class VoiceAssistant:
    """Voice assistant for speech recognition and text-to-speech functionality."""
    
    def __init__(self):
        """Initialize the voice assistant."""
        self.config = Config()
        self.logger = get_logger(__name__)
        
        # Initialize recognizer and microphone
        self.recognizer = sr.Recognizer()
        self.microphone = None
        self.tts_engine = None
        
        # Initialize components
        self._init_microphone()
        self._init_tts()
        
        self.logger.info("Voice Assistant initialized")
    
    def _init_microphone(self):
        """Initialize the microphone."""
        try:
            self.microphone = sr.Microphone()
            with self.microphone as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
            self.logger.info("Microphone initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize microphone: {e}")
    
    def _init_tts(self):
        """Initialize text-to-speech engine."""
        try:
            self.tts_engine = pyttsx3.init()
            if self.config.VOICE_RATE:
                self.tts_engine.setProperty('rate', self.config.VOICE_RATE)
            if self.config.VOICE_VOLUME:
                self.tts_engine.setProperty('volume', self.config.VOICE_VOLUME)
            self.logger.info("TTS engine initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize TTS engine: {e}")
    
    def is_available(self) -> bool:
        """Check if voice assistant is available."""
        return (self.config.VOICE_ENABLED and 
                self.microphone is not None and 
                self.tts_engine is not None)
      def speak(self, text: str):
        """Convert text to speech."""
        if not self.tts_engine:
            print(f"TTS: {text}")  # Fallback to console
            return
        
        try:
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        except Exception as e:
            self.logger.error(f"TTS error: {e}")
            print(f"TTS: {text}")  # Fallback to console
    
    def listen(self, timeout: int = 5) -> Optional[str]:
        """Listen for speech and return recognized text."""
        if not self.microphone:
            return None
        
        try:
            with self.microphone as source:
                print("Listening...")
                # Adjust for ambient noise first
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                # Listen with longer timeout and phrase time limit
                audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=10)
            
            print("Processing speech...")
            text = self.recognizer.recognize_google(audio)
            self.logger.info(f"Recognized: {text}")
            return text
            
        except sr.WaitTimeoutError:
            print("No speech detected (timeout)")
            return None
        except sr.UnknownValueError:
            print("Could not understand audio")
            return None
        except sr.RequestError as e:
            self.logger.error(f"Speech recognition error: {e}")
            print(f"Recognition service error: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Voice recognition error: {e}")
            print(f"Voice recognition error: {e}")
            return None
    
    def get_available_microphones(self) -> list:
        """Get list of available microphones."""
        try:
            mic_list = []
            for index, name in enumerate(sr.Microphone.list_microphone_names()):
                mic_list.append({
                    'index': index,
                    'name': name
                })
            return mic_list
        except Exception as e:
            self.logger.error(f"Error getting microphones: {e}")
            return []
    
    def set_microphone(self, device_index: Optional[int] = None):
        """Set the microphone device."""
        try:
            if device_index is not None:
                self.microphone = sr.Microphone(device_index=device_index)
            else:
                self.microphone = sr.Microphone()
            
            # Test the new microphone
            with self.microphone as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
            
            self.logger.info(f"Microphone set to device index: {device_index}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to set microphone: {e}")
            return False
    
    def test_microphone(self) -> bool:
        """Test if the microphone is working."""
        try:
            if not self.microphone:
                return False
            
            with self.microphone as source:
                print("Testing microphone... Make some noise!")
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                audio = self.recognizer.listen(source, timeout=3, phrase_time_limit=2)
                
            # Try to recognize something
            try:
                text = self.recognizer.recognize_google(audio)
                print(f"Microphone test successful! Heard: {text}")
                return True
            except:
                print("Microphone hardware works, but no clear speech detected")
                return True
                
        except Exception as e:
            print(f"Microphone test failed: {e}")
            return False