using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StudyHelperVoiceAssistant.Models;
using StudyHelperVoiceAssistant.Services;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;

namespace StudyHelperVoiceAssistant.Views
{
    public partial class MainWindow : Window
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IVoiceService _voiceService;
        private readonly StudyHelperApiService _apiService;
        private readonly ConfigurationService _configService;
        private readonly AudioDeviceService _audioDeviceService;
        private readonly ILogger<MainWindow> _logger;
        private readonly DispatcherTimer _statusTimer;
        private readonly ObservableCollection<CommandHistoryItem> _commandHistory;
        private bool _isApiKeyVisible = false;
        private UserInfo? _currentUser = null;

        public MainWindow(IServiceProvider serviceProvider)
        {
            InitializeComponent();

            _serviceProvider = serviceProvider;
            _voiceService = serviceProvider.GetRequiredService<IVoiceService>();
            _apiService = serviceProvider.GetRequiredService<StudyHelperApiService>();
            _configService = serviceProvider.GetRequiredService<ConfigurationService>();
            _audioDeviceService = serviceProvider.GetRequiredService<AudioDeviceService>();
            _logger = serviceProvider.GetRequiredService<ILogger<MainWindow>>();

            _commandHistory = new ObservableCollection<CommandHistoryItem>();
            CommandHistoryList.ItemsSource = _commandHistory;

            _statusTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(5) // Reduced frequency
            };
            _statusTimer.Tick += StatusTimer_Tick;
            _statusTimer.Start();            InitializeEventHandlers();
            LoadConfiguration();
            LoadMicrophones();
        }        private void InitializeEventHandlers()
        {
            _voiceService.CommandReceived += VoiceService_CommandReceived;
            _voiceService.ResponseReceived += VoiceService_ResponseReceived;
            _voiceService.StatusChanged += VoiceService_StatusChanged;
            _voiceService.MicrophoneLevelChanged += VoiceService_MicrophoneLevelChanged;
            _voiceService.TranscriptUpdated += VoiceService_TranscriptUpdated;
            _voiceService.WakeWordDetected += VoiceService_WakeWordDetected;
            _configService.ConfigurationChanged += ConfigService_ConfigurationChanged;
        }

        private void LoadConfiguration()
        {
            var config = _configService.GetConfiguration();

            // Load API settings
            ApiKeyBox.Password = config.StudyHelper.ApiKey;
            BaseUrlBox.Text = config.StudyHelper.BaseUrl;
            TimeoutBox.Text = config.StudyHelper.Timeout.ToString();

            // Load voice settings
            SpeechRateSlider.Value = config.VoiceSettings.SpeechRate;
            SpeechVolumeSlider.Value = config.VoiceSettings.SpeechVolume;
            ActivationKeywordBox.Text = config.VoiceSettings.ActivationKeyword;
            ConfidenceThresholdSlider.Value = config.VoiceSettings.ConfidenceThreshold;
            AutoSpeakCheckBox.IsChecked = config.VoiceSettings.AutoSpeak;
            ContinuousListeningCheckBox.IsChecked = config.VoiceSettings.ContinuousListening;

            // Load system settings
            StartWithWindowsCheckBox.IsChecked = config.SystemSettings.StartWithWindows;
            StartMinimizedCheckBox.IsChecked = config.SystemSettings.StartMinimized;
            MinimizeToTrayCheckBox.IsChecked = config.SystemSettings.MinimizeToTray;
            ShowNotificationsCheckBox.IsChecked = config.SystemSettings.ShowNotifications;
            // Set language
            foreach (ComboBoxItem item in LanguageComboBox.Items)
            {
                if (item.Tag.ToString() == config.VoiceSettings.Language)
                {
                    LanguageComboBox.SelectedItem = item;
                    break;
                }
            }            // Load microphones
            LoadMicrophones();
            
            // Automatically test API connection if API key is configured
            Task.Run(async () => await AutoConnectApiAsync());
        }

        private void LoadMicrophones()
        {
            try
            {
                MicrophoneComboBox.Items.Clear();
                
                var microphones = _audioDeviceService.GetAvailableMicrophones();
                _logger.LogInformation($"Found {microphones.Count} microphone devices");
                
                foreach (var mic in microphones)
                {
                    var item = new ComboBoxItem
                    {
                        Content = $"{mic.Name} {(mic.IsDefault ? "(Default)" : "")}",
                        Tag = mic.DeviceId
                    };
                    MicrophoneComboBox.Items.Add(item);
                      // Select the configured microphone or default
                    var config = _configService.GetConfiguration();
                    if ((!string.IsNullOrEmpty(config.VoiceSettings.MicrophoneDeviceId) && 
                         mic.DeviceId == config.VoiceSettings.MicrophoneDeviceId) ||
                        (string.IsNullOrEmpty(config.VoiceSettings.MicrophoneDeviceId) && mic.IsDefault))
                    {
                        MicrophoneComboBox.SelectedItem = item;
                    }
                }
                
                if (MicrophoneComboBox.SelectedItem == null && MicrophoneComboBox.Items.Count > 0)
                {
                    MicrophoneComboBox.SelectedIndex = 0;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading microphones");
            }
        }

        private async void StartButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (!_configService.IsApiKeyConfigured())
                {
                    MessageBox.Show("Please configure your API key first.", "Configuration Required",
                                  MessageBoxButton.OK, MessageBoxImage.Warning);
                    return;
                }

                // Automatically test API connection before starting voice service
                StartButton.IsEnabled = false;
                StartButton.Content = "Connecting...";

                var isApiConnected = await _apiService.ValidateApiKeyAsync();
                UpdateApiStatus(isApiConnected);

                if (!isApiConnected)
                {
                    MessageBox.Show("API connection failed. Please check your API key and connection.", "Connection Error",
                                  MessageBoxButton.OK, MessageBoxImage.Error);
                    StartButton.IsEnabled = true;
                    StartButton.Content = "Start Listening";
                    return;
                }

                // Load user profile if not already loaded
                if (_currentUser == null)
                {
                    await LoadUserProfileAsync();
                }

                // Start voice service
                StartButton.Content = "Starting...";
                StopButton.IsEnabled = true;

                await _voiceService.StartListeningAsync();
                UpdateVoiceStatus(true);
                
                StartButton.Content = "Start Listening";
                StartButton.Visibility = Visibility.Collapsed;
                StopButton.Visibility = Visibility.Visible;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error starting voice service: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);

                StartButton.IsEnabled = true;
                StartButton.Content = "Start Listening";
                StopButton.IsEnabled = false;
            }
        }        private void StopButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                _voiceService.StopListening();
                UpdateVoiceStatus(false);

                StartButton.IsEnabled = true;
                StartButton.Visibility = Visibility.Visible;
                StopButton.IsEnabled = false;
                StopButton.Visibility = Visibility.Collapsed;

                _logger.LogInformation("Voice listening stopped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping voice service");
                MessageBox.Show($"Error stopping voice service: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }private async void TestButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                TestButton.IsEnabled = false;
                TestButton.Content = "Testing...";

                var isValid = await _apiService.ValidateApiKeyAsync();
                UpdateApiStatus(isValid);

                if (isValid)
                {
                    // Load user profile information
                    await LoadUserProfileAsync();
                    
                    MessageBox.Show("API connection successful!", "Success",
                                  MessageBoxButton.OK, MessageBoxImage.Information);
                }
                else
                {
                    UpdateUserProfile(null);
                    MessageBox.Show("API connection failed. Please check your API key and URL.", "Connection Failed",
                                  MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing API connection");
                UpdateApiStatus(false);
                UpdateUserProfile(null);
                MessageBox.Show($"Error testing connection: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                TestButton.IsEnabled = true;
                TestButton.Content = "Test Connection";
            }
        }

        private async void SpeakTestButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var text = TestTextBox.Text;
                if (!string.IsNullOrEmpty(text))
                {
                    await _voiceService.SpeakAsync(text);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing speech");
                MessageBox.Show($"Error testing speech: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
        private void ShowApiKeyButton_Click(object sender, RoutedEventArgs e)
        {
            _isApiKeyVisible = !_isApiKeyVisible;

            if (_isApiKeyVisible)
            {
                // Show API key as text
                var password = ApiKeyBox.Password;
                var parent = (Grid)ApiKeyBox.Parent;

                // Create a TextBox to show the password
                var textBox = new TextBox
                {
                    Name = "ApiKeyTextBox",
                    Text = password,
                    Style = (Style)FindResource("ModernTextBox"),
                    Margin = new Thickness(0, 0, 8, 0)
                };

                Grid.SetColumn(textBox, 0);

                // Hide password box and show text box
                ApiKeyBox.Visibility = Visibility.Collapsed;
                parent.Children.Add(textBox);

                ShowApiKeyButton.Content = "🔒";
            }
            else
            {
                // Hide API key and show password box
                var parent = (Grid)ApiKeyBox.Parent;
                var textBox = parent.Children.OfType<TextBox>().FirstOrDefault(t => t.Name == "ApiKeyTextBox");

                if (textBox != null)
                {
                    ApiKeyBox.Password = textBox.Text;
                    parent.Children.Remove(textBox);
                }

                ApiKeyBox.Visibility = Visibility.Visible;
                ShowApiKeyButton.Content = "👁";
            }
        }

        private async void SaveApiSettingsButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var config = _configService.GetConfiguration();

                // Get API key from visible control
                var apiKey = _isApiKeyVisible ?
                    ((Grid)ApiKeyBox.Parent).FindName("ApiKeyTextBox") is TextBox tb ? tb.Text : ApiKeyBox.Password :
                    ApiKeyBox.Password;

                config.StudyHelper.ApiKey = apiKey;
                config.StudyHelper.BaseUrl = BaseUrlBox.Text;
                config.StudyHelper.Timeout = int.TryParse(TimeoutBox.Text, out var timeout) ? timeout : 30;

                await _configService.SaveConfigurationAsync(config);

                MessageBox.Show("API settings saved successfully!", "Success",
                              MessageBoxButton.OK, MessageBoxImage.Information);

                _logger.LogInformation("API settings saved");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving API settings");
                MessageBox.Show($"Error saving API settings: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void SaveAllSettingsButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var config = _configService.GetConfiguration();

                // Update all settings
                var apiKey = _isApiKeyVisible ?
                    ((Grid)ApiKeyBox.Parent).FindName("ApiKeyTextBox") is TextBox tb ? tb.Text : ApiKeyBox.Password :
                    ApiKeyBox.Password;

                config.StudyHelper.ApiKey = apiKey;
                config.StudyHelper.BaseUrl = BaseUrlBox.Text;
                config.StudyHelper.Timeout = int.TryParse(TimeoutBox.Text, out var timeout) ? timeout : 30;

                config.VoiceSettings.SpeechRate = SpeechRateSlider.Value;
                config.VoiceSettings.SpeechVolume = SpeechVolumeSlider.Value;
                config.VoiceSettings.ActivationKeyword = ActivationKeywordBox.Text;
                config.VoiceSettings.ConfidenceThreshold = ConfidenceThresholdSlider.Value;
                config.VoiceSettings.AutoSpeak = AutoSpeakCheckBox.IsChecked ?? true;
                config.VoiceSettings.ContinuousListening = ContinuousListeningCheckBox.IsChecked ?? true;                if (LanguageComboBox.SelectedItem is ComboBoxItem selectedLang)
                {
                    config.VoiceSettings.Language = selectedLang.Tag?.ToString() ?? "en-US";
                }
                
                // Save microphone selection
                if (MicrophoneComboBox.SelectedItem is ComboBoxItem selectedMic)
                {
                    config.VoiceSettings.MicrophoneDeviceId = selectedMic.Tag?.ToString() ?? "";
                }
                config.SystemSettings.StartWithWindows = StartWithWindowsCheckBox.IsChecked ?? true;
                config.SystemSettings.StartMinimized = StartMinimizedCheckBox.IsChecked ?? false;
                config.SystemSettings.MinimizeToTray = MinimizeToTrayCheckBox.IsChecked ?? true;
                config.SystemSettings.ShowNotifications = ShowNotificationsCheckBox.IsChecked ?? true;                await _configService.SaveConfigurationAsync(config);

                MessageBox.Show("All settings saved successfully!", "Success",
                              MessageBoxButton.OK, MessageBoxImage.Information);

                // Automatically test API connection if API key was configured
                if (!string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogInformation("API key configured, testing connection automatically...");
                    Task.Run(async () => await AutoConnectApiAsync());
                }

                _logger.LogInformation("All settings saved");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving settings");
                MessageBox.Show($"Error saving settings: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
        private void TestConnectionButton_Click(object sender, RoutedEventArgs e)
        {
            TestButton_Click(sender, e);
        }

        private void ResetDefaultsButton_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("Are you sure you want to reset all settings to defaults?",
                                       "Confirm Reset", MessageBoxButton.YesNo, MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                var defaultConfig = new AppConfig();
                LoadConfigurationFromObject(defaultConfig);
            }
        }

        private void LoadConfigurationFromObject(AppConfig config)
        {
            // Load API settings (don't reset API key)
            BaseUrlBox.Text = config.StudyHelper.BaseUrl;
            TimeoutBox.Text = config.StudyHelper.Timeout.ToString();

            // Load voice settings
            SpeechRateSlider.Value = config.VoiceSettings.SpeechRate;
            SpeechVolumeSlider.Value = config.VoiceSettings.SpeechVolume;
            ActivationKeywordBox.Text = config.VoiceSettings.ActivationKeyword;
            ConfidenceThresholdSlider.Value = config.VoiceSettings.ConfidenceThreshold;
            AutoSpeakCheckBox.IsChecked = config.VoiceSettings.AutoSpeak;
            ContinuousListeningCheckBox.IsChecked = config.VoiceSettings.ContinuousListening;

            // Load system settings
            StartWithWindowsCheckBox.IsChecked = config.SystemSettings.StartWithWindows;
            StartMinimizedCheckBox.IsChecked = config.SystemSettings.StartMinimized;
            MinimizeToTrayCheckBox.IsChecked = config.SystemSettings.MinimizeToTray;
            ShowNotificationsCheckBox.IsChecked = config.SystemSettings.ShowNotifications;

            // Set language
            foreach (ComboBoxItem item in LanguageComboBox.Items)
            {
                if (item.Tag.ToString() == config.VoiceSettings.Language)
                {
                    LanguageComboBox.SelectedItem = item;
                    break;
                }
            }
        }

        private void OpenStudyHelperButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var url = _configService.GetConfiguration().StudyHelper.BaseUrl;
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error opening Study Helper");
                MessageBox.Show($"Error opening Study Helper: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void ViewLogsButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                                         "StudyHelperVoiceAssistant", "logs");

                if (Directory.Exists(logPath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = logPath,
                        UseShellExecute = true
                    });
                }
                else
                {
                    MessageBox.Show("Log directory not found.", "Info",
                                  MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error opening logs");
                MessageBox.Show($"Error opening logs: {ex.Message}", "Error",
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void CheckUpdatesButton_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Update checking functionality will be implemented in a future version.",
                          "Info", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void VoiceService_CommandReceived(object? sender, string command)
        {
            Dispatcher.Invoke(() =>
            {
                _commandHistory.Insert(0, new CommandHistoryItem
                {
                    Command = command,
                    Response = "Processing...",
                    Timestamp = DateTime.Now.ToString("HH:mm:ss")
                });

                if (_commandHistory.Count > 50)
                {
                    _commandHistory.RemoveAt(_commandHistory.Count - 1);
                }
            });
        }

        private void VoiceService_ResponseReceived(object? sender, string response)
        {
            Dispatcher.Invoke(() =>
            {
                if (_commandHistory.Count > 0)
                {
                    _commandHistory[0].Response = response;
                }
            });
        }        private void VoiceService_StatusChanged(object? sender, string status)
        {
            Dispatcher.Invoke(() =>
            {
                CurrentStatusText.Text = status;
                StatusBarText.Text = status;
            });
        }

        private void VoiceService_TranscriptUpdated(object? sender, string transcript)
        {
            Dispatcher.Invoke(() =>
            {
                // Update the live transcript display
                if (string.IsNullOrEmpty(transcript))
                {
                    LiveTranscriptText.Text = "Say 'study helper' to start...";
                    LiveTranscriptText.Foreground = (SolidColorBrush)FindResource("TextSecondaryBrush");
                }
                else
                {
                    LiveTranscriptText.Text = transcript;
                    LiveTranscriptText.Foreground = (SolidColorBrush)FindResource("TextPrimaryBrush");
                    
                    // Auto-scroll to bottom of transcript
                    TranscriptScrollViewer.ScrollToBottom();
                }
            });
        }

        private void VoiceService_WakeWordDetected(object? sender, string wakeWord)
        {
            Dispatcher.Invoke(() =>
            {
                // Show wake word indicator
                WakeWordText.Text = $"Wake word detected: '{wakeWord}'";
                WakeWordIndicator.Visibility = Visibility.Visible;
                
                // Hide the indicator after 3 seconds
                var hideTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(3) };
                hideTimer.Tick += (s, e) =>
                {
                    WakeWordIndicator.Visibility = Visibility.Collapsed;
                    hideTimer.Stop();
                };
                hideTimer.Start();
            });
        }

        private void ConfigService_ConfigurationChanged(object? sender, AppConfig config)
        {
            Dispatcher.Invoke(() =>
            {
                LoadConfigurationFromObject(config);
            });
        }        private void StatusTimer_Tick(object? sender, EventArgs e)
        {
            StatusBarTime.Text = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            
            // Periodically check API connection (every 30 seconds)
            if (DateTime.Now.Second % 30 == 0 && _configService.IsApiKeyConfigured())
            {
                Task.Run(async () => await CheckApiConnectionAsync());
            }
        }

        private async Task CheckApiConnectionAsync()
        {
            try
            {
                var isValid = await _apiService.ValidateApiKeyAsync();
                
                Dispatcher.Invoke(() => 
                {
                    UpdateApiStatus(isValid);
                    
                    // If connection was lost and now restored, reload user profile
                    if (isValid && _currentUser == null)
                    {
                        Task.Run(async () => await LoadUserProfileAsync());
                    }
                    else if (!isValid)
                    {
                        UpdateUserProfile(null);
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Periodic API connection check failed");
                Dispatcher.Invoke(() => UpdateApiStatus(false));
            }
        }

        private void UpdateApiStatus(bool isConnected)
        {
            ApiStatusIndicator.Fill = isConnected ? Brushes.Green : Brushes.Red;
            ApiStatusText.Text = isConnected ? "Connected" : "Disconnected";
        }

        private void UpdateVoiceStatus(bool isListening)
        {
            VoiceStatusIndicator.Fill = isListening ? Brushes.Green : Brushes.Red;
            VoiceStatusText.Text = isListening ? "Listening" : "Stopped";
        }

        protected override void OnClosed(EventArgs e)
        {
            _statusTimer?.Stop();
            _voiceService?.Dispose();
            base.OnClosed(e);
        }

        private void MicrophoneComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (MicrophoneComboBox.SelectedItem is ComboBoxItem selectedItem)
            {
                var deviceId = selectedItem.Tag?.ToString() ?? "";
                _logger.LogInformation($"Microphone selected: {deviceId}");
                // The setting will be saved when Save All Settings is clicked
            }
        }

        private void RefreshMicsButton_Click(object sender, RoutedEventArgs e)
        {
            LoadMicrophones();
        }

        private async void TestMicButton_Click(object sender, RoutedEventArgs e)
        {
            if (MicrophoneComboBox.SelectedItem is ComboBoxItem selectedItem)
            {
                var deviceId = selectedItem.Tag?.ToString() ?? "";
                _logger.LogInformation($"Testing microphone: {deviceId}");
                
                try
                {
                    // Test microphone for 3 seconds
                    bool hasAudio = _audioDeviceService.TestMicrophone(deviceId, TimeSpan.FromSeconds(3));
                    
                    if (hasAudio)
                    {
                        MessageBox.Show("Microphone test successful! Audio detected.", "Test Result", 
                                      MessageBoxButton.OK, MessageBoxImage.Information);
                    }
                    else
                    {
                        MessageBox.Show("No audio detected. Please check your microphone and speak during the test.", 
                                      "Test Result", MessageBoxButton.OK, MessageBoxImage.Warning);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error testing microphone");
                    MessageBox.Show($"Error testing microphone: {ex.Message}", "Error", 
                                  MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }

        private void VoiceService_MicrophoneLevelChanged(object? sender, double level)
        {
            try
            {
                // Update UI on the main thread
                Dispatcher.Invoke(() =>
                {
                    if (MicLevelProgressBar != null)
                    {
                        MicLevelProgressBar.Value = Math.Min(level, 100);
                    }
                    if (MicLevelText != null)
                    {
                        MicLevelText.Text = $"{level:F1}%";
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating microphone level display");
            }
        }

        private async Task LoadUserProfileAsync()
        {
            try
            {
                var userInfo = await _apiService.GetUserInfoAsync();
                UpdateUserProfile(userInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading user profile");
            }
        }

        private void UpdateUserProfile(UserInfo? user)
        {
            try
            {
                _currentUser = user;
                
                if (user != null)
                {
                    // Update UI elements - these will work once XAML is rebuilt
                    Dispatcher.Invoke(() =>
                    {
                        try
                        {
                            if (UserNameText != null) UserNameText.Text = user.Name;
                            if (UserEmailText != null) UserEmailText.Text = user.Email;
                            if (UserProfileSection != null) UserProfileSection.Visibility = Visibility.Visible;
                            
                            // Load avatar if available
                            if (!string.IsNullOrEmpty(user.AvatarUrl))
                            {
                                LoadUserAvatar(user.AvatarUrl);
                            }
                            else
                            {
                                // Show default avatar with user initials
                                ShowDefaultAvatar(user.Name);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogDebug(ex, "Some UI elements not ready yet");
                        }
                    });
                }
                else
                {
                    Dispatcher.Invoke(() =>
                    {
                        try
                        {
                            if (UserProfileSection != null) UserProfileSection.Visibility = Visibility.Collapsed;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogDebug(ex, "UI elements not ready yet");
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile display");
            }
        }

        private async void LoadUserAvatar(string avatarUrl)
        {
            try
            {
                await Task.Run(() =>
                {
                    Dispatcher.Invoke(() =>
                    {
                        try
                        {
                            var bitmap = new System.Windows.Media.Imaging.BitmapImage();
                            bitmap.BeginInit();
                            bitmap.UriSource = new Uri(avatarUrl);
                            bitmap.CacheOption = System.Windows.Media.Imaging.BitmapCacheOption.OnLoad;
                            bitmap.EndInit();
                            bitmap.Freeze();
                            
                            if (UserAvatarImage != null)
                                UserAvatarImage.Source = bitmap;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to load avatar image");
                            ShowDefaultAvatar(_currentUser?.Name ?? "User");
                        }
                    });
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load user avatar, using default");
                ShowDefaultAvatar(_currentUser?.Name ?? "User");
            }
        }

        private void ShowDefaultAvatar(string userName)
        {
            try
            {
                Dispatcher.Invoke(() =>
                {
                    try
                    {
                        // Create a simple default avatar with user initials
                        if (UserAvatarImage != null)
                        {
                            UserAvatarImage.Source = null;
                        }
                        
                        // You could create a TextBlock with initials here if needed
                        // For simplicity, we'll just use the colored background
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "UI element not ready for default avatar");
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error creating default avatar");
            }
        }

        private string GetUserInitials(string name)
        {
            if (string.IsNullOrEmpty(name))
                return "U";
                
            var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
                return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpper();
            else
                return $"{parts[0][0]}{parts[parts.Length - 1][0]}".ToUpper();
        }

        private async Task AutoConnectApiAsync()
        {
            try
            {
                if (!_configService.IsApiKeyConfigured())
                {
                    _logger.LogInformation("No API key configured, skipping auto-connect");
                    return;
                }

                _logger.LogInformation("Attempting automatic API connection...");
                
                var isValid = await _apiService.ValidateApiKeyAsync();
                
                // Update UI on main thread
                Dispatcher.Invoke(() =>
                {
                    UpdateApiStatus(isValid);
                    
                    if (isValid)
                    {
                        _logger.LogInformation("Automatic API connection successful");
                        // Load user profile
                        Task.Run(async () => await LoadUserProfileAsync());
                    }
                    else
                    {
                        _logger.LogWarning("Automatic API connection failed");
                        UpdateUserProfile(null);
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during automatic API connection");
                Dispatcher.Invoke(() => UpdateApiStatus(false));
            }
        }        private async void CalibrateMicrophoneButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (sender is Button button)
                {
                    button.IsEnabled = false;
                }
                
                _logger.LogInformation("Starting microphone calibration");
                
                await _voiceService.CalibrateMicrophoneAsync();
                
                MessageBox.Show("Microphone calibration completed successfully!", "Calibration Complete", 
                              MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during microphone calibration");
                MessageBox.Show($"Error during calibration: {ex.Message}", "Calibration Error", 
                              MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                if (sender is Button button)
                {
                    button.IsEnabled = true;
                }
            }
        }
    }

    public class CommandHistoryItem
    {
        public string Command { get; set; } = string.Empty;
        public string Response { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
    }
}
