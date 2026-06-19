import 'package:flutter/foundation.dart';

/// Push Notification Service for SmartCAMPOST Mobile
///
/// Handles Firebase Cloud Messaging (FCM) initialization,
/// permission requests, token management, and message handling.
///
/// ⚠️  SETUP REQUIRED:
/// 1. Add your google-services.json (Android) to android/app/
/// 2. Add your GoogleService-Info.plist (iOS) to ios/Runner/
/// 3. Add firebase_core and firebase_messaging to pubspec.yaml
/// 4. Run: flutterfire configure
///
/// Until Firebase is configured, this service gracefully no-ops.
class PushNotificationService {
  static String? _fcmToken;
  static const bool _initialized = false;

  /// Initialize Firebase and request notification permissions.
  /// Call this from main() before runApp().
  static Future<void> initialize() async {
    try {
      // Dynamically import firebase_core to avoid crash if not configured
      // In production, replace with direct Firebase.initializeApp() call
      // after running `flutterfire configure`
      await _tryInitializeFirebase();
    } catch (e) {
      // Firebase not configured yet — gracefully degrade
      debugPrint('[PushNotificationService] Firebase not configured: $e');
      debugPrint('[PushNotificationService] Push notifications disabled. '
          'Run `flutterfire configure` to enable.');
    }
  }

  static Future<void> _tryInitializeFirebase() async {
    // This block will be replaced by the actual Firebase initialization
    // once `flutterfire configure` is run and google-services.json is added.
    //
    // Replace with:
    //
    //   await Firebase.initializeApp(
    //     options: DefaultFirebaseOptions.currentPlatform,
    //   );
    //
    //   final messaging = FirebaseMessaging.instance;
    //
    //   // Request permission (required on iOS, optional on Android 13+)
    //   final settings = await messaging.requestPermission(
    //     alert: true,
    //     badge: true,
    //     sound: true,
    //     provisional: false,
    //   );
    //
    //   if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    //     _fcmToken = await messaging.getToken();
    //     debugPrint('[FCM] Device token: $_fcmToken');
    //     _sendTokenToBackend(_fcmToken!);
    //   }
    //
    //   // Foreground message handler
    //   FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    //
    //   // Background message handler (registered as top-level function)
    //   FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    //
    //   _initialized = true;

    debugPrint('[PushNotificationService] Stub initialized. '
        'Configure Firebase to enable real push notifications.');
  }

  /// Send the FCM device token to the SmartCAMPOST backend
  /// so the server can send targeted push notifications.
  static Future<void> sendTokenToBackend(String token) async {
    // TODO: Call PATCH /api/clients/me/fcm-token with the token
    // This requires authentication, so defer until after login.
    debugPrint('[FCM] Token to send to backend: $token');
  }

  /// Handle a notification received while the app is in the foreground.
  static void handleForegroundMessage(dynamic message) {
    debugPrint('[FCM] Foreground message: ${message.notification?.title}');
    // TODO: Show a local notification using flutter_local_notifications
    // or update app state directly (e.g., increment notification badge)
  }

  /// Returns the current FCM device token, or null if not available.
  static String? get fcmToken => _fcmToken;

  /// Returns true if Firebase was successfully initialized.
  static bool get isInitialized => _initialized;

  /// Platform-specific notification channel setup for Android.
  static String get androidChannelId => 'smartcampost_notifications';
  static String get androidChannelName => 'SmartCAMPOST Notifications';
  static String get androidChannelDescription =>
      'Parcel status updates, delivery alerts, and system notifications';
}

/// Top-level function required by Firebase for background message handling.
/// Must be a top-level function (not a class method).
// @pragma('vm:entry-point')
// Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
//   await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
//   debugPrint('[FCM] Background message: ${message.notification?.title}');
// }
