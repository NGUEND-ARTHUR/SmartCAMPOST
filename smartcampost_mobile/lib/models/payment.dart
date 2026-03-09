class Payment {
  final String id;
  final String? parcelId;
  final String? parcelTrackingRef;
  final double amount;
  final String? currency;
  final String? method;
  final String? status;
  final bool? reversed;
  final String? externalRef;
  final String? timestamp;

  Payment({
    required this.id,
    this.parcelId,
    this.parcelTrackingRef,
    required this.amount,
    this.currency,
    this.method,
    this.status,
    this.reversed,
    this.externalRef,
    this.timestamp,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
    id: json['id']?.toString() ?? '',
    parcelId: json['parcelId']?.toString(),
    parcelTrackingRef: json['parcelTrackingRef'] as String?,
    amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
    currency: json['currency'] as String?,
    method: json['method'] as String?,
    status: json['status'] as String?,
    reversed: json['reversed'] as bool?,
    externalRef: json['externalRef'] as String?,
    timestamp: json['timestamp'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    if (parcelId != null) 'parcelId': parcelId,
    'amount': amount,
    if (currency != null) 'currency': currency,
    if (method != null) 'method': method,
    if (status != null) 'status': status,
    if (externalRef != null) 'externalRef': externalRef,
  };
}
