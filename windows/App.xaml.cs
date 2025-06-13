using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StudyHelperVoiceAssistant.Models;
using StudyHelperVoiceAssistant.Services;
using StudyHelperVoiceAssistant.Views;
using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Forms;
using Application = System.Windows.Application;
using MessageBox = System.Windows.MessageBox;

namespace StudyHelperVoiceAssistant
{
    public partial class App : Application
    {
        private IHost? _host;
        private NotifyIcon? _notifyIcon;
        private MainWindow? _mainWindow;
        private bool _isExiting = false;

        protected override async void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            try
            {
                // Build the host
                _host = CreateHost();
                await _host.StartAsync();

                // Initialize system tray
                InitializeSystemTray();

                // Create main window but don't show it initially
                _mainWindow = _host.Services.GetRequiredService<MainWindow>();
                _mainWindow.Closing += MainWindow_Closing;

                // Check if we should start minimized to tray
                var configService = _host.Services.GetRequiredService<ConfigurationService>();
                var config = configService.GetConfiguration();
                
                if (config.SystemSettings.StartMinimized)
                {
                    _mainWindow.WindowState = WindowState.Minimized;
                    _mainWindow.ShowInTaskbar = false;
                    _mainWindow.Hide();
                }
                else
                {
                    _mainWindow.Show();
                }

                // Log startup
                var logger = _host.Services.GetRequiredService<ILogger<App>>();
                logger.LogInformation("Study Helper Voice Assistant started");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to start application: {ex.Message}", "Startup Error", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
                Shutdown();
            }
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            _isExiting = true;
            
            try
            {
                // Cleanup system tray
                _notifyIcon?.Dispose();

                // Stop the host
                if (_host != null)
                {
                    await _host.StopAsync();
                    _host.Dispose();
                }
            }
            catch (Exception ex)
            {
                // Log error but don't prevent shutdown
                System.Diagnostics.Debug.WriteLine($"Error during shutdown: {ex.Message}");
            }

            base.OnExit(e);
        }

        private IHost CreateHost()
        {
            var builder = Host.CreateDefaultBuilder()
                .ConfigureAppConfiguration((context, config) =>
                {
                    config.SetBasePath(AppDomain.CurrentDomain.BaseDirectory);
                    config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                })                .ConfigureServices((context, services) =>
                {
                    // Configuration
                    services.Configure<AppConfig>(context.Configuration);
                    
                    // Get configuration to determine which voice service to use
                    var config = new AppConfig();
                    context.Configuration.Bind(config);
                    
                    // Services
                    services.AddSingleton<ConfigurationService>();
                    services.AddSingleton<StudyHelperApiService>();
                    services.AddSingleton<AudioDeviceService>();
                    
                    // Register voice service based on configuration
                    if (config.VoiceSettings.UseHybridVoiceRecognition)
                    {
                        services.AddSingleton<IVoiceService, HybridVoiceService>();
                        services.AddSingleton<HybridVoiceService>();
                    }
                    else
                    {
                        services.AddSingleton<IVoiceService, VoiceService>();
                        services.AddSingleton<VoiceService>();
                    }

                    // HTTP Client
                    services.AddHttpClient();

                    // Windows
                    services.AddSingleton<MainWindow>();

                    // Logging
                    services.AddLogging(logging =>
                    {
                        logging.AddConsole();
                        logging.AddDebug();
                        logging.SetMinimumLevel(LogLevel.Information);
                    });
                });

            return builder.Build();
        }

        private void InitializeSystemTray()
        {
            _notifyIcon = new NotifyIcon();
            
            // Set icon (you'll need to add an icon file)
            try
            {
                var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icon.ico");
                if (File.Exists(iconPath))
                {
                    _notifyIcon.Icon = new Icon(iconPath);
                }
                else
                {
                    // Use default system icon if custom icon not found
                    _notifyIcon.Icon = SystemIcons.Application;
                }
            }
            catch
            {
                _notifyIcon.Icon = SystemIcons.Application;
            }

            _notifyIcon.Text = "Study Helper Voice Assistant";
            _notifyIcon.Visible = true;

            // Create context menu
            var contextMenu = new ContextMenuStrip();
            
            var showMenuItem = new ToolStripMenuItem("Show Window");
            showMenuItem.Click += (s, e) => ShowMainWindow();
            contextMenu.Items.Add(showMenuItem);

            var hideMenuItem = new ToolStripMenuItem("Hide Window");
            hideMenuItem.Click += (s, e) => HideMainWindow();
            contextMenu.Items.Add(hideMenuItem);

            contextMenu.Items.Add(new ToolStripSeparator());

            var startVoiceMenuItem = new ToolStripMenuItem("Start Voice Assistant");
            startVoiceMenuItem.Click += async (s, e) => await StartVoiceAssistant();
            contextMenu.Items.Add(startVoiceMenuItem);

            var stopVoiceMenuItem = new ToolStripMenuItem("Stop Voice Assistant");
            stopVoiceMenuItem.Click += (s, e) => StopVoiceAssistant();
            contextMenu.Items.Add(stopVoiceMenuItem);

            contextMenu.Items.Add(new ToolStripSeparator());

            var exitMenuItem = new ToolStripMenuItem("Exit");
            exitMenuItem.Click += (s, e) => ExitApplication();
            contextMenu.Items.Add(exitMenuItem);

            _notifyIcon.ContextMenuStrip = contextMenu;

            // Double-click to show/hide window
            _notifyIcon.DoubleClick += (s, e) => ToggleMainWindow();
        }

        private void MainWindow_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            if (!_isExiting)
            {
                // Don't actually close, just hide to tray
                e.Cancel = true;
                HideMainWindow();
            }
        }

        private void ShowMainWindow()
        {
            if (_mainWindow != null)
            {
                _mainWindow.Show();
                _mainWindow.WindowState = WindowState.Normal;
                _mainWindow.ShowInTaskbar = true;
                _mainWindow.Activate();
            }
        }

        private void HideMainWindow()
        {
            if (_mainWindow != null)
            {
                _mainWindow.Hide();
                _mainWindow.ShowInTaskbar = false;
            }
        }

        private void ToggleMainWindow()
        {
            if (_mainWindow != null)
            {
                if (_mainWindow.IsVisible)
                {
                    HideMainWindow();
                }
                else
                {
                    ShowMainWindow();
                }
            }
        }        private async Task StartVoiceAssistant()
        {
            try
            {
                if (_host != null)
                {
                    var voiceService = _host.Services.GetRequiredService<IVoiceService>();
                    var configService = _host.Services.GetRequiredService<ConfigurationService>();
                    
                    if (!configService.IsApiKeyConfigured())
                    {
                        ShowMainWindow();
                        MessageBox.Show("Please configure your API key first.", "Configuration Required", 
                            MessageBoxButton.OK, MessageBoxImage.Warning);
                        return;
                    }

                    await voiceService.StartListeningAsync();
                    
                    _notifyIcon.ShowBalloonTip(3000, "Study Helper", 
                        "Voice assistant started and listening for commands.", ToolTipIcon.Info);
                }
            }
            catch (Exception ex)
            {
                _notifyIcon.ShowBalloonTip(5000, "Study Helper Error", 
                    $"Failed to start voice assistant: {ex.Message}", ToolTipIcon.Error);
            }
        }

        private void StopVoiceAssistant()
        {
            try
            {
                if (_host != null)
                {
                    var voiceService = _host.Services.GetRequiredService<IVoiceService>();
                    voiceService.StopListening();
                    
                    _notifyIcon.ShowBalloonTip(3000, "Study Helper", 
                        "Voice assistant stopped.", ToolTipIcon.Info);
                }
            }
            catch (Exception ex)
            {
                _notifyIcon.ShowBalloonTip(5000, "Study Helper Error", 
                    $"Failed to stop voice assistant: {ex.Message}", ToolTipIcon.Error);
            }
        }

        private void ExitApplication()
        {
            _isExiting = true;
            Shutdown();
        }
    }
}
