import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/models/models.dart';

class PaymentService {
  final ApiClient _api = ApiClient();

  Future<Payment> initPayment(Map<String, dynamic> data) async {
    return _api.post(
      '/payments/init',
      data: data,
      fromJson: (d) => Payment.fromJson(d),
    );
  }

  Future<Payment> confirmPayment(Map<String, dynamic> data) async {
    return _api.post(
      '/payments/confirm',
      data: data,
      fromJson: (d) => Payment.fromJson(d),
    );
  }

  Future<Payment> getPaymentById(String id) async {
    return _api.get('/payments/$id', fromJson: (d) => Payment.fromJson(d));
  }

  Future<List<Payment>> getPaymentsByParcel(String parcelId) async {
    final data = await _api.get<List<dynamic>>('/payments/parcel/$parcelId');
    return data
        .map((e) => Payment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Payment>> getPayments({int page = 0, int size = 50}) async {
    final data = await _api.get<dynamic>(
      '/payments',
      queryParameters: {'page': page, 'size': size},
    );
    final items = _extractItems(data);
    return items
        .whereType<Map<String, dynamic>>()
        .map(Payment.fromJson)
        .toList();
  }

  Future<Map<String, dynamic>> getPaymentSummary(String parcelId) async {
    return _api.get<Map<String, dynamic>>('/payments/summary/$parcelId');
  }

  List<dynamic> _extractItems(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      final content = data['content'];
      if (content is List) return content;
      final items = data['items'];
      if (items is List) return items;
    }
    return const [];
  }
}
