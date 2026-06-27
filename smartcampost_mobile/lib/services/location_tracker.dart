import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';

class LocationTracker {
  static final LocationTracker instance = LocationTracker._internal();
  LocationTracker._internal();

  Timer? _timer;
  final ApiClient _apiClient = ApiClient();
  bool _isTracking = false;
  bool _onDuty = false;

  static const String _queueKey = 'gps_offline_queue';
  static const int _maxQueueSize = 500;

  bool get isOnDuty => _onDuty;
  bool get isTracking => _isTracking;

  /// Toggle duty status. When off-duty, GPS stops completely.
  Future<void> setDuty(bool onDuty) async {
    _onDuty = onDuty;
    try {
      await _apiClient.post('/couriers/me/duty', data: {'onDuty': onDuty});
    } catch (e) {
      debugPrint('[LocationTracker] Failed to update duty status: $e');
    }
    debugPrint('[LocationTracker] Duty: ${onDuty ? "ON" : "OFF"}');
  }

  void start(AuthProvider authProvider) {
    if (_isTracking) return;
    _isTracking = true;
    _onDuty = true;

    // NOTE: Timer.periodic does NOT run reliably when the app is backgrounded.
    // For production background tracking, integrate a foreground service plugin
    // (e.g. flutter_background_service) so GPS continues when the screen is off.
    // The required Android permissions (FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION,
    // ACCESS_BACKGROUND_LOCATION) have already been added to AndroidManifest.xml.
    _timer = Timer.periodic(const Duration(seconds: 20), (timer) async {
      if (!authProvider.isAuthenticated) return;
      final role = authProvider.userRole.toUpperCase();
      if (role != 'COURIER' && role != 'AGENT' && role != 'STAFF' && role != 'ADMIN') return;
      if (!_onDuty) return;

      try {
        final hasPermission = await _checkAndRequestPermission();
        if (!hasPermission) return;

        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 10),
          ),
        );

        final point = {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'speed': position.speed,
          'heading': position.heading,
          'timestamp': DateTime.now().toUtc().toIso8601String(),
          'source': 'GPS',
        };

        try {
          await _apiClient.post('/logistics/gps/mobile', data: point);
          debugPrint('[GPS] Sent: ${position.latitude}, ${position.longitude}');
          await _flushOfflineQueue();
        } catch (e) {
          debugPrint('[GPS] Offline — caching location');
          await _cacheLocation(point);
        }
      } catch (e) {
        debugPrint('[GPS] Error: $e');
      }
    });
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _isTracking = false;
    _onDuty = false;
  }

  /// Cache a GPS point for later sync when back online.
  Future<void> _cacheLocation(Map<String, dynamic> point) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queue = prefs.getStringList(_queueKey) ?? [];
      if (queue.length >= _maxQueueSize) {
        queue.removeAt(0);
      }
      queue.add(jsonEncode(point));
      await prefs.setStringList(_queueKey, queue);
      debugPrint('[GPS] Cached (queue: ${queue.length})');
    } catch (e) {
      debugPrint('[GPS] Cache failed: $e');
    }
  }

  /// Flush all cached GPS points to the backend batch endpoint.
  Future<void> _flushOfflineQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queue = prefs.getStringList(_queueKey) ?? [];
      if (queue.isEmpty) return;

      final points = queue.map((s) => jsonDecode(s) as Map<String, dynamic>).toList();
      await _apiClient.post('/logistics/gps/mobile/batch', data: points);
      await prefs.setStringList(_queueKey, []);
      debugPrint('[GPS] Flushed ${points.length} cached points');
    } catch (e) {
      debugPrint('[GPS] Flush failed: $e');
    }
  }

  Future<bool> _checkAndRequestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;
    return true;
  }
}
