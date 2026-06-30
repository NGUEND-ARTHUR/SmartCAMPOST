class PricingDetail {
  final String id;
  final String? parcelId;
  final String? tariffId;
  final String? serviceType;
  final String? originZone;
  final String? destinationZone;
  final String? weightBracket;
  final double? appliedPrice;
  final String? appliedAt;

  PricingDetail({
    required this.id,
    this.parcelId,
    this.tariffId,
    this.serviceType,
    this.originZone,
    this.destinationZone,
    this.weightBracket,
    this.appliedPrice,
    this.appliedAt,
  });

  factory PricingDetail.fromJson(Map<String, dynamic> json) => PricingDetail(
    id: json['id']?.toString() ?? '',
    parcelId: json['parcelId']?.toString(),
    tariffId: json['tariffId']?.toString(),
    serviceType: json['serviceType'] as String?,
    originZone: json['originZone'] as String?,
    destinationZone: json['destinationZone'] as String?,
    weightBracket: json['weightBracket'] as String?,
    appliedPrice: (json['appliedPrice'] as num?)?.toDouble(),
    appliedAt: json['appliedAt'] as String?,
  );
}
