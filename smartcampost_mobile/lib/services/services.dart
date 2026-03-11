import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/models/models.dart';

class ScanService {
  final ApiClient _api = ApiClient();

  Future<ScanEvent> createScanEvent(Map<String, dynamic> data) async {
    return _api.post(
      '/scan-events',
      data: data,
      fromJson: (d) => ScanEvent.fromJson(d),
    );
  }

  Future<List<ScanEvent>> getScanEventsByParcel(String parcelId) async {
    final data = await _api.get<List<dynamic>>('/scan-events/parcel/$parcelId');
    return data
        .map((e) => ScanEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> syncOfflineEvents(List<Map<String, dynamic>> events) async {
    await _api.post('/offline/sync', data: events);
  }
}

class QrService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> verifyQr(String qrData) async {
    return _api.get<Map<String, dynamic>>(
      '/qr/verify/${Uri.encodeComponent(qrData)}',
    );
  }

  Future<Map<String, dynamic>> getSecureQr(String parcelId) async {
    return _api.post<Map<String, dynamic>>('/qr/secure/$parcelId');
  }

  Future<void> revokeQr(String token) async {
    await _api.delete('/qr/revoke/$token');
  }
}

class NotificationService {
  final ApiClient _api = ApiClient();

  Future<List<AppNotification>> getNotifications() async {
    final data = await _api.get<List<dynamic>>('/notifications');
    return data
        .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // Backend does not currently expose mark-as-read endpoints.
  // These are stubs that can be enabled once the backend adds support.
  Future<void> markAsRead(String id) async {
    await _api.put('/notifications/$id/read');
  }

  Future<void> markAllAsRead() async {
    await _api.put('/notifications/read-all');
  }

  Future<int> getUnreadCount() async {
    final count = await _api.get<int>('/notifications/me/unread-count');
    return count;
  }
}

class AddressService {
  final ApiClient _api = ApiClient();

  Future<List<Address>> getMyAddresses() async {
    final data = await _api.get<List<dynamic>>('/addresses/me');
    return data
        .map((e) => Address.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Address> createAddress(Map<String, dynamic> data) async {
    return _api.post(
      '/addresses',
      data: data,
      fromJson: (d) => Address.fromJson(d),
    );
  }

  Future<Address> updateAddress(String id, Map<String, dynamic> data) async {
    return _api.put(
      '/addresses/$id',
      data: data,
      fromJson: (d) => Address.fromJson(d),
    );
  }

  Future<void> deleteAddress(String id) async {
    await _api.delete('/addresses/$id');
  }
}

class SupportService {
  final ApiClient _api = ApiClient();

  Future<List<SupportTicket>> getMyTickets() async {
    final data = await _api.get<List<dynamic>>('/support/tickets/me');
    return data
        .map((e) => SupportTicket.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<SupportTicket> createTicket(Map<String, dynamic> data) async {
    return _api.post(
      '/support/tickets',
      data: data,
      fromJson: (d) => SupportTicket.fromJson(d),
    );
  }

  Future<SupportTicket> getTicketById(String id) async {
    return _api.get(
      '/support/tickets/$id',
      fromJson: (d) => SupportTicket.fromJson(d),
    );
  }
}

class DashboardService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> getDashboardStats() async {
    return _api.get<Map<String, dynamic>>('/dashboard/summary');
  }

  Future<Map<String, dynamic>> getSentimentAnalysis() async {
    return _api.get<Map<String, dynamic>>('/analytics/sentiment');
  }

  Future<Map<String, dynamic>> getSmartNotifications() async {
    return _api.get<Map<String, dynamic>>('/analytics/smart-notifications');
  }
}

class TariffService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getTariffs() async {
    return _api.get<List<dynamic>>('/tariffs');
  }

  Future<Map<String, dynamic>> calculatePrice(Map<String, dynamic> data) async {
    return _api.post<Map<String, dynamic>>('/tariffs/quote', data: data);
  }
}

class AiService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> chat(String message) async {
    return _api.post<Map<String, dynamic>>(
      '/ai/chat',
      data: {'message': message},
    );
  }
}

class ComplianceService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getAlerts() async {
    return _api.get<List<dynamic>>('/compliance/alerts');
  }

  Future<List<dynamic>> getRiskAlerts() async {
    return _api.get<List<dynamic>>('/risk/alerts');
  }
}

class UserManagementService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getAgents() async {
    return _api.get<List<dynamic>>('/agents');
  }

  Future<List<dynamic>> getCouriers() async {
    return _api.get<List<dynamic>>('/couriers');
  }

  Future<List<dynamic>> getClients() async {
    return _api.get<List<dynamic>>('/clients');
  }

  Future<List<dynamic>> getStaff() async {
    return _api.get<List<dynamic>>('/staff');
  }

  Future<List<dynamic>> getAgencies() async {
    return _api.get<List<dynamic>>('/agencies');
  }
}
