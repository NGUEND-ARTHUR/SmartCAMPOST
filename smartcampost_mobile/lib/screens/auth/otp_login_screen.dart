import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';

class OtpLoginScreen extends StatefulWidget {
  const OtpLoginScreen({super.key});

  @override
  State<OtpLoginScreen> createState() => _OtpLoginScreenState();
}

class _OtpLoginScreenState extends State<OtpLoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) return;
    if (!RegExp(r'^\+?[0-9]{8,15}$').hasMatch(phone)) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.requestOtp(phone: phone);
    if (success && mounted) {
      setState(() => _otpSent = true);
    }
  }

  Future<void> _confirmOtp() async {
    if (_otpController.text.trim().isEmpty) return;
    final auth = context.read<AuthProvider>();
    await auth.confirmOtp(
      phone: _phoneController.text.trim(),
      otp: _otpController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('login_with_otp'))),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),
              Icon(Icons.phone_android, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                _otpSent ? tr('enter_otp') : tr('enter_phone_for_otp'),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 32),
              if (!_otpSent) ...[
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: tr('phone'),
                    prefixIcon: const Icon(Icons.phone_outlined),
                    hintText: '+237...',
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: auth.isLoading ? null : _requestOtp,
                    child: auth.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(tr('send_otp')),
                  ),
                ),
              ] else ...[
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: InputDecoration(
                    labelText: tr('otp_code'),
                    prefixIcon: const Icon(Icons.pin_outlined),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: auth.isLoading ? null : _confirmOtp,
                    child: auth.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(tr('verify')),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: auth.isLoading ? null : _requestOtp,
                  child: Text(tr('resend_otp')),
                ),
              ],
              if (auth.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    auth.error!,
                    style: TextStyle(color: Colors.red[700]),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
