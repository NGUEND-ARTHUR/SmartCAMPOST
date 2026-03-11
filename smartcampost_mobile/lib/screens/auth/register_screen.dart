import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final request = RegisterRequest(
      fullName: _fullNameController.text.trim(),
      phone: _phoneController.text.trim(),
      email: _emailController.text.trim().isEmpty
          ? null
          : _emailController.text.trim(),
      password: _passwordController.text,
      preferredLanguage: context.read<LocaleProvider>().locale.languageCode,
    );

    final success = await auth.register(request);
    if (success && mounted) {
      final tr = context.read<LocaleProvider>().tr;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(tr('registration_success'))));
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('register'))),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _fullNameController,
                  decoration: InputDecoration(
                    labelText: tr('full_name'),
                    prefixIcon: const Icon(Icons.person_outline),
                  ),
                  validator: (v) => v == null || v.trim().isEmpty
                      ? tr('field_required')
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: tr('phone'),
                    prefixIcon: const Icon(Icons.phone_outlined),
                    hintText: '+237...',
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return tr('field_required');
                    }
                    if (!RegExp(r'^\+?[0-9]{8,15}$').hasMatch(v.trim())) {
                      return tr('invalid_phone');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: '${tr('email')} (${tr('optional')})',
                    prefixIcon: const Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: tr('password'),
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return tr('field_required');
                    if (v.length < 8) return 'Minimum 8 characters';
                    if (!RegExp(
                      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)',
                    ).hasMatch(v)) {
                      return 'Must contain uppercase, lowercase, and digit';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: tr('confirm_password'),
                    prefixIcon: const Icon(Icons.lock_outline),
                  ),
                  validator: (v) {
                    if (v != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                if (auth.error != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      auth.error!,
                      style: TextStyle(color: Colors.red[700]),
                    ),
                  ),
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleRegister,
                    child: auth.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(tr('register')),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
