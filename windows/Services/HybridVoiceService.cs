using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StudyHelperVoiceAssistant.Models;
using System;
using System.Diagnostics;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.IO.Pipes;
using System.Speech.Recognition;
using System.Speech.Synthesis;
using System.Globalization;
using System.IO;
using System.Linq;

namespace StudyHelperVoiceAssistant.Services
{    /// <summary>
    /// Enhanced hybrid voice service inspired by EVA's dual-engine approach:
    /// - Vosk (Python) for always-listening wake word detection
    /// - System.Speech.Recognition for command processing after wake word
    /// This provides superior accuracy and performance compared to single-engine approaches
    /// </summary>
    public class HybridVoiceService : IVoiceService
    {
        private readonly AppConfig _config;
        private readonly StudyHelperApiService _apiService;
        private readonly AudioDeviceService _audioDeviceService;
        private readonly ILogger<HybridVoiceService> _logger;

        // Vosk wake word detection (Python process)
        private Process? _voskProcess;
        private CancellationTokenSource? _voskCancellation;
        private NamedPipeServerStream? _voskPipe;
        private bool _isVoskListening = false;
        private Task? _voskMonitoringTask;

        // System.Speech.Recognition for commands (after wake word)
        private SpeechRecognitionEngine? _commandRecognizer;
        private SpeechSynthesizer? _synthesizer;
        private bool _isCommandListening = false;
        private bool _wakeWordDetected = false;
        private bool _isProcessing = false;
        private string _currentTranscript = "";

        // Wake word management (inspired by EVA's reset mechanism)
        private DateTime _lastWakeWordTime = DateTime.MinValue;
        private readonly TimeSpan _wakeWordTimeout = TimeSpan.FromSeconds(10);
        private int _consecutiveWakeWordFailures = 0;
        private const int MAX_WAKE_WORD_FAILURES = 3;

        // Events
        public event EventHandler<string>? CommandReceived;
        public event EventHandler<string>? ResponseReceived;
        public event EventHandler<string>? StatusChanged;
        public event EventHandler<double>? MicrophoneLevelChanged;
        public event EventHandler<string>? TranscriptUpdated;
        public event EventHandler<string>? WakeWordDetected;

        public bool IsListening => _isVoskListening;
        public bool IsProcessing => _isProcessing;
        public string CurrentTranscript => _currentTranscript;

        public HybridVoiceService(IOptions<AppConfig> config, StudyHelperApiService apiService,
                                 AudioDeviceService audioDeviceService, ILogger<HybridVoiceService> logger)
        {
            _config = config.Value;
            _apiService = apiService;
            _audioDeviceService = audioDeviceService;
            _logger = logger;
            
            InitializeCommandRecognizer();
            InitializeSpeechSynthesis();
        }

        /// <summary>
        /// Initialize System.Speech command recognizer for high-accuracy command processing
        /// </summary>
        private void InitializeCommandRecognizer()
        {
            try
            {
                _commandRecognizer?.Dispose();
                
                var culture = CultureInfo.GetCultureInfo(_config.VoiceSettings.Language);
                _commandRecognizer = new SpeechRecognitionEngine(culture);

                // Configure for high-accuracy command recognition
                var dictationGrammar = new DictationGrammar();
                dictationGrammar.Name = "CommandDictation";
                dictationGrammar.Enabled = true;
                _commandRecognizer.LoadGrammar(dictationGrammar);

                // Optimize for accuracy (following EVA's approach)
                _commandRecognizer.UpdateRecognizerSetting("CFGConfidenceRejectionThreshold", 30);
                _commandRecognizer.UpdateRecognizerSetting("HighConfidenceThreshold", 90);
                _commandRecognizer.UpdateRecognizerSetting("NormalConfidenceThreshold", 70);
                _commandRecognizer.UpdateRecognizerSetting("LowConfidenceThreshold", 50);
                _commandRecognizer.UpdateRecognizerSetting("AdaptationOn", 1);

                // Timeouts optimized for command processing
                _commandRecognizer.InitialSilenceTimeout = TimeSpan.FromSeconds(8);
                _commandRecognizer.BabbleTimeout = TimeSpan.FromSeconds(10);
                _commandRecognizer.EndSilenceTimeout = TimeSpan.FromSeconds(3);
                _commandRecognizer.EndSilenceTimeoutAmbiguous = TimeSpan.FromSeconds(2);

                _commandRecognizer.SpeechRecognized += OnCommandRecognized;
                _commandRecognizer.SpeechHypothesized += OnCommandHypothesized;
                _commandRecognizer.SpeechRecognitionRejected += OnCommandRejected;
                _commandRecognizer.AudioLevelUpdated += OnAudioLevelUpdated;

                _commandRecognizer.SetInputToDefaultAudioDevice();
                
                _logger.LogInformation($"Command recognition engine initialized with culture: {culture.Name}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize command recognition engine");
            }
        }

        /// <summary>
        /// Initialize speech synthesis for responses
        /// </summary>
        private void InitializeSpeechSynthesis()
        {
            try
            {
                _synthesizer = new SpeechSynthesizer();
                _synthesizer.SetOutputToDefaultAudioDevice();
                _synthesizer.Rate = (int)(_config.VoiceSettings.SpeechRate * 2) - 2;
                _synthesizer.Volume = (int)(_config.VoiceSettings.SpeechVolume * 100);
                
                _logger.LogInformation("Speech synthesis initialized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize speech synthesis");
            }
        }

        /// <summary>
        /// Start the hybrid voice recognition system
        /// </summary>
        public async Task StartListeningAsync()
        {
            try
            {
                await StartVoskWakeWordDetectionAsync();
                StatusChanged?.Invoke(this, "Listening for wake word...");
                _logger.LogInformation("Hybrid voice recognition started - Vosk for wake words, System.Speech for commands");
                
                if (_config.VoiceSettings.AutoSpeak)
                {
                    await SpeakAsync("Enhanced voice assistant ready. Wake word detection is active.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting hybrid voice recognition");
                StatusChanged?.Invoke(this, $"Error: {ex.Message}");
            }
        }

        /// <summary>
        /// Stop the hybrid voice recognition system
        /// </summary>
        public void StopListening()
        {
            try
            {
                StopVoskWakeWordDetection();
                StopCommandRecognition();
                StatusChanged?.Invoke(this, "Voice recognition stopped");
                TranscriptUpdated?.Invoke(this, "");
                _logger.LogInformation("Hybrid voice recognition stopped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping hybrid voice recognition");
            }
        }

        /// <summary>
        /// Start Vosk wake word detection process (following EVA's architecture)
        /// </summary>
        private async Task StartVoskWakeWordDetectionAsync()
        {
            if (_isVoskListening) return;

            try
            {
                _voskCancellation = new CancellationTokenSource();
                
                // Create named pipe for Vosk communication
                _voskPipe = new NamedPipeServerStream("studyhelper_wake_word", 
                    PipeDirection.In, 1, PipeTransmissionMode.Message, PipeOptions.Asynchronous);

                // Start Vosk Python process
                await StartVoskProcessAsync();

                // Start pipe monitoring task
                _voskMonitoringTask = Task.Run(MonitorVoskPipeAsync, _voskCancellation.Token);

                _isVoskListening = true;
                _consecutiveWakeWordFailures = 0;
                _logger.LogInformation("Vosk wake word detection started successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Vosk wake word detection");
                throw;
            }
        }

        /// <summary>
        /// Start the Vosk Python process for wake word detection
        /// </summary>
        private async Task StartVoskProcessAsync()
        {
            try
            {
                var pythonExe = GetPythonExecutablePath();
                var scriptPath = GetVoskScriptPath();

                _voskProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = pythonExe,
                        Arguments = $"\"{scriptPath}\" \"{_config.VoiceSettings.ActivationKeyword}\" {_config.VoiceSettings.ConfidenceThreshold}",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    }
                };

                _voskProcess.OutputDataReceived += (sender, e) => {
                    if (!string.IsNullOrEmpty(e.Data))
                        _logger.LogDebug($"Vosk output: {e.Data}");
                };

                _voskProcess.ErrorDataReceived += (sender, e) => {
                    if (!string.IsNullOrEmpty(e.Data))
                        _logger.LogWarning($"Vosk error: {e.Data}");
                };

                _voskProcess.Start();
                _voskProcess.BeginOutputReadLine();
                _voskProcess.BeginErrorReadLine();

                _logger.LogInformation($"Vosk process started with PID: {_voskProcess.Id}");
                
                // Give the process a moment to initialize
                await Task.Delay(100);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Vosk process");
                throw;
            }
        }        /// <summary>
        /// Monitor the named pipe for messages from the Vosk process
        /// </summary>
        private async Task MonitorVoskPipeAsync()
        {
            try
            {
                while (!_voskCancellation?.Token.IsCancellationRequested == true && _voskPipe != null)
                {
                    await _voskPipe.WaitForConnectionAsync(_voskCancellation?.Token ?? CancellationToken.None);

                    var buffer = new byte[1024];
                    var bytesRead = await _voskPipe.ReadAsync(buffer, 0, buffer.Length, _voskCancellation?.Token ?? CancellationToken.None);

                    if (bytesRead > 0)
                    {
                        var message = Encoding.UTF8.GetString(buffer, 0, bytesRead).Trim();
                        await HandleVoskMessageAsync(message);
                    }

                    _voskPipe.Disconnect();
                }
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error monitoring Vosk pipe");
                _consecutiveWakeWordFailures++;
                
                // Implement EVA-style restart mechanism on repeated failures
                if (_consecutiveWakeWordFailures >= MAX_WAKE_WORD_FAILURES)
                {
                    _logger.LogWarning("Multiple Vosk failures detected, attempting restart...");
                    await RestartVoskAsync();
                }
            }
        }

        /// <summary>
        /// Handle messages received from the Vosk wake word process
        /// </summary>
        private async Task HandleVoskMessageAsync(string message)
        {
            _logger.LogInformation($"Vosk message received: {message}");

            switch (message.ToLower())
            {
                case "wake_word_detected":
                    if (!_wakeWordDetected && !_isProcessing)
                    {
                        _wakeWordDetected = true;
                        _lastWakeWordTime = DateTime.UtcNow;
                        _consecutiveWakeWordFailures = 0; // Reset failure count
                        
                        WakeWordDetected?.Invoke(this, _config.VoiceSettings.ActivationKeyword);
                        
                        // Start command recognition
                        await StartCommandRecognitionAsync();
                    }
                    break;
                    
                case "stop_listening":
                    StopListening();
                    break;
                    
                case "engine_ready":
                    _logger.LogInformation("Vosk engine is ready and listening");
                    _consecutiveWakeWordFailures = 0;
                    break;
                    
                default:
                    _logger.LogDebug($"Unknown Vosk message: {message}");
                    break;
            }
        }

        /// <summary>
        /// Start System.Speech command recognition after wake word detection
        /// </summary>
        private async Task StartCommandRecognitionAsync()
        {
            if (_isCommandListening || _commandRecognizer == null) return;

            try
            {
                _isCommandListening = true;
                StatusChanged?.Invoke(this, "Listening for command...");
                
                // Start single recognition for the command
                _commandRecognizer.RecognizeAsync(RecognizeMode.Single);
                
                _logger.LogInformation("Command recognition started after wake word detection");
                
                // Set timeout for command recognition
                _ = Task.Delay(_wakeWordTimeout).ContinueWith(async _ => 
                {
                    if (_wakeWordDetected && !_isProcessing)
                    {
                        _logger.LogDebug("Command recognition timeout reached");
                        await ResetForNextCommandAsync();
                    }
                });
                
                if (_config.VoiceSettings.AutoSpeak)
                {
                    await SpeakAsync("Yes, I'm listening. What can I help you with?");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start command recognition");
                await ResetForNextCommandAsync();
            }
        }

        /// <summary>
        /// Handle recognized commands from System.Speech
        /// </summary>
        private async void OnCommandRecognized(object? sender, SpeechRecognizedEventArgs e)
        {
            if (_isProcessing || !_wakeWordDetected) return;

            try
            {
                var recognizedText = e.Result.Text.Trim();
                _currentTranscript = recognizedText;
                
                _logger.LogInformation($"Command recognized: '{recognizedText}' (Confidence: {e.Result.Confidence:F2})");

                // Update transcript
                TranscriptUpdated?.Invoke(this, _currentTranscript);

                // Check confidence threshold
                if (e.Result.Confidence < _config.VoiceSettings.ConfidenceThreshold)
                {
                    _logger.LogDebug($"Command rejected due to low confidence: {e.Result.Confidence:F2} < {_config.VoiceSettings.ConfidenceThreshold:F2}");
                    await SpeakAsync("I didn't catch that clearly. Please try again.");
                    await ResetForNextCommandAsync();
                    return;
                }

                _isProcessing = true;
                CommandReceived?.Invoke(this, recognizedText);

                // Stop command recognition
                StopCommandRecognition();

                // Process the command
                await ProcessCommandAsync(recognizedText, e.Result.Confidence);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing command recognition result");
                await ResetForNextCommandAsync();
            }
        }

        /// <summary>
        /// Handle command hypothesis updates
        /// </summary>
        private void OnCommandHypothesized(object? sender, SpeechHypothesizedEventArgs e)
        {
            var hypothesisText = e.Result.Text;
            _logger.LogTrace($"Command hypothesis: {hypothesisText}");
            TranscriptUpdated?.Invoke(this, hypothesisText);
        }

        /// <summary>
        /// Handle rejected speech recognition
        /// </summary>
        private async void OnCommandRejected(object? sender, SpeechRecognitionRejectedEventArgs e)
        {
            _logger.LogDebug("Command recognition rejected");
            if (_wakeWordDetected)
            {
                await SpeakAsync("I didn't understand that. Please try again.");
                await ResetForNextCommandAsync();
            }
        }

        /// <summary>
        /// Handle audio level updates
        /// </summary>
        private void OnAudioLevelUpdated(object? sender, AudioLevelUpdatedEventArgs e)
        {
            MicrophoneLevelChanged?.Invoke(this, e.AudioLevel);
        }

        /// <summary>
        /// Process the recognized command
        /// </summary>
        private async Task ProcessCommandAsync(string command, double confidence)
        {
            try
            {
                StatusChanged?.Invoke(this, "Processing command...");

                // Check for local commands first
                if (IsStopCommand(command))
                {
                    await SpeakAsync("Voice assistant stopped.");
                    StopListening();
                    return;
                }

                if (IsTestCommand(command))
                {
                    await SpeakAsync("Microphone test successful. I can hear you clearly.");
                    await ResetForNextCommandAsync();
                    return;
                }

                // Send to API for processing
                var response = await _apiService.ProcessVoiceCommandAsync(command, "", confidence);
                
                if (!string.IsNullOrEmpty(response))
                {
                    ResponseReceived?.Invoke(this, response);
                    
                    if (_config.VoiceSettings.AutoSpeak)
                    {
                        await SpeakAsync(response);
                    }
                    
                    _logger.LogInformation("Command processed successfully");
                }
                else
                {
                    var fallbackMessage = "I couldn't process that command. Please try again.";
                    ResponseReceived?.Invoke(this, fallbackMessage);
                    
                    if (_config.VoiceSettings.AutoSpeak)
                    {
                        await SpeakAsync(fallbackMessage);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing command");
                var errorMessage = "Sorry, I had trouble processing that command. Please try again.";
                ResponseReceived?.Invoke(this, errorMessage);
                
                if (_config.VoiceSettings.AutoSpeak)
                {
                    await SpeakAsync(errorMessage);
                }
            }
            finally
            {
                await ResetForNextCommandAsync();
            }
        }

        /// <summary>
        /// Reset the system for the next command (EVA-style state management)
        /// </summary>
        private async Task ResetForNextCommandAsync()
        {
            _isProcessing = false;
            _wakeWordDetected = false;
            _currentTranscript = "";
            StopCommandRecognition();
            StatusChanged?.Invoke(this, "Listening for wake word...");
            TranscriptUpdated?.Invoke(this, "");
            
            _logger.LogDebug("System reset for next command");
            
            // Small delay to prevent rapid retriggering
            await Task.Delay(500);
        }

        /// <summary>
        /// Stop command recognition
        /// </summary>
        private void StopCommandRecognition()
        {
            try
            {
                if (_commandRecognizer != null && _isCommandListening)
                {
                    _commandRecognizer.RecognizeAsyncStop();
                    _isCommandListening = false;
                    _logger.LogDebug("Command recognition stopped");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error stopping command recognition");
            }
        }

        /// <summary>
        /// Stop Vosk wake word detection
        /// </summary>
        private void StopVoskWakeWordDetection()
        {
            try
            {
                _isVoskListening = false;
                _voskCancellation?.Cancel();
                
                _voskProcess?.Kill();
                _voskProcess?.Dispose();
                _voskProcess = null;
                
                _voskPipe?.Dispose();
                _voskPipe = null;
                
                _logger.LogInformation("Vosk wake word detection stopped");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error stopping Vosk detection");
            }
        }

        /// <summary>
        /// Restart Vosk after failures (EVA-style resilience)
        /// </summary>
        private async Task RestartVoskAsync()
        {
            try
            {
                _logger.LogInformation("Restarting Vosk wake word detection...");
                
                StopVoskWakeWordDetection();
                await Task.Delay(2000); // Wait for cleanup
                
                if (_isVoskListening) // Only restart if we were supposed to be listening
                {
                    await StartVoskWakeWordDetectionAsync();
                    _logger.LogInformation("Vosk wake word detection restarted successfully");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to restart Vosk");
            }
        }        /// <summary>
        /// Speak text using speech synthesis
        /// </summary>
        public async Task SpeakAsync(string text)
        {
            try
            {
                if (_synthesizer != null && !string.IsNullOrEmpty(text))
                {
                    await Task.Run(() => _synthesizer.Speak(text));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during speech synthesis");
            }
        }

        /// <summary>
        /// Get Python executable path
        /// </summary>
        private string GetPythonExecutablePath()
        {
            // Check for embedded Python first
            var embeddedPython = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "python", "python.exe");
            if (File.Exists(embeddedPython))
            {
                return embeddedPython;
            }

            // Fall back to system Python
            return "python";
        }

        /// <summary>
        /// Get Vosk script path
        /// </summary>
        private string GetVoskScriptPath()
        {
            return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "scripts", "vosk_wake_word.py");
        }

        /// <summary>
        /// Check if command is a stop command
        /// </summary>
        private bool IsStopCommand(string command)
        {
            var stopPhrases = new[] { "stop listening", "stop", "quit", "exit", "goodbye", "shut down" };
            return stopPhrases.Any(phrase => command.ToLower().Contains(phrase));
        }

        /// <summary>
        /// Check if command is a test command
        /// </summary>
        private bool IsTestCommand(string command)
        {
            var testPhrases = new[] { "test microphone", "test mic", "microphone test", "mic test", "can you hear me" };
            return testPhrases.Any(phrase => command.ToLower().Contains(phrase));        }        /// <summary>
        /// Calibrate microphone for optimal voice recognition
        /// In hybrid mode, this primarily configures the System.Speech engine
        /// and optionally restarts the Vosk process with new settings
        /// </summary>
        public async Task CalibrateMicrophoneAsync()
        {
            try
            {
                _logger.LogInformation("Starting microphone calibration for hybrid voice service");
                
                // Stop current recognition
                var wasListening = _isVoskListening || _isCommandListening;
                StopListening();
                
                // Give a moment for resources to be released
                await Task.Delay(500);
                
                // Reinitialize command recognizer with current audio device
                InitializeCommandRecognizer();
                  // Restart Vosk process if it was running
                if (wasListening && _config.VoiceSettings.UseHybridVoiceRecognition)
                {
                    await StartVoskWakeWordDetectionAsync();
                }
                
                // Test speech synthesis
                await SpeakAsync("Microphone calibration completed. Voice recognition is ready.");
                
                _logger.LogInformation("Microphone calibration completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during microphone calibration");
                StatusChanged?.Invoke(this, $"Calibration failed: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Dispose resources
        /// </summary>
        public void Dispose()
        {
            StopListening();
            
            _voskCancellation?.Dispose();
            _voskProcess?.Dispose();
            _voskPipe?.Dispose();
            _commandRecognizer?.Dispose();
            _synthesizer?.Dispose();
            
            GC.SuppressFinalize(this);
        }
    }
}
