using System;
using System.Threading.Tasks;

namespace StudyHelperVoiceAssistant.Services
{
    /// <summary>
    /// Interface for voice recognition and synthesis services
    /// </summary>
    public interface IVoiceService : IDisposable
    {
        // Properties
        bool IsListening { get; }
        bool IsProcessing { get; }
        string CurrentTranscript { get; }

        // Events
        event EventHandler<string>? CommandReceived;
        event EventHandler<string>? ResponseReceived;
        event EventHandler<string>? StatusChanged;
        event EventHandler<double>? MicrophoneLevelChanged;
        event EventHandler<string>? TranscriptUpdated;
        event EventHandler<string>? WakeWordDetected;        // Methods
        Task StartListeningAsync();
        void StopListening();
        Task SpeakAsync(string text);
        Task CalibrateMicrophoneAsync();
    }
}
