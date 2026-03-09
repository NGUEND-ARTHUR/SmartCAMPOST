class Parcel {
  final String id;
  final String? trackingNumber;
  final String? trackingRef;
  final String? status;
  final bool? locked;
  final String? qrStatus;
  final String? finalQrCode;
  final String? partialQrCode;
  final double? weight;
  final String? dimensions;
  final double? declaredValue;
  final bool? fragile;
  final String? serviceType;
  final String? deliveryOption;
  final String? paymentOption;
  final String? descriptionComment;
  final String? expectedDeliveryAt;
  final String? createdAt;
  final String? senderAddressId;
  final String? senderLabel;
  final String? senderCity;
  final String? senderRegion;
  final String? senderCountry;
  final String? recipientAddressId;
  final String? recipientLabel;
  final String? recipientCity;
  final String? recipientRegion;
  final String? recipientCountry;
  final String? clientName;
  final String? clientId;
  final String? originAgencyId;
  final String? originAgencyName;
  final String? destinationAgencyId;
  final String? destinationAgencyName;
  final String? photoUrl;
  final double? creationLatitude;
  final double? creationLongitude;
  final double? currentLatitude;
  final double? currentLongitude;
  final String? locationUpdatedAt;
  final String? locationMode;
  final double? validatedWeight;
  final String? validatedDimensions;
  final String? validationComment;
  final bool? descriptionConfirmed;
  final String? validatedAt;
  final String? validatedByStaffId;
  final String? validatedByStaffName;
  final double? lastAppliedPrice;

  Parcel({
    required this.id,
    this.trackingNumber,
    this.trackingRef,
    this.status,
    this.locked,
    this.qrStatus,
    this.finalQrCode,
    this.partialQrCode,
    this.weight,
    this.dimensions,
    this.declaredValue,
    this.fragile,
    this.serviceType,
    this.deliveryOption,
    this.paymentOption,
    this.descriptionComment,
    this.expectedDeliveryAt,
    this.createdAt,
    this.senderAddressId,
    this.senderLabel,
    this.senderCity,
    this.senderRegion,
    this.senderCountry,
    this.recipientAddressId,
    this.recipientLabel,
    this.recipientCity,
    this.recipientRegion,
    this.recipientCountry,
    this.clientName,
    this.clientId,
    this.originAgencyId,
    this.originAgencyName,
    this.destinationAgencyId,
    this.destinationAgencyName,
    this.photoUrl,
    this.creationLatitude,
    this.creationLongitude,
    this.currentLatitude,
    this.currentLongitude,
    this.locationUpdatedAt,
    this.locationMode,
    this.validatedWeight,
    this.validatedDimensions,
    this.validationComment,
    this.descriptionConfirmed,
    this.validatedAt,
    this.validatedByStaffId,
    this.validatedByStaffName,
    this.lastAppliedPrice,
  });

  String get displayRef => trackingRef ?? trackingNumber ?? id;

  factory Parcel.fromJson(Map<String, dynamic> json) => Parcel(
    id: json['id']?.toString() ?? '',
    trackingNumber: json['trackingNumber'] as String?,
    trackingRef: json['trackingRef'] as String?,
    status: json['status'] as String?,
    locked: json['locked'] as bool?,
    qrStatus: json['qrStatus'] as String?,
    finalQrCode: json['finalQrCode'] as String?,
    partialQrCode: json['partialQrCode'] as String?,
    weight: (json['weight'] as num?)?.toDouble(),
    dimensions: json['dimensions'] as String?,
    declaredValue: (json['declaredValue'] as num?)?.toDouble(),
    fragile: json['fragile'] as bool?,
    serviceType: json['serviceType'] as String?,
    deliveryOption: json['deliveryOption'] as String?,
    paymentOption: json['paymentOption'] as String?,
    descriptionComment: json['descriptionComment'] as String?,
    expectedDeliveryAt: json['expectedDeliveryAt'] as String?,
    createdAt: json['createdAt'] as String?,
    senderAddressId: json['senderAddressId']?.toString(),
    senderLabel: json['senderLabel'] as String?,
    senderCity: json['senderCity'] as String?,
    senderRegion: json['senderRegion'] as String?,
    senderCountry: json['senderCountry'] as String?,
    recipientAddressId: json['recipientAddressId']?.toString(),
    recipientLabel: json['recipientLabel'] as String?,
    recipientCity: json['recipientCity'] as String?,
    recipientRegion: json['recipientRegion'] as String?,
    recipientCountry: json['recipientCountry'] as String?,
    clientName: json['clientName'] as String?,
    clientId: json['clientId']?.toString(),
    originAgencyId: json['originAgencyId']?.toString(),
    originAgencyName: json['originAgencyName'] as String?,
    destinationAgencyId: json['destinationAgencyId']?.toString(),
    destinationAgencyName: json['destinationAgencyName'] as String?,
    photoUrl: json['photoUrl'] as String?,
    creationLatitude: (json['creationLatitude'] as num?)?.toDouble(),
    creationLongitude: (json['creationLongitude'] as num?)?.toDouble(),
    currentLatitude: (json['currentLatitude'] as num?)?.toDouble(),
    currentLongitude: (json['currentLongitude'] as num?)?.toDouble(),
    locationUpdatedAt: json['locationUpdatedAt'] as String?,
    locationMode: json['locationMode'] as String?,
    validatedWeight: (json['validatedWeight'] as num?)?.toDouble(),
    validatedDimensions: json['validatedDimensions'] as String?,
    validationComment: json['validationComment'] as String?,
    descriptionConfirmed: json['descriptionConfirmed'] as bool?,
    validatedAt: json['validatedAt'] as String?,
    validatedByStaffId: json['validatedByStaffId']?.toString(),
    validatedByStaffName: json['validatedByStaffName'] as String?,
    lastAppliedPrice: (json['lastAppliedPrice'] as num?)?.toDouble(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    if (trackingNumber != null) 'trackingNumber': trackingNumber,
    if (trackingRef != null) 'trackingRef': trackingRef,
    if (status != null) 'status': status,
    if (locked != null) 'locked': locked,
    if (weight != null) 'weight': weight,
    if (dimensions != null) 'dimensions': dimensions,
    if (declaredValue != null) 'declaredValue': declaredValue,
    if (fragile != null) 'fragile': fragile,
    if (serviceType != null) 'serviceType': serviceType,
    if (deliveryOption != null) 'deliveryOption': deliveryOption,
    if (paymentOption != null) 'paymentOption': paymentOption,
    if (descriptionComment != null) 'descriptionComment': descriptionComment,
    if (senderAddressId != null) 'senderAddressId': senderAddressId,
    if (recipientAddressId != null) 'recipientAddressId': recipientAddressId,
    if (clientId != null) 'clientId': clientId,
    if (originAgencyId != null) 'originAgencyId': originAgencyId,
    if (destinationAgencyId != null) 'destinationAgencyId': destinationAgencyId,
    if (photoUrl != null) 'photoUrl': photoUrl,
    if (creationLatitude != null) 'creationLatitude': creationLatitude,
    if (creationLongitude != null) 'creationLongitude': creationLongitude,
  };
}
