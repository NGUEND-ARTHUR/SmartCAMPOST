class User {
  final String id;
  final String? fullName;
  final String? name;
  final String? email;
  final String? phone;
  final String role;
  final String? preferredLanguage;
  final String? agencyId;
  final String? agencyName;
  final bool? active;
  final String? createdAt;

  User({
    required this.id,
    this.fullName,
    this.name,
    this.email,
    this.phone,
    required this.role,
    this.preferredLanguage,
    this.agencyId,
    this.agencyName,
    this.active,
    this.createdAt,
  });

  String get displayName => fullName ?? name ?? email ?? phone ?? 'Unknown';

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id']?.toString() ?? '',
    fullName: json['fullName'] as String?,
    name: json['name'] as String?,
    email: json['email'] as String?,
    phone: json['phone'] as String?,
    role: json['role'] as String? ?? 'CLIENT',
    preferredLanguage: json['preferredLanguage'] as String?,
    agencyId: json['agencyId']?.toString(),
    agencyName: json['agencyName'] as String?,
    active: json['active'] as bool?,
    createdAt: json['createdAt'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'fullName': fullName,
    'name': name,
    'email': email,
    'phone': phone,
    'role': role,
    'preferredLanguage': preferredLanguage,
    'agencyId': agencyId,
    'agencyName': agencyName,
    'active': active,
    'createdAt': createdAt,
  };
}

class AuthResponse {
  final String accessToken;
  final User user;

  AuthResponse({required this.accessToken, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    // The backend returns user fields flat alongside the token
    final user = json.containsKey('user')
        ? User.fromJson(json['user'] as Map<String, dynamic>)
        : User(
            id: (json['userId'] ?? json['entityId'] ?? '').toString(),
            fullName: json['fullName'] as String?,
            phone: json['phone'] as String?,
            email: json['email'] as String?,
            role: json['role'] as String? ?? 'CLIENT',
          );
    return AuthResponse(
      accessToken:
          json['accessToken'] as String? ?? json['token'] as String? ?? '',
      user: user,
    );
  }
}

class RegisterRequest {
  final String fullName;
  final String phone;
  final String? email;
  final String password;
  final String? preferredLanguage;
  final String? otp;

  RegisterRequest({
    required this.fullName,
    required this.phone,
    this.email,
    required this.password,
    this.preferredLanguage,
    this.otp,
  });

  Map<String, dynamic> toJson() => {
    'fullName': fullName,
    'phone': phone,
    if (email != null) 'email': email,
    'password': password,
    if (preferredLanguage != null) 'preferredLanguage': preferredLanguage,
    if (otp != null) 'otp': otp,
  };
}
