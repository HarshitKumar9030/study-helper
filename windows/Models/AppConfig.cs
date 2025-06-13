using System;

namespace StudyHelperVoiceAssistant.Models
{
    public class StudyHelperConfig
    {
        public string ApiKey { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = "http://localhost:3000";
        public int Timeout { get; set; } = 30;
        public int RetryAttempts { get; set; } = 3;
        public int RetryDelay { get; set; } = 2;
    }    public class VoiceSettings
    {
        public double SpeechRate { get; set; } = 1.0;
        public double SpeechVolume { get; set; } = 0.8;
        public string Language { get; set; } = "en-US";
        public double ConfidenceThreshold { get; set; } = 0.4;
        public string ActivationKeyword { get; set; } = "hey study helper";
        public bool AutoSpeak { get; set; } = true;
        public bool ContinuousListening { get; set; } = true;
        public string Hotkey { get; set; } = "Ctrl+Shift+S";
        public string MicrophoneDeviceId { get; set; } = string.Empty;
        public string SpeakerDeviceId { get; set; } = string.Empty;
        public double MicrophoneGain { get; set; } = 1.0;
        public bool NoiseReduction { get; set; } = true;
        public int ListenTimeout { get; set; } = 5000; // milliseconds
        
        // Enhanced voice recognition settings (EVA-inspired)
        public bool UseHybridVoiceRecognition { get; set; } = true; // Enable EVA-style dual-engine approach
        public double VoskConfidenceThreshold { get; set; } = 0.75; // Higher threshold for wake word detection
        public bool EnableVoskFallback { get; set; } = true; // Fallback to regular recognition if Vosk fails
    }public class SystemSettings
    {
        public bool StartWithWindows { get; set; } = true;
        public bool MinimizeToTray { get; set; } = true;
        public bool StartMinimized { get; set; } = false;
        public bool ShowNotifications { get; set; } = true;
        public string LogLevel { get; set; } = "Information";
    }

    public class AppConfig
    {
        public StudyHelperConfig StudyHelper { get; set; } = new();
        public VoiceSettings VoiceSettings { get; set; } = new();
        public SystemSettings SystemSettings { get; set; } = new();
    }

    public class VoiceCommandRequest
    {
        public string Command { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public string ClientVersion { get; set; } = "1.0.0";
    }

    public class VoiceCommandResponse
    {
        public bool Success { get; set; }
        public string Response { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string User { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public UserInfo? User { get; set; }
    }    public class UserInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
    }

    public class AudioDevice
    {
        public string DeviceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
        public bool IsEnabled { get; set; } = true;
        public string DeviceType { get; set; } = string.Empty; // "Microphone" or "Speaker"
    }

    public class MicrophoneInfo
    {
        public string DeviceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
        public bool IsWorking { get; set; } = false;
        public double SignalLevel { get; set; } = 0.0;
    }
}
