class ParcelMessage {
  final String id;
  final String? parcelId;
  final String? senderAccountId;
  final String? senderRole;
  final String? senderName;
  final String content;
  final String? createdAt;
  final bool mine;
  final bool read;

  ParcelMessage({
    required this.id,
    this.parcelId,
    this.senderAccountId,
    this.senderRole,
    this.senderName,
    required this.content,
    this.createdAt,
    this.mine = false,
    this.read = false,
  });

  factory ParcelMessage.fromJson(Map<String, dynamic> json) => ParcelMessage(
    id: json['id']?.toString() ?? '',
    parcelId: json['parcelId']?.toString(),
    senderAccountId: json['senderAccountId']?.toString(),
    senderRole: json['senderRole'] as String?,
    senderName: json['senderName'] as String?,
    content: json['content'] as String? ?? '',
    createdAt: json['createdAt'] as String?,
    mine: json['mine'] as bool? ?? false,
    read: json['read'] as bool? ?? false,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    if (parcelId != null) 'parcelId': parcelId,
    if (senderAccountId != null) 'senderAccountId': senderAccountId,
    if (senderRole != null) 'senderRole': senderRole,
    if (senderName != null) 'senderName': senderName,
    'content': content,
    if (createdAt != null) 'createdAt': createdAt,
    'mine': mine,
    'read': read,
  };
}
