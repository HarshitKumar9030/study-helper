using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using StudyHelperVoiceAssistant.Models;
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace StudyHelperVoiceAssistant.Services
{
    public class StudyHelperApiService
    {
        private readonly HttpClient _httpClient;
        private readonly AppConfig _config;
        private readonly ILogger<StudyHelperApiService> _logger; public StudyHelperApiService(HttpClient httpClient, IOptions<AppConfig> config, ILogger<StudyHelperApiService> logger)
        {
            _httpClient = httpClient;
            _config = config.Value;
            _logger = logger;

            _httpClient.BaseAddress = new Uri(_config.StudyHelper.BaseUrl);
            // Reduce timeout for faster voice responses (10 seconds instead of 30)
            _httpClient.Timeout = TimeSpan.FromSeconds(Math.Min(_config.StudyHelper.Timeout, 10));

            // Optimize for speed
            _httpClient.DefaultRequestHeaders.Add("Connection", "keep-alive");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "StudyHelper-VoiceAssistant/1.0");
        }
        public async Task<bool> ValidateApiKeyAsync()
        {
            if (string.IsNullOrEmpty(_config.StudyHelper.ApiKey))
            {
                _logger.LogWarning("API key is not configured");
                return false;
            }

            try
            {
                _logger.LogInformation("Validating API key...");

                var request = new HttpRequestMessage(HttpMethod.Get, "/api/voice-assistant?type=settings");
                request.Headers.Add("X-API-Key", _config.StudyHelper.ApiKey);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                _logger.LogDebug($"API validation response: {response.StatusCode}");

                if (response.IsSuccessStatusCode)
                {
                    var validationResponse = JsonConvert.DeserializeObject<dynamic>(content);
                    bool success = validationResponse?.success == true;

                    if (success)
                    {
                        _logger.LogInformation("API key validated successfully");
                        return true;
                    }
                    else
                    {
                        _logger.LogWarning($"API key validation failed: {content}");
                    }
                }
                else
                {
                    _logger.LogError($"API validation failed with status: {response.StatusCode}, content: {content}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating API key");
            }

            return false;
        }
        public async Task<string> ProcessVoiceCommandAsync(string command, string context = "", double confidence = 1.0)
        {
            if (string.IsNullOrEmpty(_config.StudyHelper.ApiKey))
            {
                _logger.LogWarning("API key not configured");
                return "API key not configured. Please check your settings.";
            }

            try
            {
                _logger.LogInformation($"Processing voice command: {command}");
                var startTime = DateTime.Now;

                // Call the AI chat API directly for faster response
                var chatRequest = new HttpRequestMessage(HttpMethod.Post, "/api/ai/chat");
                chatRequest.Headers.Add("X-API-Key", _config.StudyHelper.ApiKey);

                var chatPayload = new
                {
                    message = command,
                    context = "voice_assistant",
                    conversation_history = new object[0] // Empty for now, could be enhanced later
                };

                var chatJson = JsonConvert.SerializeObject(chatPayload);
                chatRequest.Content = new StringContent(chatJson, Encoding.UTF8, "application/json");

                _logger.LogDebug($"Sending direct chat request to: {_httpClient.BaseAddress}api/ai/chat");

                var chatResponse = await _httpClient.SendAsync(chatRequest);
                var chatContent = await chatResponse.Content.ReadAsStringAsync();

                var processingTime = DateTime.Now - startTime;
                _logger.LogInformation($"Chat API response received in {processingTime.TotalMilliseconds}ms");

                if (chatResponse.IsSuccessStatusCode)
                {
                    var aiResult = JsonConvert.DeserializeObject<dynamic>(chatContent);
                    var message = aiResult?.data?.message?.ToString(); if (!string.IsNullOrEmpty(message))
                    {
                        // Async save to voice command history (don't wait for this)
                        _ = Task.Run(async () => await SaveVoiceCommandAsync(command, message!, confidence, processingTime));
                        _logger.LogInformation($"AI response received: {(message!.Length > 100 ? message.Substring(0, 100) + "..." : message)}");
                        return message;
                    }
                    else
                    {
                        _logger.LogWarning("AI response was empty or invalid format");
                        return "I couldn't process that command. Could you try rephrasing it?";
                    }
                }
                else if (chatResponse.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    _logger.LogError("Authentication failed - invalid API key");
                    return "Authentication failed. Please check your API key in settings.";
                }
                else
                {
                    _logger.LogError($"Chat API failed with status: {chatResponse.StatusCode}, content: {chatContent}");
                    return $"Server error ({chatResponse.StatusCode}). Please try again later.";
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Network error processing voice command");
                return "Connection error. Please check your internet connection and server URL in settings.";
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Request timeout processing voice command");
                return "Request timed out. Please try again.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error processing voice command");
                return "An unexpected error occurred. Please try again.";
            }
        }

        private async Task SaveVoiceCommandAsync(string command, string response, double confidence, TimeSpan responseTime)
        {
            try
            {
                // Save to voice command history for database sync
                var voiceRequest = new HttpRequestMessage(HttpMethod.Put, "/api/voice-assistant");
                voiceRequest.Headers.Add("X-API-Key", _config.StudyHelper.ApiKey);

                var voicePayload = new
                {
                    command = command,
                    options = new
                    {
                        sessionId = DateTime.Now.ToString("yyyyMMddHHmmss"),
                        confidence = confidence,
                        intent = DetermineIntent(command),
                        context = new { source = "windows_voice_assistant", response_time_ms = responseTime.TotalMilliseconds },
                        responseTime = (int)responseTime.TotalMilliseconds,
                        precomputedResponse = response // Send the response we already got
                    }
                };

                var voiceJson = JsonConvert.SerializeObject(voicePayload);
                voiceRequest.Content = new StringContent(voiceJson, Encoding.UTF8, "application/json");

                var voiceResponse = await _httpClient.SendAsync(voiceRequest);

                if (voiceResponse.IsSuccessStatusCode)
                {
                    _logger.LogDebug("Voice command saved to history successfully");
                }
                else
                {
                    _logger.LogWarning($"Failed to save voice command to history: {voiceResponse.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving voice command to history");
            }
        }

        private string DetermineIntent(string command)
        {
            var lowerCommand = command.ToLower();

            if (lowerCommand.Contains("schedule") || lowerCommand.Contains("calendar") || lowerCommand.Contains("appointment"))
                return "schedule";
            if (lowerCommand.Contains("study") || lowerCommand.Contains("learn") || lowerCommand.Contains("topic"))
                return "study_assistance";
            if (lowerCommand.Contains("timer") || lowerCommand.Contains("remind") || lowerCommand.Contains("break"))
                return "timer";
            if (lowerCommand.Contains("help") || lowerCommand.Contains("how") || lowerCommand.Contains("what"))
                return "help";
            if (lowerCommand.Contains("progress") || lowerCommand.Contains("achievement") || lowerCommand.Contains("score"))
                return "progress";

            return "general_query";
        }

        public async Task<bool> SendHeartbeatAsync()
        {
            if (string.IsNullOrEmpty(_config.StudyHelper.ApiKey))
            {
                return false;
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "/api/helper/auth");
                request.Headers.Add("X-API-Key", _config.StudyHelper.ApiKey);

                var payload = new
                {
                    action = "heartbeat",
                    data = new
                    {
                        status = "active",
                        timestamp = DateTime.Now,
                        client_version = "1.0.0"
                    }
                };

                var json = JsonConvert.SerializeObject(payload);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending heartbeat");
                return false;
            }
        }

        public async Task<UserInfo?> GetUserInfoAsync()
        {
            if (string.IsNullOrEmpty(_config.StudyHelper.ApiKey))
            {
                _logger.LogWarning("API key is not configured");
                return null;
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, "/api/helper/auth");
                request.Headers.Add("X-API-Key", _config.StudyHelper.ApiKey);

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var authResponse = JsonConvert.DeserializeObject<AuthResponse>(content);

                    if (authResponse?.Success == true && authResponse.User != null)
                    {
                        _logger.LogInformation($"Retrieved user info: {authResponse.User.Name}");
                        return authResponse.User;
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"Failed to get user info: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user info");
            }

            return null;
        }
    }
}
