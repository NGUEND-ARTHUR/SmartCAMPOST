import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _otpSent = false;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _error;
  String? _success;

  final _phoneRegex = RegExp(r'^\+?[0-9]{8,15}$');
  final _passwordRegex = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)');

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final phone = _phoneController.text.trim();
    if (!_phoneRegex.hasMatch(phone)) {
      setState(
        () => _error = context.read<LocaleProvider>().tr('invalid_phone'),
      );
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await AuthService().requestPasswordReset(phone: phone);
      if (mounted) {
        setState(() {
          _otpSent = true;
          _success = context.read<LocaleProvider>().tr('otp_sent');
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _resetPassword() async {
    final tr = context.read<LocaleProvider>().tr;
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (otp.length != 6) {
      setState(() => _error = tr('enter_valid_otp'));
      return;
    }
    if (password.length < 8) {
      setState(() => _error = tr('password_min_length'));
      return;
    }
    if (!_passwordRegex.hasMatch(password)) {
      setState(() => _error = tr('password_complexity'));
      return;
    }
    if (password != confirm) {
      setState(() => _error = tr('passwords_do_not_match'));
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await AuthService().confirmPasswordReset(
        phone: phone,
        otp: otp,
        newPassword: password,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tr('password_reset_success')),
            backgroundColor: Colors.green,
          ),
        );
        context.go('/login');
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('forgot_password'))),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(Icons.lock_reset, size: 64, color: AppTheme.primaryColor),
                const SizedBox(height: 16),
                Text(
                  tr('reset_password_instruction'),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 24),

                // Phone field (always visible)
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  enabled: !_otpSent,
                  decoration: InputDecoration(
                    labelText: tr('phone'),
                    hintText: '+237...',
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.phone),
                  ),
                ),
                const SizedBox(height: 16),

                if (!_otpSent) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _requestOtp,
                      icon: _isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.sms),
                      label: Text(_isLoading ? tr('sending') : tr('send_otp')),
                    ),
                  ),
                ],

                if (_otpSent) ...[
                  // OTP field
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    decoration: InputDecoration(
                      labelText: tr('enter_otp'),
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.lock_outline),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // New password
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: tr('new_password'),
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Confirm password
                  TextField(
                    controller: _confirmController,
                    obscureText: _obscureConfirm,
                    decoration: InputDecoration(
                      labelText: tr('confirm_password'),
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirm
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () =>
                            setState(() => _obscureConfirm = !_obscureConfirm),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _resetPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(tr('reset_password')),
                    ),
                  ),
                  const SizedBox(height: 8),

                  TextButton(
                    onPressed: _isLoading ? null : _requestOtp,
                    child: Text(tr('resend_otp')),
                  ),
                ],

                if (_success != null && _error == null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _success!,
                    style: const TextStyle(color: Colors.green),
                    textAlign: TextAlign.center,
                  ),
                ],

                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
