import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/core/constants.dart';
import 'package:smartcampost_mobile/models/models.dart';

class PickupService {
  final ApiClient _api = ApiClient();

  Future<PaginatedResponse<PickupRequest>> getPickups({
    int page = 0,
    int size = AppConstants.defaultPageSize,
  }) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/pickups',
      queryParameters: {'page': page, 'size': size},
    );
    return PaginatedResponse.fromJson(data, PickupRequest.fromJson);
  }

  Future<PaginatedResponse<PickupRequest>> getMyPickups({
    int page = 0,
    int size = AppConstants.defaultPageSize,
  }) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/pickups/me',
      queryParameters: {'page': page, 'size': size},
    );
    return PaginatedResponse.fromJson(data, PickupRequest.fromJson);
  }

  Future<PickupRequest> getPickupById(String id) async {
    return _api.get('/pickups/$id', fromJson: (d) => PickupRequest.fromJson(d));
  }

  Future<PickupRequest> createPickup(Map<String, dynamic> data) async {
    return _api.post(
      '/pickups',
      data: data,
      fromJson: (d) => PickupRequest.fromJson(d),
    );
  }

  Future<void> assignCourier(String pickupId, String courierId) async {
    await _api.post(
      '/pickups/$pickupId/assign-courier',
      data: {'courierId': courierId},
    );
  }

  Future<void> confirmPickup(Map<String, dynamic> data) async {
    await _api.post('/pickups/confirm', data: data);
  }
}
