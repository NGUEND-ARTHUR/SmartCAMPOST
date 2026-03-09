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
}
