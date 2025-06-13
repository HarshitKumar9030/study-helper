#!/usr/bin/env python3


# you may use this to download vosk models
# usage > python download.py medium (for medium model check the file for more info)
import os
import requests
import zipfile
import shutil
from pathlib import Path

# Available models (ordered by quality/size)
MODELS = {
    "small": {
        "url": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip",
        "name": "vosk-model-small-en-us-0.15",
        "size": "40MB",
        "description": "Lightweight model (good for basic detection)"
    },
    "medium": {
        "url": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip",
        "name": "vosk-model-en-us-0.22",
        "size": "1.8GB",
        "description": "High accuracy model (recommended for wake words)"
    },
    "large": {
        "url": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip",
        "name": "vosk-model-en-us-0.22-lgraph",
        "size": "2.3GB",
        "description": "Highest accuracy model (best quality)"
    }
}

def download_model(model_type="medium"):
    
    if model_type not in MODELS:
        print(f"❌ Unknown model type: {model_type}")
        print(f"Available models: {', '.join(MODELS.keys())}")
        return None
    
    model_info = MODELS[model_type]
    
    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(exist_ok=True)
    
    model_name = model_info["name"]
    model_url = model_info["url"]
    model_zip = models_dir / f"{model_name}.zip"
    model_dir = models_dir / model_name
    
    if model_dir.exists():
        print(f"✅ Model already exists at: {model_dir}")
        return str(model_dir)
    
    print(f"📦 Model: {model_info['description']}")
    print(f"📊 Size: {model_info['size']}")
    print(f"🔗 URL: {model_url}")
    print(f"📂 Destination: {model_dir}")
    print()
    print("⚠️  Note: Medium/Large models provide much better wake word detection")
    print("    but require more disk space and initial download time.")
    print()
    
    response = input("Continue with download? (y/N): ").lower().strip()
    if response not in ['y', 'yes']:
        print("❌ Download cancelled")
        return None
    
    print(f"⬇️  Downloading {model_name}...")
    print("This may take several minutes for larger models...")
    
    try:
        response = requests.get(model_url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded_size = 0
        
        with open(model_zip, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded_size += len(chunk)
                if total_size > 0:
                    progress = (downloaded_size / total_size) * 100
                    print(f"\rProgress: {progress:.1f}%", end="", flush=True)
        
        print(f"\n✅ Download completed: {model_zip}")
        
        print("📦 Extracting model...")
        with zipfile.ZipFile(model_zip, 'r') as zip_ref:
            zip_ref.extractall(models_dir)
        
        model_zip.unlink()
        
        print(f"✅ Model extracted to: {model_dir}")
        return str(model_dir)
        
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        if model_zip.exists():
            model_zip.unlink()
        if model_dir.exists():
            shutil.rmtree(model_dir)
        return None

def list_models():
    """List available models"""
    print("Available Vosk Models:")
    print("=" * 50)
    
    for model_type, info in MODELS.items():
        print(f"🔹 {model_type.upper()}")
        print(f"   Description: {info['description']}")
        print(f"   Size: {info['size']}")
        print(f"   Name: {info['name']}")
        print()

def check_existing_models():
    """Check what models are already downloaded"""
    models_dir = Path(__file__).parent / "models"
    
    if not models_dir.exists():
        print("📂 No models directory found")
        return
    
    existing_models = []
    for model_type, info in MODELS.items():
        model_path = models_dir / info["name"]
        if model_path.exists():
            existing_models.append((model_type, str(model_path)))
    
    if existing_models:
        print("✅ Existing models:")
        for model_type, path in existing_models:
            print(f"   🔹 {model_type.upper()}: {path}")
    else:
        print("📭 No models found")

if __name__ == "__main__":
    import sys
    
    print("StudyHelper Voice Assistant - Enhanced Model Downloader")
    print("=" * 60)
    print()
    
    check_existing_models()
    print()
    
    if len(sys.argv) > 1:
        model_type = sys.argv[1].lower()
        if model_type == "list":
            list_models()
        else:
            model_path = download_model(model_type)
            if model_path:
                print(f"\n🎉 Success! Model ready at: {model_path}")
                print("\n💡 To use this model:")
                print("   1. Update HybridVoiceService.cs with the new model path")
                print("   2. Or ensure your Vosk script looks for this model name")
    else:
        print("🤔 Which model would you like to download?")
        print()
        list_models()
        print("🔧 For better wake word detection, we recommend the MEDIUM model")
        print("   (it's larger but much more accurate)")
        print()
        
        model_type = input("Enter model type (small/medium/large) or 'list' for details: ").lower().strip()
        
        if model_type == "list":
            list_models()
        elif model_type in MODELS:
            model_path = download_model(model_type)
            if model_path:
                print(f"\n🎉 Success! Model ready at: {model_path}")
                print("\n💡 Next steps:")
                print("   1. Test with: python test_vosk.py")
                print("   2. Run the main application")
                print("   3. Try saying 'hey study helper'")
        else:
            print(f"❌ Invalid model type: {model_type}")
            print(f"Available: {', '.join(MODELS.keys())}")
