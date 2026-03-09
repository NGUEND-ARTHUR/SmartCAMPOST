import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/core/constants.dart';
import 'package:smartcampost_mobile/models/models.dart';

class ParcelService {
  final ApiClient _api = ApiClient();

  Future<PaginatedResponse<Parcel>> getParcels({
    int page = 0,
    int size = AppConstants.defaultPageSize,
  }) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/parcels',
      queryParameters: {'page': page, 'size': size},
    );
    return PaginatedResponse.fromJson(data, Parcel.fromJson);
  }

  Future<PaginatedResponse<Parcel>> getMyParcels({
    int page = 0,
    int size = AppConstants.defaultPageSize,
  }) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/parcels/me',
      queryParameters: {'page': page, 'size': size},
    );
    return PaginatedResponse.fromJson(data, Parcel.fromJson);
  }

  Future<Parcel> getParcelById(String id) async {
    return _api.get('/parcels/$id', fromJson: (d) => Parcel.fromJson(d));
  }

  Future<Parcel> trackParcel(String trackingRef) async {
    return _api.get(
      '/parcels/tracking/$trackingRef',
      fromJson: (d) => Parcel.fromJson(d),
    );
  }

  Future<Parcel> createParcel(Map<String, dynamic> data) async {
    return _api.post(
      '/parcels',
      data: data,
      fromJson: (d) => Parcel.fromJson(d),
    );
  }

  Future<Parcel> updateParcelStatus(
    String id, {
    required String status,
    double? latitude,
    double? longitude,
    String? comment,
  }) async {
    return _api.patch(
      '/parcels/$id/status',
      data: {
        'status': status,
        'latitude': ?latitude,
        'longitude': ?longitude,
        'comment': ?comment,
      },
      fromJson: (d) => Parcel.fromJson(d),
    );
  }

  Future<Parcel> validateAndLock(
    String id, {
    double? validatedWeight,
    String? validatedDimensions,
    String? validationComment,
    bool? descriptionConfirmed,
  }) async {
    return _api.post(
      '/parcels/$id/validate-and-lock',
      data: {
        'validatedWeight': ?validatedWeight,
        'validatedDimensions': ?validatedDimensions,
        'validationComment': ?validationComment,
        'descriptionConfirmed': ?descriptionConfirmed,
      },
      fromJson: (d) => Parcel.fromJson(d),
    );
  }
}
