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

  Future<Map<String, dynamic>> verifyQr(
    String qrData, {
    double? latitude,
    double? longitude,
  }) async {
    String path = '/qr/verify/${Uri.encodeComponent(qrData)}';
    final queryParams = <String>[];
    if (latitude != null) queryParams.add('latitude=$latitude');
    if (longitude != null) queryParams.add('longitude=$longitude');
    if (queryParams.isNotEmpty) {
      path += '?${queryParams.join('&')}';
    }
    return _api.get<Map<String, dynamic>>(path);
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
    // Backend returns a paginated Page<TicketResponse>, not a bare array.
    final data = await _api.get<Map<String, dynamic>>('/support/tickets/me');
    final content = data['content'] as List<dynamic>? ?? [];
    return content
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

  Future<SupportTicket> replyToTicket(String id, String message) async {
    // Backend's TicketReplyRequest only has `replyMessage` — sending `message`
    // alone fails @NotBlank validation on replyMessage.
    return _api.post(
      '/support/tickets/$id/reply',
      data: {'replyMessage': message},
      fromJson: (d) => SupportTicket.fromJson(d),
    );
  }
}

class DashboardService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> getDashboardStats() async {
    return _api.get<Map<String, dynamic>>('/dashboard/summary');
  }
}

class TariffService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getTariffs() async {
    return _extractItems(await _api.get<dynamic>('/tariffs'));
  }

  Future<Map<String, dynamic>> calculatePrice(Map<String, dynamic> data) async {
    return _api.post<Map<String, dynamic>>('/tariffs/quote', data: data);
  }
}

class AiService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> chat(String message, {String? sessionId, String? context}) async {
    return _api.post<Map<String, dynamic>>(
      '/ai/chat',
      data: {
        'message': message,
        if (sessionId != null) 'sessionId': sessionId,
        if (context != null) 'context': context,
      },
    );
  }

  Future<AgentStatusResponse> getAgentStatus() async {
    return _api.get<AgentStatusResponse>(
      '/ai/agent/status',
      fromJson: (d) => AgentStatusResponse.fromJson(d as Map<String, dynamic>),
    );
  }
}

class ParcelMessageService {
  final ApiClient _api = ApiClient();

  Future<List<ParcelMessage>> list(String parcelId) async {
    final data = await _api.get<List<dynamic>>('/parcels/$parcelId/messages');
    return data.map((e) => ParcelMessage.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ParcelMessage> send(String parcelId, String content) async {
    return _api.post(
      '/parcels/$parcelId/messages',
      data: {'content': content},
      fromJson: (d) => ParcelMessage.fromJson(d),
    );
  }

  Future<void> markRead(String parcelId) async {
    await _api.post('/parcels/$parcelId/messages/read');
  }
}

class PricingDetailService {
  final ApiClient _api = ApiClient();

  Future<List<PricingDetail>> getAllForParcel(String parcelId) async {
    final data = await _api.get<List<dynamic>>('/pricing-details/parcel/$parcelId/all');
    return data.map((e) => PricingDetail.fromJson(e as Map<String, dynamic>)).toList();
  }
}

class MapService {
  final ApiClient _api = ApiClient();

  Future<CourierMapResponse> getCourierMap() async {
    return _api.get<CourierMapResponse>(
      '/map/couriers/me',
      fromJson: (d) => CourierMapResponse.fromJson(d as Map<String, dynamic>),
    );
  }
}

class RouteOptimizationService {
  final ApiClient _api = ApiClient();

  Future<RouteOptimizationResult> optimizeRoute({
    required double currentLatitude,
    required double currentLongitude,
    required List<RouteOptimizationStop> stops,
    String optimizationStrategy = 'BALANCED',
  }) async {
    return _api.post<RouteOptimizationResult>(
      '/logistics/route-optimization',
      data: {
        'currentLatitude': currentLatitude,
        'currentLongitude': currentLongitude,
        'stops': stops.map((s) => s.toJson()).toList(),
        'optimizationStrategy': optimizationStrategy,
      },
      fromJson: (d) => RouteOptimizationResult.fromJson(d as Map<String, dynamic>),
    );
  }
}

class DemandForecastService {
  final ApiClient _api = ApiClient();

  Future<DemandForecastResponse> forecastDemand({
    String? agencyId,
    String? region,
    int forecastDays = 7,
  }) async {
    return _api.post<DemandForecastResponse>(
      '/analytics/demand-forecast',
      data: {
        if (agencyId != null) 'agencyId': agencyId,
        if (region != null) 'region': region,
        'forecastDays': forecastDays,
      },
      fromJson: (d) => DemandForecastResponse.fromJson(d as Map<String, dynamic>),
    );
  }
}

class ComplianceService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getAlerts() async {
    return _extractItems(await _api.get<dynamic>('/compliance/alerts'));
  }

  Future<List<dynamic>> getRiskAlerts() async {
    return _extractItems(await _api.get<dynamic>('/risk/alerts'));
  }

  Future<List<dynamic>> getReports() async {
    return _extractItems(await _api.get<dynamic>('/compliance/reports'));
  }

  Future<void> updateAlert(String id, Map<String, dynamic> data) async {
    await _api.patch('/compliance/alerts/$id', data: data);
  }

  Future<void> freezeAccount(String userId, {String? reason}) async {
    await _api.post(
      '/compliance/accounts/$userId/freeze',
      data: {'reason': reason ?? 'Mobile risk action'},
    );
  }

  Future<void> unfreezeAccount(String userId) async {
    await _api.post('/compliance/accounts/$userId/unfreeze');
  }
}

class UserManagementService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getAgents() async {
    return _extractItems(await _api.get<dynamic>('/agents'));
  }

  Future<List<dynamic>> getCouriers() async {
    return _extractItems(await _api.get<dynamic>('/couriers'));
  }

  Future<List<dynamic>> getClients() async {
    return _extractItems(await _api.get<dynamic>('/clients'));
  }

  Future<List<dynamic>> getStaff() async {
    return _extractItems(await _api.get<dynamic>('/staff'));
  }

  Future<List<dynamic>> getAgencies() async {
    return _extractItems(await _api.get<dynamic>('/agencies'));
  }

  Future<List<dynamic>> getIntegrations() async {
    return _extractItems(await _api.get<dynamic>('/integrations'));
  }
}

class RefundService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getRefunds({int page = 0, int size = 50}) async {
    return _extractItems(
      await _api.get<dynamic>(
        '/refunds',
        queryParameters: {'page': page, 'size': size},
      ),
    );
  }

  Future<void> updateStatus(String refundId, String status) async {
    await _api.patch('/refunds/$refundId/status', data: {'status': status});
  }
}

class InvoiceService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getMyInvoices() async {
    return _extractItems(await _api.get<dynamic>('/invoices/me'));
  }

  Future<List<dynamic>> getInvoicesByParcel(String parcelId) async {
    return _extractItems(
      await _api.get<dynamic>('/invoices/by-parcel/$parcelId'),
    );
  }

  String pdfUrl(String invoiceId) {
    return '${ApiClient().dio.options.baseUrl}/invoices/$invoiceId/pdf';
  }
}

class AuditService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> getParcelAudit(String parcelId) async {
    return _api.get<Map<String, dynamic>>('/audit/parcel/$parcelId');
  }

  Future<List<dynamic>> getActorAudit(String actorId) async {
    return _extractItems(await _api.get<dynamic>('/audit/actor/$actorId'));
  }

  Future<List<dynamic>> getAgencyAudit(String agencyId) async {
    return _extractItems(await _api.get<dynamic>('/audit/agency/$agencyId'));
  }
}

class SelfHealingService {
  final ApiClient _api = ApiClient();

  Future<List<dynamic>> getCongestion() async {
    return _extractItems(await _api.get<dynamic>('/self-healing/congestion'));
  }

  Future<List<dynamic>> getActions() async {
    return _extractItems(await _api.get<dynamic>('/self-healing/actions'));
  }

  Future<Map<String, dynamic>> getCourierRoute(String courierId) async {
    return _api.get<Map<String, dynamic>>(
      '/self-healing/route/courier/$courierId',
    );
  }
}

class GeolocationService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> routeEta(Map<String, dynamic> data) async {
    return _api.post<Map<String, dynamic>>('/geo/route-eta', data: data);
  }
}

List<dynamic> _extractItems(dynamic data) {
  if (data is List) return data;
  if (data is Map<String, dynamic>) {
    final content = data['content'];
    if (content is List) return content;
    final items = data['items'];
    if (items is List) return items;
    final dataItems = data['data'];
    if (dataItems is List) return dataItems;
  }
  return const [];
}
