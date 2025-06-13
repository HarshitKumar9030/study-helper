using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using StudyHelperVoiceAssistant.Models;
using System;
using System.IO;
using System.Threading.Tasks;

namespace StudyHelperVoiceAssistant.Services
{
    public class ConfigurationService
    {
        private readonly ILogger<ConfigurationService> _logger;
        private readonly string _configFilePath;
        private AppConfig _config;

        public event EventHandler<AppConfig>? ConfigurationChanged;

        public ConfigurationService(IOptions<AppConfig> config, ILogger<ConfigurationService> logger)
        {
            _logger = logger;
            _config = config.Value;
            
            // Store config in AppData for user-specific settings
            var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var appFolder = Path.Combine(appDataPath, "StudyHelperVoiceAssistant");
            Directory.CreateDirectory(appFolder);
            _configFilePath = Path.Combine(appFolder, "config.json");
            
            LoadUserConfiguration();
        }

        public AppConfig GetConfiguration() => _config;

        public async Task SaveConfigurationAsync(AppConfig config)
        {
            try
            {
                _config = config;
                
                var json = JsonConvert.SerializeObject(_config, Formatting.Indented);
                await File.WriteAllTextAsync(_configFilePath, json);
                
                ConfigurationChanged?.Invoke(this, _config);
                _logger.LogInformation("Configuration saved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving configuration");
                throw;
            }
        }

        public void SaveConfiguration(AppConfig config)
        {
            try
            {
                _config = config;
                
                var json = JsonConvert.SerializeObject(_config, Formatting.Indented);
                File.WriteAllText(_configFilePath, json);
                
                ConfigurationChanged?.Invoke(this, _config);
                _logger.LogInformation("Configuration saved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving configuration");
                throw;
            }
        }

        public async Task SaveApiKeyAsync(string apiKey)
        {
            try
            {
                _config.StudyHelper.ApiKey = apiKey;
                await SaveConfigurationAsync(_config);
                _logger.LogInformation("API key saved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving API key");
                throw;
            }
        }

        private void LoadUserConfiguration()
        {
            try
            {
                if (File.Exists(_configFilePath))
                {
                    var json = File.ReadAllText(_configFilePath);
                    var userConfig = JsonConvert.DeserializeObject<AppConfig>(json);
                    
                    if (userConfig != null)
                    {
                        // Merge with default configuration
                        MergeConfigurations(userConfig);
                        _logger.LogInformation("User configuration loaded successfully");
                    }
                }
                else
                {
                    // Create default configuration file
                    var json = JsonConvert.SerializeObject(_config, Formatting.Indented);
                    File.WriteAllText(_configFilePath, json);
                    _logger.LogInformation("Default configuration file created");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading user configuration");
            }
        }

        private void MergeConfigurations(AppConfig userConfig)
        {
            // Update API settings
            if (!string.IsNullOrEmpty(userConfig.StudyHelper.ApiKey))
                _config.StudyHelper.ApiKey = userConfig.StudyHelper.ApiKey;
            
            if (!string.IsNullOrEmpty(userConfig.StudyHelper.BaseUrl))
                _config.StudyHelper.BaseUrl = userConfig.StudyHelper.BaseUrl;
            
            _config.StudyHelper.Timeout = userConfig.StudyHelper.Timeout;
            _config.StudyHelper.RetryAttempts = userConfig.StudyHelper.RetryAttempts;
            _config.StudyHelper.RetryDelay = userConfig.StudyHelper.RetryDelay;            // Update voice settings
            _config.VoiceSettings.SpeechRate = userConfig.VoiceSettings.SpeechRate;
            _config.VoiceSettings.SpeechVolume = userConfig.VoiceSettings.SpeechVolume;
            _config.VoiceSettings.Language = userConfig.VoiceSettings.Language;
            _config.VoiceSettings.ConfidenceThreshold = userConfig.VoiceSettings.ConfidenceThreshold;
            _config.VoiceSettings.ActivationKeyword = userConfig.VoiceSettings.ActivationKeyword;
            _config.VoiceSettings.AutoSpeak = userConfig.VoiceSettings.AutoSpeak;
            _config.VoiceSettings.ContinuousListening = userConfig.VoiceSettings.ContinuousListening;
            _config.VoiceSettings.Hotkey = userConfig.VoiceSettings.Hotkey;
            _config.VoiceSettings.MicrophoneDeviceId = userConfig.VoiceSettings.MicrophoneDeviceId;
            _config.VoiceSettings.SpeakerDeviceId = userConfig.VoiceSettings.SpeakerDeviceId;
            _config.VoiceSettings.MicrophoneGain = userConfig.VoiceSettings.MicrophoneGain;
            _config.VoiceSettings.NoiseReduction = userConfig.VoiceSettings.NoiseReduction;
            _config.VoiceSettings.ListenTimeout = userConfig.VoiceSettings.ListenTimeout;

            // Update system settings
            _config.SystemSettings.StartWithWindows = userConfig.SystemSettings.StartWithWindows;
            _config.SystemSettings.MinimizeToTray = userConfig.SystemSettings.MinimizeToTray;
            _config.SystemSettings.ShowNotifications = userConfig.SystemSettings.ShowNotifications;
            _config.SystemSettings.LogLevel = userConfig.SystemSettings.LogLevel;
        }

        public string GetConfigurationFilePath() => _configFilePath;

        public bool IsApiKeyConfigured() => !string.IsNullOrEmpty(_config.StudyHelper.ApiKey);
    }
}
