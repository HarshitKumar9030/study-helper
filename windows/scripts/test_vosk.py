#!/usr/bin/env python3
"""
Simple test script to check if Vosk wake word detection is working
"""

import os
import sys
import json
import time
import pyaudio
from vosk import Model, KaldiRecognizer

def test_vosk_detection():
    print("Testing Vosk Wake Word Detection...")
    print("=" * 50)
      # Check model - prioritize better models
    model_paths = [
        os.path.join(os.path.dirname(__file__), "models", "vosk-model-en-us-0.22-lgraph"),      # Large
        os.path.join(os.path.dirname(__file__), "models", "vosk-model-en-us-0.22"),             # Medium  
        os.path.join(os.path.dirname(__file__), "models", "vosk-model-small-en-us-0.15")        # Small
    ]
    
    model_path = None
    for path in model_paths:
        if os.path.exists(path):
            model_path = path
            break
    
    if not model_path:
        print(f"❌ No model found. Checked paths:")
        for path in model_paths:
            print(f"   - {path}")
        return False
    
    print(f"✅ Model found at: {model_path}")
    
    try:
        # Initialize model
        print("Loading model...")
        model = Model(model_path)
        recognizer = KaldiRecognizer(model, 16000)
        print("✅ Model loaded successfully")
        
        # Initialize audio
        print("Initializing audio...")
        mic = pyaudio.PyAudio()
        
        # Find input device
        device_info = None
        for i in range(mic.get_device_count()):
            info = mic.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                device_info = info
                break
        
        if device_info is None:
            print("❌ No input audio device found")
            return False
        
        print(f"✅ Audio device: {device_info['name']}")
        
        # Open stream
        stream = mic.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=4000
        )
        
        print("✅ Audio stream opened")
        print("\n🎤 Say 'hey study helper' or speak anything...")
        print("Press Ctrl+C to stop\n")
        
        while True:
            data = stream.read(4000, exception_on_overflow=False)
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                if result.get('text'):
                    text = result['text'].lower()
                    confidence = result.get('confidence', 0.0)
                    print(f"🔊 Heard: '{text}' (confidence: {confidence:.2f})")
                    
                    if 'hey study helper' in text:
                        print("🎯 WAKE WORD DETECTED!")
                    elif 'study helper' in text:
                        print("📢 Partial wake word detected")
            else:
                partial = json.loads(recognizer.PartialResult())
                if partial.get('partial'):
                    print(f"📝 Partial: '{partial['partial']}'", end='\r')
    
    except KeyboardInterrupt:
        print("\n\n⏹️ Test stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        try:
            stream.stop_stream()
            stream.close()
            mic.terminate()
        except:
            pass
    
    return True

if __name__ == "__main__":
    success = test_vosk_detection()
    if not success:
        print("\n❌ Test failed. Check the issues above.")
        sys.exit(1)
    else:
        print("\n✅ Test completed successfully!")
