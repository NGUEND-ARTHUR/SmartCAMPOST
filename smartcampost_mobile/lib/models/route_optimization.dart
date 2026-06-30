class CourierStop {
  final String parcelId;
  final String? trackingRef;
  final String? status;
  final String type; // PICKUP | DELIVERY
  final String? address;
  final String? city;
  final double? latitude;
  final double? longitude;
  final String? contactName;
  final String? contactPhone;

  CourierStop({
    required this.parcelId,
    this.trackingRef,
    this.status,
    required this.type,
    this.address,
    this.city,
    this.latitude,
    this.longitude,
    this.contactName,
    this.contactPhone,
  });

  factory CourierStop.fromJson(Map<String, dynamic> json) => CourierStop(
    parcelId: json['parcelId']?.toString() ?? '',
    trackingRef: json['trackingRef'] as String?,
    status: json['status'] as String?,
    type: json['type'] as String? ?? 'DELIVERY',
    address: json['address'] as String?,
    city: json['city'] as String?,
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
    contactName: json['contactName'] as String?,
    contactPhone: json['contactPhone'] as String?,
  );
}

class CourierMapResponse {
  final List<CourierStop> pickupStops;
  final List<CourierStop> deliveryStops;

  CourierMapResponse({this.pickupStops = const [], this.deliveryStops = const []});

  factory CourierMapResponse.fromJson(Map<String, dynamic> json) => CourierMapResponse(
    pickupStops: (json['pickupStops'] as List<dynamic>?)
            ?.map((e) => CourierStop.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
    deliveryStops: (json['deliveryStops'] as List<dynamic>?)
            ?.map((e) => CourierStop.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
  );
}

class RouteOptimizationStop {
  final String id;
  final String type; // PICKUP | DELIVERY | DEPOT
  final double latitude;
  final double longitude;
  final String? address;
  final int? priority;
  final String? timeWindow;

  RouteOptimizationStop({
    required this.id,
    required this.type,
    required this.latitude,
    required this.longitude,
    this.address,
    this.priority,
    this.timeWindow,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'latitude': latitude,
    'longitude': longitude,
    if (address != null) 'address': address,
    if (priority != null) 'priority': priority,
    if (timeWindow != null) 'timeWindow': timeWindow,
  };
}

class OptimizedStopResponse {
  final int order;
  final String? stopId;
  final String? type;
  final String? address;
  final double? latitude;
  final double? longitude;
  final double? etaMinutes;
  final String? arrivalTime;
  final double? distanceFromPrevious;

  OptimizedStopResponse({
    required this.order,
    this.stopId,
    this.type,
    this.address,
    this.latitude,
    this.longitude,
    this.etaMinutes,
    this.arrivalTime,
    this.distanceFromPrevious,
  });

  factory OptimizedStopResponse.fromJson(Map<String, dynamic> json) => OptimizedStopResponse(
    order: (json['order'] as num?)?.toInt() ?? 0,
    stopId: json['stopId']?.toString(),
    type: json['type'] as String?,
    address: json['address'] as String?,
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
    etaMinutes: (json['etaMinutes'] as num?)?.toDouble(),
    arrivalTime: json['arrivalTime'] as String?,
    distanceFromPrevious: (json['distanceFromPrevious'] as num?)?.toDouble(),
  );
}

class RouteOptimizationResult {
  final List<OptimizedStopResponse> optimizedRoute;
  final double? totalDistanceKm;
  final double? estimatedDurationMinutes;
  final double? fuelSavingsPercent;
  final String? optimizationStrategy;

  RouteOptimizationResult({
    this.optimizedRoute = const [],
    this.totalDistanceKm,
    this.estimatedDurationMinutes,
    this.fuelSavingsPercent,
    this.optimizationStrategy,
  });

  factory RouteOptimizationResult.fromJson(Map<String, dynamic> json) => RouteOptimizationResult(
    optimizedRoute: (json['optimizedRoute'] as List<dynamic>?)
            ?.map((e) => OptimizedStopResponse.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
    totalDistanceKm: (json['totalDistanceKm'] as num?)?.toDouble(),
    estimatedDurationMinutes: (json['estimatedDurationMinutes'] as num?)?.toDouble(),
    fuelSavingsPercent: (json['fuelSavingsPercent'] as num?)?.toDouble(),
    optimizationStrategy: json['optimizationStrategy'] as String?,
  );
}
