import 'package:flutter/material.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;
  String get userRole => _user?.role ?? '';

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();
    try {
      final loggedIn = await _authService.isLoggedIn();
      if (loggedIn) {
        _user = await _authService.getCurrentUser();
        _isAuthenticated = _user != null;
      }
    } catch (_) {
      _isAuthenticated = false;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login({required String phone, required String password}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final auth = await _authService.login(phone: phone, password: password);
      _user = auth.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(RegisterRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _authService.register(request);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> requestOtp({required String phone}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _authService.requestOtp(phone: phone);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> confirmOtp({required String phone, required String otp}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final auth = await _authService.confirmOtp(phone: phone, otp: otp);
      _user = auth.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final auth = await _authService.loginWithGoogle();
      _user = auth.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _isAuthenticated = false;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  String _extractError(dynamic e) {
    if (e is Exception) {
      return e.toString().replaceAll('Exception: ', '');
    }
    return 'An unexpected error occurred';
  }
}
