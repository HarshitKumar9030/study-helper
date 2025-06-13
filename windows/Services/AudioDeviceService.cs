using NAudio.Wave;
using NAudio.CoreAudioApi;
using StudyHelperVoiceAssistant.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StudyHelperVoiceAssistant.Services
{
    public class AudioDeviceService
    {
        private readonly ILogger<AudioDeviceService> _logger;
        private MMDeviceEnumerator? _deviceEnumerator;

        public AudioDeviceService(ILogger<AudioDeviceService> logger)
        {
            _logger = logger;
            InitializeDeviceEnumerator();
        }

        private void InitializeDeviceEnumerator()
        {
            try
            {
                _deviceEnumerator = new MMDeviceEnumerator();
                _logger.LogInformation("Audio device enumerator initialized");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize audio device enumerator");
            }
        }

        public List<MicrophoneInfo> GetAvailableMicrophones()
        {
            var microphones = new List<MicrophoneInfo>();

            try
            {
                if (_deviceEnumerator == null)
                {
                    _logger.LogWarning("Device enumerator not initialized");
                    return microphones;
                }

                var devices = _deviceEnumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active);
                var defaultDevice = _deviceEnumerator.GetDefaultAudioEndpoint(DataFlow.Capture, Role.Console);

                foreach (var device in devices)
                {
                    try
                    {
                        var micInfo = new MicrophoneInfo
                        {
                            DeviceId = device.ID,
                            Name = device.FriendlyName,
                            IsDefault = device.ID == defaultDevice?.ID,
                            IsWorking = TestMicrophone(device, TimeSpan.FromMilliseconds(500))
                        };

                        microphones.Add(micInfo);
                        _logger.LogDebug($"Found microphone: {micInfo.Name} (Default: {micInfo.IsDefault})");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error processing microphone device: {device.FriendlyName}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enumerating microphone devices");
            }

            return microphones;
        }

        public List<AudioDevice> GetAvailableSpeakers()
        {
            var speakers = new List<AudioDevice>();

            try
            {
                if (_deviceEnumerator == null)
                {
                    _logger.LogWarning("Device enumerator not initialized");
                    return speakers;
                }

                var devices = _deviceEnumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active);
                var defaultDevice = _deviceEnumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Console);

                foreach (var device in devices)
                {
                    try
                    {
                        var speakerInfo = new AudioDevice
                        {
                            DeviceId = device.ID,
                            Name = device.FriendlyName,
                            Description = device.DeviceFriendlyName,
                            IsDefault = device.ID == defaultDevice?.ID,
                            IsEnabled = device.State == DeviceState.Active,
                            DeviceType = "Speaker"
                        };

                        speakers.Add(speakerInfo);
                        _logger.LogDebug($"Found speaker: {speakerInfo.Name} (Default: {speakerInfo.IsDefault})");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error processing speaker device: {device.FriendlyName}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enumerating speaker devices");
            }

            return speakers;
        }

        public bool TestMicrophone(string deviceId, TimeSpan duration)
        {
            try
            {
                if (_deviceEnumerator == null)
                    return false;

                var device = _deviceEnumerator.GetDevice(deviceId);
                return TestMicrophone(device, duration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error testing microphone {deviceId}");
                return false;
            }
        }

        private bool TestMicrophone(MMDevice device, TimeSpan duration)
        {
            try
            {
                using var capture = new WasapiCapture(device);
                capture.WaveFormat = new WaveFormat(16000, 1); // 16kHz, mono
                  bool hasSignal = false;
                var startTime = DateTime.Now;

                capture.DataAvailable += (s, e) =>
                {
                    // Check for audio signal
                    for (int i = 0; i < e.BytesRecorded; i += 2)
                    {
                        if (i + 1 < e.BytesRecorded)
                        {
                            short sample = BitConverter.ToInt16(e.Buffer, i);
                            if (Math.Abs(sample) > 100) // Threshold for detecting signal
                            {
                                hasSignal = true;
                                break;
                            }
                        }
                    }
                };

                capture.StartRecording();
                
                // Wait for test duration
                while (DateTime.Now - startTime < duration && !hasSignal)
                {
                    System.Threading.Thread.Sleep(50);
                }

                capture.StopRecording();
                return hasSignal; // Return true if audio was detected
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, $"Microphone test failed for device: {device.FriendlyName}");
                return false;
            }
        }        public Task<double> GetMicrophoneLevel(string deviceId)
        {
            try
            {
                if (_deviceEnumerator == null || string.IsNullOrEmpty(deviceId))
                    return Task.FromResult(0.0);

                var device = _deviceEnumerator.GetDevice(deviceId);
                if (device?.AudioMeterInformation != null)
                {
                    var level = (double)device.AudioMeterInformation.MasterPeakValue * 100;
                    return Task.FromResult(level);
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, $"Error getting microphone level for device: {deviceId}");
            }

            return Task.FromResult(0.0);
        }

        public bool SetDefaultMicrophone(string deviceId)
        {
            try
            {
                if (_deviceEnumerator == null || string.IsNullOrEmpty(deviceId))
                    return false;

                var device = _deviceEnumerator.GetDevice(deviceId);
                if (device != null)
                {
                    // Note: Setting default device requires admin privileges
                    // This would typically be done through Windows settings
                    _logger.LogInformation($"Selected microphone: {device.FriendlyName}");
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting default microphone: {deviceId}");
            }

            return false;
        }

        public void Dispose()
        {
            _deviceEnumerator?.Dispose();
        }
    }
}
