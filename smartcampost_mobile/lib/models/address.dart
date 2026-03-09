class Address {
  final String? id;
  final String? label;
  final String? line1;
  final String? street;
  final String? city;
  final String? region;
  final String? postcode;
  final String? country;
  final double? latitude;
  final double? longitude;

  Address({
    this.id,
    this.label,
    this.line1,
    this.street,
    this.city,
    this.region,
    this.postcode,
    this.country,
    this.latitude,
    this.longitude,
  });

  String get displayAddress {
    final parts = [
      line1 ?? street,
      city,
      region,
      country,
    ].where((p) => p != null && p.isNotEmpty).toList();
    return parts.join(', ');
  }

  factory Address.fromJson(Map<String, dynamic> json) => Address(
    id: json['id']?.toString(),
    label: json['label'] as String?,
    line1: json['line1'] as String?,
    street: json['street'] as String?,
    city: json['city'] as String?,
    region: json['region'] as String?,
    postcode: json['postcode'] as String?,
    country: json['country'] as String?,
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
  );

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    if (label != null) 'label': label,
    if (line1 != null) 'line1': line1,
    if (street != null) 'street': street,
    if (city != null) 'city': city,
    if (region != null) 'region': region,
    if (postcode != null) 'postcode': postcode,
    if (country != null) 'country': country,
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
  };
}
