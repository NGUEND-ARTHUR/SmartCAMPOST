import 'package:smartcampost_mobile/models/address.dart';

class PickupRequest {
  final String id;
  final String? parcelId;
  final dynamic address; // Can be Address or String
  final String? requestedDate;
  final String? timeWindow;
  final String? courierId;
  final String? comment;
  final String? createdAt;
  final String? state;

  PickupRequest({
    required this.id,
    this.parcelId,
    this.address,
    this.requestedDate,
    this.timeWindow,
    this.courierId,
    this.comment,
    this.createdAt,
    this.state,
  });

  Address? get addressObj {
    if (address is Map<String, dynamic>) {
      return Address.fromJson(address as Map<String, dynamic>);
    }
    return null;
  }

  String? get addressString {
    if (address is String) return address as String;
    if (address is Map<String, dynamic>) {
      return Address.fromJson(address as Map<String, dynamic>).displayAddress;
    }
    return null;
  }

  factory PickupRequest.fromJson(Map<String, dynamic> json) => PickupRequest(
    id: json['id']?.toString() ?? '',
    parcelId: json['parcelId']?.toString(),
    address: json['address'],
    requestedDate: json['requestedDate'] as String?,
    timeWindow: json['timeWindow'] as String?,
    courierId: json['courierId']?.toString(),
    comment: json['comment'] as String?,
    createdAt: json['createdAt'] as String?,
    state: json['state'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    if (parcelId != null) 'parcelId': parcelId,
    if (address != null) 'address': address,
    if (requestedDate != null) 'requestedDate': requestedDate,
    if (timeWindow != null) 'timeWindow': timeWindow,
    if (courierId != null) 'courierId': courierId,
    if (comment != null) 'comment': comment,
  };
}

class SupportTicket {
  final String id;
  final String subject;
  final String? description;
  final String? category;
  final String? status;
  final String? priority;
  final String? clientId;
  final String? parcelId;
  final String? assignedStaffId;
  final String? createdAt;

  SupportTicket({
    required this.id,
    required this.subject,
    this.description,
    this.category,
    this.status,
    this.priority,
    this.clientId,
    this.parcelId,
    this.assignedStaffId,
    this.createdAt,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) => SupportTicket(
    id: json['id']?.toString() ?? '',
    subject: json['subject'] as String? ?? '',
    description: json['description'] as String?,
    category: json['category'] as String?,
    status: json['status'] as String?,
    priority: json['priority'] as String?,
    clientId: json['clientId']?.toString(),
    parcelId: json['parcelId']?.toString(),
    assignedStaffId: json['assignedStaffId']?.toString(),
    createdAt: json['createdAt'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'subject': subject,
    if (description != null) 'description': description,
    if (category != null) 'category': category,
    if (priority != null) 'priority': priority,
    if (parcelId != null) 'parcelId': parcelId,
  };
}

class AuditRecord {
  final String recordId;
  final String parcelId;
  final String? trackingRef;
  final String? actorId;
  final String? actorRole;
  final String? actorName;
  final String timestamp;
  final String? deviceTimestamp;
  final double? latitude;
  final double? longitude;
  final String? locationNote;
  final String? locationSource;
  final String action;
  final String eventType;
  final String? previousStatus;
  final String? newStatus;
  final String? comment;
  final String? proofUrl;
  final String? agencyId;
  final String? agencyName;

  AuditRecord({
    required this.recordId,
    required this.parcelId,
    this.trackingRef,
    this.actorId,
    this.actorRole,
    this.actorName,
    required this.timestamp,
    this.deviceTimestamp,
    this.latitude,
    this.longitude,
    this.locationNote,
    this.locationSource,
    required this.action,
    required this.eventType,
    this.previousStatus,
    this.newStatus,
    this.comment,
    this.proofUrl,
    this.agencyId,
    this.agencyName,
  });

  factory AuditRecord.fromJson(Map<String, dynamic> json) => AuditRecord(
    recordId: json['recordId']?.toString() ?? '',
    parcelId: json['parcelId']?.toString() ?? '',
    trackingRef: json['trackingRef'] as String?,
    actorId: json['actorId']?.toString(),
    actorRole: json['actorRole'] as String?,
    actorName: json['actorName'] as String?,
    timestamp: json['timestamp'] as String? ?? '',
    deviceTimestamp: json['deviceTimestamp'] as String?,
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
    locationNote: json['locationNote'] as String?,
    locationSource: json['locationSource'] as String?,
    action: json['action'] as String? ?? '',
    eventType: json['eventType'] as String? ?? '',
    previousStatus: json['previousStatus'] as String?,
    newStatus: json['newStatus'] as String?,
    comment: json['comment'] as String?,
    proofUrl: json['proofUrl'] as String?,
    agencyId: json['agencyId']?.toString(),
    agencyName: json['agencyName'] as String?,
  );
}

class CongestionAlert {
  final String agencyId;
  final String agencyName;
  final int parcelCount;
  final int threshold;
  final int congestionLevel;
  final String detectedAt;
  final List<String> suggestedActions;

  CongestionAlert({
    required this.agencyId,
    required this.agencyName,
    required this.parcelCount,
    required this.threshold,
    required this.congestionLevel,
    required this.detectedAt,
    required this.suggestedActions,
  });

  factory CongestionAlert.fromJson(Map<String, dynamic> json) =>
      CongestionAlert(
        agencyId: json['agencyId']?.toString() ?? '',
        agencyName: json['agencyName'] as String? ?? '',
        parcelCount: json['parcelCount'] as int? ?? 0,
        threshold: json['threshold'] as int? ?? 0,
        congestionLevel: json['congestionLevel'] as int? ?? 0,
        detectedAt: json['detectedAt'] as String? ?? '',
        suggestedActions:
            (json['suggestedActions'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
      );
}

class AppNotification {
  final String? id;
  final String? title;
  final String? message;
  final String? type;
  final bool? read;
  final String? createdAt;
  final String? userId;
  final String? parcelId;

  AppNotification({
    this.id,
    this.title,
    this.message,
    this.type,
    this.read,
    this.createdAt,
    this.userId,
    this.parcelId,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id']?.toString(),
        title: (json['title'] ?? json['subject']) as String?,
        message: json['message'] as String?,
        type: json['type'] as String?,
        read: json['read'] as bool?,
        createdAt: json['createdAt'] as String?,
        userId: json['userId']?.toString(),
        parcelId: json['parcelId']?.toString(),
      );
}
