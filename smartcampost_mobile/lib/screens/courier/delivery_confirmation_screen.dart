import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/parcel.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/delivery_service.dart';
import 'package:smartcampost_mobile/widgets/success_animation.dart';

class DeliveryConfirmationScreen extends StatefulWidget {
  final Parcel parcel;

  const DeliveryConfirmationScreen({super.key, required this.parcel});

  @override
  State<DeliveryConfirmationScreen> createState() =>
      _DeliveryConfirmationScreenState();
}

class _DeliveryConfirmationScreenState
    extends State<DeliveryConfirmationScreen> {
  final _otpController = TextEditingController();
  final _phoneController = TextEditingController();
  final _receiverNameController = TextEditingController();
  final _amountController = TextEditingController();
  XFile? _photo;
  bool _otpSent = false;
  bool _isSending = false;
  bool _isCompleting = false;
  String? _error;

  bool get _isCod =>
      (widget.parcel.paymentOption ?? '').toUpperCase() == 'COD';

  @override
  void initState() {
    super.initState();
    if (_isCod && widget.parcel.lastAppliedPrice != null) {
      _amountController.text = widget.parcel.lastAppliedPrice!
          .toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _otpController.dispose();
    _phoneController.dispose();
    _receiverNameController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<Position> _getCurrentPositionOrThrow() async {
    bool enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw Exception('Location services are disabled. Please enable GPS.');
    }
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied) {
      throw Exception('Location permission denied.');
    }
    if (perm == LocationPermission.deniedForever) {
      throw Exception('Location permission permanently denied. Enable it in settings.');
    }
    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 10),
      ),
    );
  }

  Future<void> _pickPhoto() async {
    try {
      final picked = await ImagePicker().pickImage(
        source: ImageSource.camera,
        maxWidth: 1280,
        imageQuality: 70,
      );
      if (picked != null && mounted) setState(() => _photo = picked);
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (!RegExp(r'^\+?[0-9]{8,15}$').hasMatch(phone)) {
      setState(
        () => _error = context.read<LocaleProvider>().tr('invalid_phone'),
      );
      return;
    }
    setState(() {
      _isSending = true;
      _error = null;
    });
    try {
      final pos = await _getCurrentPositionOrThrow();
      await DeliveryService().sendDeliveryOtp(
        parcelId: widget.parcel.id,
        phoneNumber: phone,
        latitude: pos.latitude,
        longitude: pos.longitude,
      );
      if (mounted) setState(() => _otpSent = true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    }
    if (mounted) setState(() => _isSending = false);
  }

  Future<void> _confirmDelivery() async {
    final code = _otpController.text.trim();
    if (code.length < 4) {
      setState(
        () => _error = context.read<LocaleProvider>().tr('enter_valid_otp'),
      );
      return;
    }
    double? amountCollected;
    if (_isCod) {
      amountCollected = double.tryParse(_amountController.text.trim());
      if (amountCollected == null || amountCollected <= 0) {
        setState(
          () => _error = context.read<LocaleProvider>().tr('enter_valid_amount'),
        );
        return;
      }
    }

    setState(() {
      _isCompleting = true;
      _error = null;
    });
    try {
      final pos = await _getCurrentPositionOrThrow();

      final valid = await DeliveryService().verifyDeliveryOtp(
        parcelId: widget.parcel.id,
        otpCode: code,
        latitude: pos.latitude,
        longitude: pos.longitude,
      );
      if (!valid) {
        if (mounted) {
          setState(
            () => _error = context.read<LocaleProvider>().tr('invalid_otp_code'),
          );
        }
        return;
      }

      String? photoUrl;
      if (_photo != null) {
        final bytes = await File(_photo!.path).readAsBytes();
        photoUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      }

      await DeliveryService().completeDelivery({
        'parcelId': widget.parcel.id,
        'otpCode': code,
        'proofType': photoUrl != null ? 'PHOTO' : 'OTP',
        if (photoUrl != null) 'photoUrl': photoUrl,
        if (_receiverNameController.text.trim().isNotEmpty)
          'receiverName': _receiverNameController.text.trim(),
        'latitude': pos.latitude,
        'longitude': pos.longitude,
        if (_isCod) 'paymentCollected': true,
        if (_isCod) 'amountCollected': amountCollected,
        if (_isCod) 'paymentMethod': 'CASH',
      });

      if (mounted) {
        final confirmMsg = context.read<LocaleProvider>().tr('delivery_confirmed');
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => Dialog(
            backgroundColor: Theme.of(ctx).cardColor,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: SuccessAnimation(
              message: confirmMsg,
              subtitle: widget.parcel.displayRef,
              onDone: () {
                Navigator.pop(ctx);
                Navigator.pop(context, true);
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    }
    if (mounted) setState(() => _isCompleting = false);
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('confirm_delivery'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Parcel info card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.parcel.displayRef,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (widget.parcel.recipientLabel != null)
                      _InfoRow(
                        label: tr('recipient'),
                        value: widget.parcel.recipientLabel!,
                      ),
                    if (widget.parcel.destinationAgencyName != null)
                      _InfoRow(
                        label: tr('destination'),
                        value: widget.parcel.destinationAgencyName!,
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // OTP Flow
            Text(
              tr('delivery_otp_instruction'),
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),

            if (!_otpSent) ...[
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: tr('recipient_phone'),
                  hintText: '+237...',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.phone),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSending ? null : _sendOtp,
                  icon: _isSending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.sms),
                  label: Text(_isSending ? tr('sending') : tr('send_otp')),
                ),
              ),
            ],

            if (_otpSent) ...[
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
              const SizedBox(height: 16),

              TextField(
                controller: _receiverNameController,
                decoration: InputDecoration(
                  labelText: tr('receiver_name_optional'),
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 16),

              Text(
                tr('proof_photo_optional'),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 8),
              if (_photo != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(_photo!.path),
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _pickPhoto,
                icon: const Icon(Icons.camera_alt_outlined),
                label: Text(_photo == null ? tr('take_photo') : tr('retake_photo')),
              ),

              if (_isCod) ...[
                const SizedBox(height: 16),
                TextField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: tr('amount_collected_xaf'),
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.payments_outlined),
                  ),
                ),
              ],

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isCompleting ? null : _confirmDelivery,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentColor,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: _isCompleting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.check_circle),
                  label: Text(
                    _isCompleting ? tr('verifying') : tr('confirm_delivery'),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _isSending ? null : _sendOtp,
                child: Text(tr('resend_otp')),
              ),
            ],

            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
