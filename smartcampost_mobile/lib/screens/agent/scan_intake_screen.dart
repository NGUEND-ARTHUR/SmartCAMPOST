import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/scan_event.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:geolocator/geolocator.dart';

class ScanIntakeScreen extends StatefulWidget {
  const ScanIntakeScreen({super.key});

  @override
  State<ScanIntakeScreen> createState() => _ScanIntakeScreenState();
}

class _ScanIntakeScreenState extends State<ScanIntakeScreen> {
  final MobileScannerController _scanner = MobileScannerController();
  bool _isProcessing = false;
  final List<ScanEvent> _scannedItems = [];
  String? _lastError;
  bool _torchOn = false;

  @override
  void dispose() {
    _scanner.dispose();
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

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty || barcodes.first.rawValue == null) return;

    final code = barcodes.first.rawValue!;
    setState(() {
      _isProcessing = true;
      _lastError = null;
    });

    try {
      // Get GPS position (GPS is mandatory)
      final pos = await _getCurrentPositionOrThrow();
      final lat = pos.latitude;
      final lng = pos.longitude;

      // Verify QR first
      final qrResult = await QrService().verifyQr(code, latitude: lat, longitude: lng);
      final parcelId = qrResult['parcelId'];

      if (parcelId != null) {
        // Create scan event
        final scanEvent = await ScanService().createScanEvent({
          'parcelId': parcelId,
          'eventType': 'AGENT_SCAN_IN',
          'latitude': lat,
          'longitude': lng,
          'locationSource': 'GPS',
        });

        if (mounted) {
          setState(() => _scannedItems.insert(0, scanEvent));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Parcel #$parcelId scanned successfully'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 1),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) setState(() => _lastError = e.toString().replaceAll('Exception: ', ''));
    }
    if (mounted) setState(() => _isProcessing = false);
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('scan_parcel')),
        actions: [
          IconButton(
            icon: Icon(_torchOn ? Icons.flash_off : Icons.flash_on),
            onPressed: () {
              _scanner.toggleTorch();
              setState(() => _torchOn = !_torchOn);
            },
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => _scanner.switchCamera(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Scanner
          SizedBox(
            height: 280,
            child: Stack(
              alignment: Alignment.center,
              children: [
                MobileScanner(controller: _scanner, onDetect: _onDetect),
                Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.accentColor, width: 2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                if (_isProcessing)
                  Container(
                    color: Colors.black38,
                    child: const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
                  ),
              ],
            ),
          ),

          // Error
          if (_lastError != null)
            Container(
              width: double.infinity,
              color: Colors.red.shade50,
              padding: const EdgeInsets.all(8),
              child: Text(
                _lastError!,
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),

          // Scanned items counter
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppTheme.primaryColor.withValues(alpha: 0.05),
            child: Row(
              children: [
                Text(
                  '${tr('scanned')}: ${_scannedItems.length}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                if (_scannedItems.isNotEmpty)
                  TextButton(
                    onPressed: () => setState(() => _scannedItems.clear()),
                    child: Text(context.read<LocaleProvider>().tr('clear')),
                  ),
              ],
            ),
          ),

          // Scanned items list
          Expanded(
            child: _scannedItems.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.qr_code_2,
                          size: 48,
                          color: AppTheme.textTertiary,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          tr('scan_qr_instruction'),
                          style: const TextStyle(color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _scannedItems.length,
                    itemBuilder: (_, i) {
                      final item = _scannedItems[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 2),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Colors.green,
                            child: Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          title: Text('Parcel #${item.parcelId}'),
                          subtitle: Text(item.eventType ?? 'INTAKE'),
                          trailing: Text(
                            item.timestamp ?? '',
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
