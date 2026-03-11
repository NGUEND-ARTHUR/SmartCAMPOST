import 'package:smartcampost_mobile/core/api_client.dart';

class DeliveryService {
  final ApiClient _api = ApiClient();

  Future<void> startDelivery(Map<String, dynamic> data) async {
    await _api.post('/delivery/start', data: data);
  }

  Future<void> completeDelivery(Map<String, dynamic> data) async {
    await _api.post('/delivery/complete', data: data);
  }

  Future<void> sendDeliveryOtp({
    required String parcelId,
    required String phoneNumber,
    double? latitude,
    double? longitude,
  }) async {
    await _api.post(
      '/delivery/otp/send',
      data: {
        'parcelId': parcelId,
        'phoneNumber': phoneNumber,
        'latitude': ?latitude,
        'longitude': ?longitude,
      },
    );
  }

  Future<void> verifyDeliveryOtp({
    required String parcelId,
    required String otpCode,
    double? latitude,
    double? longitude,
  }) async {
    await _api.post(
      '/delivery/otp/verify',
      data: {
        'parcelId': parcelId,
        'otpCode': otpCode,
        'latitude': ?latitude,
        'longitude': ?longitude,
      },
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
