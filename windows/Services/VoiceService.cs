using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StudyHelperVoiceAssistant.Models;
using System;
using System.Globalization;
using System.Speech.Recognition;
using System.Speech.Synthesis;
using System.Threading;
using System.Threading.Tasks;
using NAudio.Wave;
using System.Collections.Generic;
using System.Linq;

namespace StudyHelperVoiceAssistant.Services
{    public class VoiceService : IVoiceService
    {
        private readonly AppConfig _config;
        private readonly StudyHelperApiService _apiService;
        private readonly AudioDeviceService _audioDeviceService;
        private readonly ILogger<VoiceService> _logger;
        
        private SpeechRecognitionEngine? _recognizer;
        private SpeechSynthesizer? _synthesizer;
        private WaveInEvent? _waveIn;        private bool _isListening;
        private bool _isProcessing;
        private bool _wakeWordDetected;
        private string _currentTranscript = "";
        private CancellationTokenSource? _cancellationTokenSource;
        private string? _selectedMicrophoneId;public event EventHandler<string>? CommandReceived;
        public event EventHandler<string>? ResponseReceived;
        public event EventHandler<string>? StatusChanged;
        public event EventHandler<double>? MicrophoneLevelChanged;
        public event EventHandler<string>? TranscriptUpdated;
        public event EventHandler<string>? WakeWordDetected;        public bool IsListening => _isListening;
        public bool IsProcessing => _isProcessing;
        public string CurrentTranscript => _currentTranscript;

        public VoiceService(IOptions<AppConfig> config, StudyHelperApiService apiService, 
                           AudioDeviceService audioDeviceService, ILogger<VoiceService> logger)
        {
            _config = config.Value;
            _apiService = apiService;
            _audioDeviceService = audioDeviceService;
            _logger = logger;
            
            _selectedMicrophoneId = _config.VoiceSettings.MicrophoneDeviceId;
            
            InitializeSpeechRecognition();
            InitializeSpeechSynthesis();
        }        private void InitializeSpeechRecognition()
        {
            try
            {
                _recognizer?.Dispose(); // Dispose existing recognizer
                
                // Use the system's default culture if available
                var culture = CultureInfo.GetCultureInfo(_config.VoiceSettings.Language);
                _recognizer = new SpeechRecognitionEngine(culture);
                
                // Create simplified grammar focused on dictation
                // Remove complex grammar that might interfere with accuracy
                var dictationGrammar = new DictationGrammar();
                dictationGrammar.Name = "Dictation";
                dictationGrammar.Enabled = true;
                _recognizer.LoadGrammar(dictationGrammar);

                // Create a simple wake word grammar
                var wakeWordChoices = new Choices();
                wakeWordChoices.Add(_config.VoiceSettings.ActivationKeyword);
                wakeWordChoices.Add("hey study helper");
                wakeWordChoices.Add("study helper");
                wakeWordChoices.Add("hello computer");
                wakeWordChoices.Add("computer");
                
                var wakeWordBuilder = new GrammarBuilder();
                wakeWordBuilder.Append(wakeWordChoices);
                wakeWordBuilder.AppendWildcard(); // Allow anything after wake word
                
                var wakeWordGrammar = new Grammar(wakeWordBuilder);
                wakeWordGrammar.Name = "WakeWords";
                wakeWordGrammar.Priority = 127; // High priority
                _recognizer.LoadGrammar(wakeWordGrammar);

                // Optimize recognition settings for better accuracy
                _recognizer.UpdateRecognizerSetting("CFGConfidenceRejectionThreshold", 25); // Lower threshold for better sensitivity
                _recognizer.UpdateRecognizerSetting("HighConfidenceThreshold", 85);
                _recognizer.UpdateRecognizerSetting("NormalConfidenceThreshold", 60);
                _recognizer.UpdateRecognizerSetting("LowConfidenceThreshold", 40);
                
                // Enable adaptation for better accuracy over time
                _recognizer.UpdateRecognizerSetting("AdaptationOn", 1);
                
                // Optimize timeouts for natural speech
                _recognizer.InitialSilenceTimeout = TimeSpan.FromSeconds(10);
                _recognizer.BabbleTimeout = TimeSpan.FromSeconds(8);
                _recognizer.EndSilenceTimeout = TimeSpan.FromSeconds(2);
                _recognizer.EndSilenceTimeoutAmbiguous = TimeSpan.FromSeconds(1.5);

                // Event handlers
                _recognizer.SpeechRecognized += OnSpeechRecognized;
                _recognizer.SpeechHypothesized += OnSpeechHypothesized;
                _recognizer.SpeechRecognitionRejected += OnSpeechRejected;
                _recognizer.RecognizerUpdateReached += OnRecognizerUpdateReached;                _recognizer.AudioLevelUpdated += OnAudioLevelUpdated;

                // Set input to default audio device
                _recognizer.SetInputToDefaultAudioDevice();
                
                _logger.LogInformation($"Speech recognition initialized with culture: {culture.Name}");
                _logger.LogInformation($"Available recognizers: {SpeechRecognitionEngine.InstalledRecognizers().Count}");
                
                // Log available recognizers for debugging
                foreach (var recognizer in SpeechRecognitionEngine.InstalledRecognizers())
                {
                    _logger.LogInformation($"Available recognizer: {recognizer.Id} - {recognizer.Description} ({recognizer.Culture.Name})");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize speech recognition");
            }
        }

        private void OnAudioLevelUpdated(object? sender, AudioLevelUpdatedEventArgs e)
        {
            // Report audio level for debugging
            _logger.LogTrace($"Audio level: {e.AudioLevel}");
            MicrophoneLevelChanged?.Invoke(this, e.AudioLevel);
        }

        private void InitializeSpeechSynthesis()
        {
            try
            {
                _synthesizer = new SpeechSynthesizer();
                _synthesizer.SetOutputToDefaultAudioDevice();
                _synthesizer.Rate = (int)(_config.VoiceSettings.SpeechRate * 2) - 2; // Convert to range -2 to 2
                _synthesizer.Volume = (int)(_config.VoiceSettings.SpeechVolume * 100);

                _logger.LogInformation("Speech synthesis initialized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize speech synthesis");
            }
        }        public async Task StartListeningAsync()
        {
            if (_recognizer == null || _isListening)
                return;

            try
            {
                _cancellationTokenSource = new CancellationTokenSource();
                _isListening = true;
                _wakeWordDetected = false; // Reset wake word detection
                _currentTranscript = ""; // Reset transcript
                
                // Enable better audio input handling
                _recognizer.InitialSilenceTimeout = TimeSpan.FromSeconds(15);
                _recognizer.BabbleTimeout = TimeSpan.FromSeconds(10);
                _recognizer.EndSilenceTimeout = TimeSpan.FromSeconds(3);
                _recognizer.EndSilenceTimeoutAmbiguous = TimeSpan.FromSeconds(3);
                
                // Use multiple recognition instead of single
                _recognizer.RecognizeAsync(RecognizeMode.Multiple);
                
                StatusChanged?.Invoke(this, "Listening for wake word...");
                _logger.LogInformation("Voice recognition started");

                if (_config.VoiceSettings.AutoSpeak)
                {
                    await SpeakAsync("Voice assistant is ready. Say your wake word followed by a command.");
                }
                
                // Start microphone monitoring
                if (!string.IsNullOrEmpty(_selectedMicrophoneId))
                {
                    await StartMicrophoneMonitoringAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting voice recognition");
                _isListening = false;
                StatusChanged?.Invoke(this, $"Error: {ex.Message}");
            }
        }        public void StopListening()
        {
            if (_recognizer == null || !_isListening)
                return;

            try
            {
                _isListening = false;
                _wakeWordDetected = false; // Reset wake word detection
                _currentTranscript = ""; // Reset transcript
                _cancellationTokenSource?.Cancel();
                _recognizer.RecognizeAsyncStop();
                
                StatusChanged?.Invoke(this, "Voice recognition stopped");
                TranscriptUpdated?.Invoke(this, ""); // Clear transcript display
                _logger.LogInformation("Voice recognition stopped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping voice recognition");
            }
        }        private async void OnSpeechRecognized(object? sender, SpeechRecognizedEventArgs e)
        {
            if (_isProcessing)
                return;

            try
            {
                var recognizedText = e.Result.Text.Trim();
                var recognizedTextLower = recognizedText.ToLower();
                _currentTranscript = recognizedText; // Store with original casing
                
                _logger.LogInformation($"Speech recognized: '{recognizedText}' (Confidence: {e.Result.Confidence:F2}, Grammar: {e.Result.Grammar.Name})");

                // Update final transcript
                TranscriptUpdated?.Invoke(this, _currentTranscript);

                // Reject low confidence results unless they contain clear wake words
                if (e.Result.Confidence < _config.VoiceSettings.ConfidenceThreshold)
                {
                    var hasWakeWord = ContainsWakeWord(recognizedTextLower);
                    if (!hasWakeWord || e.Result.Confidence < 0.3) // Very low confidence threshold for wake words
                    {
                        _logger.LogDebug($"Speech rejected due to low confidence: {e.Result.Confidence:F2} < {_config.VoiceSettings.ConfidenceThreshold:F2}");
                        return;
                    }
                }

                // Check if it contains the wake word or is a direct command
                bool isWakeWordCommand = ContainsWakeWord(recognizedTextLower);
                
                // Handle direct commands without wake word if confidence is very high and contains command keywords
                bool isDirectCommand = e.Result.Confidence > 0.8 && ContainsCommandKeywords(recognizedTextLower);
                
                // Only process if wake word was detected or it's a high-confidence direct command
                if (isWakeWordCommand || isDirectCommand || _wakeWordDetected)
                {
                    _isProcessing = true;
                    
                    if (isWakeWordCommand && !_wakeWordDetected)
                    {
                        _wakeWordDetected = true;
                        WakeWordDetected?.Invoke(this, ExtractWakeWord(recognizedTextLower));
                    }
                    
                    CommandReceived?.Invoke(this, recognizedText);
                    
                    string command = ExtractCommand(recognizedText, recognizedTextLower);
                    
                    // Handle special commands locally
                    if (IsStopCommand(command))
                    {
                        await SpeakAsync("Voice recognition stopped.");
                        StopListening();
                        return;
                    }
                    
                    if (IsTestCommand(command))
                    {
                        await SpeakAsync("Microphone test successful. I can hear you clearly.");
                        _wakeWordDetected = false; // Reset for next command
                        _isProcessing = false;
                        return;
                    }
                    
                    if (string.IsNullOrEmpty(command) || command.Length < 3)
                    {
                        await SpeakAsync("Yes, I'm listening. How can I help you?");
                        _wakeWordDetected = false; // Reset for next command
                        _isProcessing = false;
                        return;
                    }

                    StatusChanged?.Invoke(this, "Processing command...");
                    
                    // Start processing immediately without delay
                    var processingTask = _apiService.ProcessVoiceCommandAsync(command, "", e.Result.Confidence);
                    
                    // Provide immediate feedback
                    await SpeakAsync("Processing your request...");
                    
                    // Wait for the API response
                    var response = await processingTask;
                    
                    _logger.LogInformation($"Received API response: {(response?.Length > 100 ? response.Substring(0, 100) + "..." : response ?? "null")}");
                    
                    if (!string.IsNullOrEmpty(response))
                    {
                        ResponseReceived?.Invoke(this, response);
                        
                        if (_config.VoiceSettings.AutoSpeak)
                        {
                            await SpeakAsync(response);
                        }
                    }
                    else
                    {
                        var fallbackResponse = "I couldn't process that command. Please try again.";
                        ResponseReceived?.Invoke(this, fallbackResponse);
                        
                        if (_config.VoiceSettings.AutoSpeak)
                        {
                            await SpeakAsync(fallbackResponse);
                        }
                    }
                    
                    StatusChanged?.Invoke(this, "Ready for commands");
                    
                    // Reset wake word detection for next command
                    _wakeWordDetected = false;
                }
                else
                {
                    _logger.LogDebug($"Speech ignored (no wake word detected): '{recognizedText}'");
                    StatusChanged?.Invoke(this, "Waiting for wake word...");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing speech recognition");
                StatusChanged?.Invoke(this, "Error processing command");
                
                if (_config.VoiceSettings.AutoSpeak)
                {
                    await SpeakAsync("Sorry, I had trouble processing that command. Please try again.");
                }
            }
            finally
            {
                _isProcessing = false;
            }
        }

        private bool ContainsWakeWord(string text)
        {
            var wakeWords = new[]
            {
                _config.VoiceSettings.ActivationKeyword.ToLower(),
                "hey study helper",
                "study helper", 
                "hello computer",
                "computer"
            };
            
            return wakeWords.Any(wake => text.Contains(wake));
        }
        
        private bool ContainsCommandKeywords(string text)
        {
            var commandKeywords = new[]
            {
                "help", "create", "study", "schedule", "timer", "break", 
                "focus", "stop listening", "test microphone", "show", "start"
            };
            
            return commandKeywords.Any(keyword => text.Contains(keyword));
        }
        
        private string ExtractWakeWord(string text)
        {
            var wakeWords = new[]
            {
                _config.VoiceSettings.ActivationKeyword.ToLower(),
                "hey study helper",
                "study helper",
                "hello computer", 
                "computer"
            };
            
            return wakeWords.FirstOrDefault(wake => text.Contains(wake)) ?? "wake word";
        }
        
        private string ExtractCommand(string originalText, string lowerText)
        {
            var wakeWords = new[]
            {
                _config.VoiceSettings.ActivationKeyword.ToLower(),
                "hey study helper",
                "study helper",
                "hello computer",
                "computer"
            };
            
            foreach (var wakeWord in wakeWords)
            {
                var index = lowerText.IndexOf(wakeWord);
                if (index >= 0)
                {
                    var commandStart = index + wakeWord.Length;
                    if (commandStart < originalText.Length)
                    {
                        return originalText.Substring(commandStart).Trim();
                    }
                }
            }
            
            return originalText; // Return original if no wake word found
        }
        
        private bool IsStopCommand(string command)
        {
            var stopPhrases = new[] { "stop listening", "stop", "quit", "exit", "goodbye" };
            return stopPhrases.Any(phrase => command.ToLower().Contains(phrase));
        }
        
        private bool IsTestCommand(string command)
        {
            var testPhrases = new[] { "test microphone", "test mic", "microphone test", "mic test" };
            return testPhrases.Any(phrase => command.ToLower().Contains(phrase));
        }        private void OnSpeechHypothesized(object? sender, SpeechHypothesizedEventArgs e)
        {
            // This is called during recognition process - provides real-time transcript
            var hypothesizedText = e.Result.Text.Trim();
            var hypothesizedTextLower = hypothesizedText.ToLower();
            _currentTranscript = hypothesizedText; // Store original casing for display
            
            _logger.LogTrace($"Speech hypothesis: {hypothesizedText} (Confidence: {e.Result.Confidence:F2})");
            
            // Only update transcript if confidence is reasonable to avoid flickering
            if (e.Result.Confidence > 0.2)
            {
                TranscriptUpdated?.Invoke(this, _currentTranscript);
            }
            
            // Check for wake word in hypothesis with higher confidence requirement
            bool containsWakeWord = ContainsWakeWord(hypothesizedTextLower);
            
            if (containsWakeWord && !_wakeWordDetected && e.Result.Confidence > 0.5)
            {
                _wakeWordDetected = true;
                _logger.LogInformation($"Wake word detected in hypothesis: {hypothesizedText}");
                WakeWordDetected?.Invoke(this, ExtractWakeWord(hypothesizedTextLower));
            }
        }

        private void OnSpeechRejected(object? sender, SpeechRecognitionRejectedEventArgs e)
        {
            _logger.LogDebug($"Speech rejected: {e.Result.Text} (Confidence: {e.Result.Confidence:F2})");
        }

        private void OnRecognizerUpdateReached(object? sender, RecognizerUpdateReachedEventArgs e)
        {
            _logger.LogDebug("Speech recognizer update reached");
        }

        public async Task SpeakAsync(string text)
        {
            if (_synthesizer == null || !_config.VoiceSettings.AutoSpeak || string.IsNullOrEmpty(text))
                return;

            try
            {
                await Task.Run(() =>
                {
                    _synthesizer.Speak(text);
                });
                
                _logger.LogInformation($"Spoke: {text}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error speaking text");
            }
        }

        public List<MicrophoneInfo> GetAvailableMicrophones()
        {
            return _audioDeviceService.GetAvailableMicrophones();
        }

        public bool SetMicrophone(string deviceId)
        {
            try
            {
                if (_selectedMicrophoneId == deviceId)
                    return true;

                _selectedMicrophoneId = deviceId;
                _config.VoiceSettings.MicrophoneDeviceId = deviceId;

                // Reinitialize speech recognition with new microphone
                bool wasListening = _isListening;
                if (wasListening)
                {
                    StopListening();
                }

                InitializeSpeechRecognition();

                if (wasListening)
                {
                    _ = StartListeningAsync();
                }

                _logger.LogInformation($"Microphone changed to device: {deviceId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to set microphone: {deviceId}");
                return false;
            }
        }        public Task StartMicrophoneMonitoringAsync()
        {
            if (string.IsNullOrEmpty(_selectedMicrophoneId))
                return Task.CompletedTask;

            try
            {
                var timer = new System.Timers.Timer(100); // Update every 100ms
                timer.Elapsed += async (s, e) =>
                {
                    try
                    {
                        var level = await _audioDeviceService.GetMicrophoneLevel(_selectedMicrophoneId);
                        MicrophoneLevelChanged?.Invoke(this, level);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Error monitoring microphone level");
                    }
                };
                timer.Start();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start microphone monitoring");
            }            return Task.CompletedTask;
        }

        public async Task CalibrateMicrophoneAsync()
        {
            try
            {
                StatusChanged?.Invoke(this, "Calibrating microphone... Please speak normally for 5 seconds.");
                
                if (_config.VoiceSettings.AutoSpeak)
                {
                    await SpeakAsync("Please speak normally for 5 seconds to calibrate your microphone.");
                }

                await Task.Delay(5000);
                
                StatusChanged?.Invoke(this, "Microphone calibration complete.");
                
                if (_config.VoiceSettings.AutoSpeak)
                {
                    await SpeakAsync("Microphone calibration complete. You can now use voice commands.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during microphone calibration");
            }
        }public void Dispose()
        {
            StopListening();
            _cancellationTokenSource?.Dispose();
            _recognizer?.Dispose();
            _synthesizer?.Dispose();
            _waveIn?.Dispose();
        }
    }
}
