#!/usr/bin/env python3
"""
Enhanced Vosk-based wake word detection for StudyHelper Voice Assistant
Based on EVA's wake word detection system with superior accuracy
"""

import os
import sys
import json
import time
import asyncio
import pyaudio
from vosk import Model, KaldiRecognizer
import logging

# Configuration
SAMPLE_RATE = 16000
BUFFER_SIZE = 3000
CHANNELS = 1
CONFIDENCE_THRESHOLD = 0.75

# Command line arguments
if len(sys.argv) < 3:
    print("Usage: python vosk_wake_word.py <wake_word> <confidence_threshold>")
    sys.exit(1)

WAKE_WORD = sys.argv[1].lower()
try:
    CONFIDENCE_THRESHOLD = float(sys.argv[2])
except (ValueError, IndexError):
    CONFIDENCE_THRESHOLD = 0.75

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables
mic = None
stream = None
model = None
recognizer = None
initial_frames = 0

def initialize_audio():
    """Initialize audio input stream"""
    global mic, stream
    
    try:
        mic = pyaudio.PyAudio()
        
        # Find the best input device
        device_info = None
        device_count = mic.get_device_count()
        
        for i in range(device_count):
            info = mic.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                device_info = info
                break
        
        if device_info is None:
            logger.error("No input audio device found")
            return False
        
        logger.info(f"Using audio device: {device_info['name']}")
        
        stream = mic.open(
            format=pyaudio.paInt16,
            channels=CHANNELS,
            rate=SAMPLE_RATE,
            input=True,
            frames_per_buffer=BUFFER_SIZE,
            input_device_index=device_info['index'] if device_info else None
        )
        stream.start_stream()
        logger.info(f"Audio initialized: {SAMPLE_RATE}Hz, {CHANNELS} channel(s), buffer: {BUFFER_SIZE}")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize audio: {e}")
        return False

def initialize_vosk():
    """Initialize Vosk speech recognition model"""
    global model, recognizer
    
    try:
        # Try to find model in multiple locations
        model_paths = [
            os.path.join(os.getcwd(), "model"),
            os.path.join(os.getcwd(), "vosk-model"),
            os.path.join(os.path.dirname(__file__), "..", "model"),
            os.path.join(os.path.dirname(__file__), "..", "vosk-model"),
            os.path.join(os.path.dirname(__file__), "model"),
            os.path.join(os.path.dirname(__file__), "vosk-model")
        ]
        
        model_path = None
        for path in model_paths:
            if os.path.exists(path):
                model_path = path
                break
        
        if not model_path:
            logger.error("Vosk model not found. Please download a model and place it in 'model' or 'vosk-model' directory")
            logger.info("You can download models from: https://alphacephei.com/vosk/models")
            return False
        
        logger.info(f"Loading Vosk model from: {model_path}")
        model = Model(model_path)
        recognizer = KaldiRecognizer(model, SAMPLE_RATE)
        
        # Set grammar for wake word detection (EVA-style configuration)
        grammar_words = [WAKE_WORD, "stop", "listening", "quit", "exit", "[unk]"]
        grammar = json.dumps({"words": grammar_words})
        recognizer.SetGrammar(grammar)
        recognizer.SetWords(True)
        recognizer.SetPartialWords(True)
        
        logger.info(f"Vosk initialized with model: {model_path}")
        logger.info(f"Listening for wake word: '{WAKE_WORD}' (confidence >= {CONFIDENCE_THRESHOLD})")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize Vosk: {e}")
        return False

async def send_message(message: str):
    """Send message to named pipe (EVA-style communication)"""
    try:
        # Use Windows named pipe format
        pipe_path = r"\\.\pipe\studyhelper_wake_word"
        
        # Try to connect to the named pipe
        with open(pipe_path, 'wb') as pipe:
            pipe.write(message.encode('utf-8'))
            pipe.flush()
        logger.debug(f"Sent message: {message}")
    except FileNotFoundError:
        logger.debug("Named pipe not ready, waiting for client...")
        await asyncio.sleep(0.1)
    except PermissionError:
        logger.debug("Named pipe permission denied, retrying...")
        await asyncio.sleep(0.1)
    except Exception as e:
        logger.warning(f"Failed to send message '{message}': {e}")
        await asyncio.sleep(0.1)

async def process_recognition_result(result_json: str):
    """Process recognition result and detect wake words (following EVA's approach)"""
    try:
        result = json.loads(result_json)
        
        if "result" in result:
            # Final result with word-level confidence
            text = result.get("text", "").lower().strip()
            words = result.get("result", [])
            
            if not text:
                return False
            
            logger.debug(f"Recognized text: '{text}'")
            
            # Check for wake word with confidence
            if WAKE_WORD in text:
                wake_word_confidence = 0.0
                for word_info in words:
                    word = word_info.get("word", "").lower()
                    if word == WAKE_WORD:
                        wake_word_confidence = word_info.get("conf", 0.0)
                        break
                
                if wake_word_confidence >= CONFIDENCE_THRESHOLD:
                    logger.info(f"Wake word '{WAKE_WORD}' detected with confidence: {wake_word_confidence:.2f}")
                    await send_message("wake_word_detected")
                    return True
                else:
                    logger.debug(f"Wake word detected but confidence too low: {wake_word_confidence:.2f} < {CONFIDENCE_THRESHOLD}")
            
            # Check for stop commands
            stop_phrases = ["stop listening", "stop", "quit", "exit"]
            for stop_phrase in stop_phrases:
                if stop_phrase in text:
                    stop_confidence = 1.0
                    stop_words = stop_phrase.split()
                    
                    for stop_word in stop_words:
                        for word_info in words:
                            if word_info.get("word", "").lower() == stop_word:
                                stop_confidence = min(stop_confidence, word_info.get("conf", 0.0))
                                break
                    
                    if stop_confidence >= CONFIDENCE_THRESHOLD:
                        logger.info(f"Stop command detected: '{stop_phrase}' (confidence: {stop_confidence:.2f})")
                        await send_message("stop_listening")
                        return True
        
        elif "partial" in result:
            # Partial result - used for real-time feedback
            text = result.get("partial", "").lower().strip()
            if text and WAKE_WORD in text:
                logger.debug(f"Wake word detected in partial result: '{text}'")
    
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse JSON result: {e}")
    except Exception as e:
        logger.error(f"Error processing recognition result: {e}")
    
    return False

async def wake_word_detection_loop():
    """Main wake word detection loop (EVA-inspired)"""
    global initial_frames, stream
    
    logger.info("Starting enhanced wake word detection loop...")
    frame_count = 0
    
    try:
        while True:
            # Read audio data
            if stream and not stream.is_stopped():
                try:
                    data = stream.read(1500, exception_on_overflow=False)
                    frame_count += 1
                    
                    # Send initialization signal after a few frames
                    if initial_frames < 3:
                        initial_frames += 1
                        if initial_frames == 3:
                            await send_message("engine_ready")
                            logger.info("Vosk wake word engine ready and initialized")
                    
                    # Process audio with Vosk
                    if recognizer.AcceptWaveform(data):
                        # Final result
                        result = recognizer.Result()
                        detected = await process_recognition_result(result)
                        
                        # Also process final result
                        final_result = recognizer.FinalResult()
                        if not detected:
                            await process_recognition_result(final_result)
                    else:
                        # Partial result for real-time feedback
                        partial_result = recognizer.PartialResult()
                        await process_recognition_result(partial_result)
                    
                    # Periodic logging
                    if frame_count % 1000 == 0:
                        logger.debug(f"Processed {frame_count} audio frames")
                        
                except Exception as audio_error:
                    logger.error(f"Audio processing error: {audio_error}")
                    await asyncio.sleep(0.1)
            else:
                logger.warning("Audio stream not available")
                await asyncio.sleep(1.0)
            
            # Small delay to prevent excessive CPU usage (EVA uses similar approach)
            await asyncio.sleep(0.01)
            
    except KeyboardInterrupt:
        logger.info("Wake word detection stopped by user")
    except Exception as e:
        logger.error(f"Error in wake word detection loop: {e}")
    finally:
        cleanup()

def cleanup():
    """Clean up resources"""
    global stream, mic
    
    try:
        if stream:
            stream.stop_stream()
            stream.close()
        if mic:
            mic.terminate()
        logger.info("Audio resources cleaned up")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")

async def main():
    """Main entry point"""
    logger.info("StudyHelper Enhanced Vosk Wake Word Detection starting...")
    logger.info(f"Target wake word: '{WAKE_WORD}'")
    logger.info(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")
    
    # Initialize components
    if not initialize_audio():
        logger.error("Failed to initialize audio")
        sys.exit(1)
    
    if not initialize_vosk():
        logger.error("Failed to initialize Vosk")
        sys.exit(1)
    
    logger.info("All components initialized successfully")
    
    # Start wake word detection
    await wake_word_detection_loop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Application terminated by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
    finally:
        cleanup()
