import 'package:smartcampost_mobile/core/api_client.dart';

class DeliveryService {
  final ApiClient _api = ApiClient();

  Future<void> startDelivery(Map<String, dynamic> data) async {
    await _api.post('/delivery/start', data: data);
  }

  Future<void> completeDelivery(Map<String, dynamic> data) async {
    await _api.post('/delivery/complete', data: data);
  }

  Future<void> sendDeliveryOtp(String deliveryId) async {
    await _api.post('/delivery/otp/send', data: {'deliveryId': deliveryId});
  }

  Future<void> verifyDeliveryOtp({
    required String deliveryId,
    required String otp,
  }) async {
    await _api.post(
      '/delivery/otp/verify',
      data: {'deliveryId': deliveryId, 'otp': otp},
    );
  }

  Future<Map<String, dynamic>> getDeliveryStatus(String parcelId) async {
    return _api.get<Map<String, dynamic>>('/delivery/$parcelId/status');
  }

  Future<void> markDeliveryFailed(
    String parcelId, {
    required String reason,
    required double latitude,
    required double longitude,
    String? notes,
  }) async {
    await _api.post(
      '/delivery/$parcelId/failed',
      queryParameters: {
        'reason': reason,
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'notes': ?notes,
      },
    );
  }
}
