class ScanEvent {
  final String id;
  final String? timestamp;
  final String? eventType;
  final String? parcelId;
  final String? agencyId;
  final String? agencyName;
  final String? agentId;
  final String? agentName;
  final String? actorId;
  final String? actorRole;
  final double? latitude;
  final double? longitude;
  final String? locationNote;
  final String? locationSource;
  final String? comment;
  final String? proofPhotoUrl;
  final bool? synced;

  ScanEvent({
    required this.id,
    this.timestamp,
    this.eventType,
    this.parcelId,
    this.agencyId,
    this.agencyName,
    this.agentId,
    this.agentName,
    this.actorId,
    this.actorRole,
    this.latitude,
    this.longitude,
    this.locationNote,
    this.locationSource,
    this.comment,
    this.proofPhotoUrl,
    this.synced,
  });

  factory ScanEvent.fromJson(Map<String, dynamic> json) => ScanEvent(
    id: json['id']?.toString() ?? '',
    timestamp: json['timestamp'] as String?,
    eventType: json['eventType'] as String?,
    parcelId: json['parcelId']?.toString(),
    agencyId: json['agencyId']?.toString(),
    agencyName: json['agencyName'] as String?,
    agentId: json['agentId']?.toString(),
    agentName: json['agentName'] as String?,
    actorId: json['actorId']?.toString(),
    actorRole: json['actorRole'] as String?,
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
    locationNote: json['locationNote'] as String?,
    locationSource: json['locationSource'] as String?,
    comment: json['comment'] as String?,
    proofPhotoUrl: json['proofPhotoUrl'] as String?,
    synced: json['synced'] as bool?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    if (timestamp != null) 'timestamp': timestamp,
    if (eventType != null) 'eventType': eventType,
    if (parcelId != null) 'parcelId': parcelId,
    if (agencyId != null) 'agencyId': agencyId,
    if (agentId != null) 'agentId': agentId,
    if (actorId != null) 'actorId': actorId,
    if (actorRole != null) 'actorRole': actorRole,
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
    if (locationNote != null) 'locationNote': locationNote,
    if (locationSource != null) 'locationSource': locationSource,
    if (comment != null) 'comment': comment,
    if (proofPhotoUrl != null) 'proofPhotoUrl': proofPhotoUrl,
    if (synced != null) 'synced': synced,
  };
}
