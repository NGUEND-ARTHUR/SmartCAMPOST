import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';

class FailedDeliveryScreen extends StatefulWidget {
  const FailedDeliveryScreen({super.key});

  @override
  State<FailedDeliveryScreen> createState() => _FailedDeliveryScreenState();
}

class _FailedDeliveryScreenState extends State<FailedDeliveryScreen> {
  final _parcelIdCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _reason = 'CLIENT_ABSENT';
  XFile? _photo;
  Position? _gps;
  bool _busy = false;
  bool _submitted = false;

  static const _reasons = [
    'CLIENT_ABSENT',
    'WRONG_ADDRESS',
    'REFUSED',
    'DAMAGED',
    'ACCESS_DENIED',
    'OTHER',
  ];

  @override
  void initState() {
    super.initState();
    _detectGps();
  }

  Future<void> _detectGps() async {
    try {
      final perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 10)),
      );
      if (mounted) setState(() => _gps = pos);
    } catch (_) {}
  }

  Future<void> _pickPhoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.camera, maxWidth: 1280, imageQuality: 70);
    if (picked != null && mounted) setState(() => _photo = picked);
  }

  Future<void> _pickFromGallery() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1280, imageQuality: 70);
    if (picked != null && mounted) setState(() => _photo = picked);
  }

  Future<void> _submit() async {
    if (_parcelIdCtrl.text.trim().isEmpty) return;
    setState(() => _busy = true);

    String? photoUrl;
    if (_photo != null) {
      final bytes = await File(_photo!.path).readAsBytes();
      photoUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
    }

    try {
      await ApiClient().post('/delivery/failed', data: {
        'parcelId': _parcelIdCtrl.text.trim(),
        'reason': _reason,
        if (photoUrl != null) 'photoUrl': photoUrl,
        'latitude': _gps?.latitude ?? 0,
        'longitude': _gps?.longitude ?? 0,
        'notes': _notesCtrl.text.trim(),
      });
      if (mounted) setState(() => _submitted = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  void dispose() {
    _parcelIdCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('failed_delivery_report'))),
      body: _submitted
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, size: 64, color: AppTheme.successColor),
                  const SizedBox(height: 16),
                  const Text('Report submitted', style: AppTheme.heading3),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(tr('back')),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _parcelIdCtrl,
                    decoration: InputDecoration(
                      labelText: '${tr('parcel_id')} / ${tr('track')}',
                      prefixIcon: const Icon(Icons.qr_code),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Text(tr('reason'), style: AppTheme.heading4),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: _reason,
                    decoration: const InputDecoration(prefixIcon: Icon(Icons.report_problem_outlined)),
                    items: _reasons.map((r) => DropdownMenuItem(value: r, child: Text(r.replaceAll('_', ' ')))).toList(),
                    onChanged: (v) => setState(() => _reason = v!),
                  ),
                  const SizedBox(height: 16),

                  const Text('Photo proof', style: AppTheme.heading4),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (_photo != null)
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(File(_photo!.path), width: 80, height: 80, fit: BoxFit.cover),
                            ),
                            Positioned(
                              top: -4,
                              right: -4,
                              child: GestureDetector(
                                onTap: () => setState(() => _photo = null),
                                child: Container(
                                  width: 20, height: 20,
                                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, size: 14, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        )
                      else ...[
                        OutlinedButton.icon(
                          onPressed: _pickPhoto,
                          icon: const Icon(Icons.camera_alt, size: 18),
                          label: const Text('Camera'),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          onPressed: _pickFromGallery,
                          icon: const Icon(Icons.photo_library, size: 18),
                          label: const Text('Gallery'),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),

                  const Text('GPS Location', style: AppTheme.heading4),
                  const SizedBox(height: 4),
                  Text(
                    _gps != null ? '${_gps!.latitude.toStringAsFixed(6)}, ${_gps!.longitude.toStringAsFixed(6)} (auto-detected)' : 'Detecting...',
                    style: AppTheme.caption,
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _notesCtrl,
                    maxLines: 3,
                    decoration: InputDecoration(labelText: tr('description'), alignLabelWithHint: true),
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _busy ? null : _submit,
                      icon: _busy
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.send),
                      label: Text(_busy ? tr('sending') : tr('submit_report')),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
