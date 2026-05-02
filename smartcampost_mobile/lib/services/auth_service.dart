import 'package:google_sign_in/google_sign_in.dart';
import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/services/auth_storage.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  final AuthStorage _storage = AuthStorage();
  static const String _defaultGoogleClientId =
      '428837425425-hvbdljimv02i2kapehk51haap4160v68.apps.googleusercontent.com';
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email'],
    serverClientId: String.fromEnvironment(
      'GOOGLE_CLIENT_ID',
      defaultValue: _defaultGoogleClientId,
    ),
  );

  Future<AuthResponse> login({
    required String phone,
    required String password,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'phone': phone, 'password': password},
    );
    final auth = AuthResponse.fromJson(data);
    await _storage.saveToken(auth.accessToken);
    await _storage.saveUser(auth.user.toJson());
    return auth;
  }

  Future<void> register(RegisterRequest request) async {
    await _api.post('/auth/register', data: request.toJson());
  }

  Future<void> requestOtp({required String phone}) async {
    await _api.post('/auth/login/otp/request', data: {'phone': phone});
  }

  Future<AuthResponse> confirmOtp({
    required String phone,
    required String otp,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/auth/login/otp/confirm',
      data: {'phone': phone, 'otp': otp},
    );
    final auth = AuthResponse.fromJson(data);
    await _storage.saveToken(auth.accessToken);
    await _storage.saveUser(auth.user.toJson());
    return auth;
  }

  Future<AuthResponse> loginWithGoogle() async {
    final account = await _googleSignIn.signIn();
    if (account == null) {
      throw Exception('Google sign-in cancelled');
    }
    final authentication = await account.authentication;
    final idToken = authentication.idToken;
    if (idToken == null) {
      throw Exception('Failed to get Google ID token');
    }
    final data = await _api.post<Map<String, dynamic>>(
      '/auth/google',
      data: {'idToken': idToken},
    );
    final auth = AuthResponse.fromJson(data);
    await _storage.saveToken(auth.accessToken);
    await _storage.saveUser(auth.user.toJson());
    return auth;
  }

  Future<void> sendOtp({required String phone}) async {
    await _api.post('/auth/send-otp', data: {'phone': phone});
  }

  Future<void> verifyOtp({required String phone, required String otp}) async {
    await _api.post('/auth/verify-otp', data: {'phone': phone, 'otp': otp});
  }

  Future<void> requestPasswordReset({required String phone}) async {
    await _api.post('/auth/password/reset/request', data: {'phone': phone});
  }

  Future<void> confirmPasswordReset({
    required String phone,
    required String otp,
    required String newPassword,
  }) async {
    await _api.post(
      '/auth/password/reset/confirm',
      data: {'phone': phone, 'otp': otp, 'newPassword': newPassword},
    );
  }

  Future<void> logout() async {
    await _storage.clear();
  }

  Future<User?> getCurrentUser() async {
    final userData = await _storage.getUser();
    if (userData != null) return User.fromJson(userData);
    return null;
  }

  Future<bool> isLoggedIn() async {
    return await _storage.hasToken();
  }
}
