import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ParcelTrackingMapScreen extends StatefulWidget {
  final String parcelId;
  final String? trackingRef;

  const ParcelTrackingMapScreen({
    super.key,
    required this.parcelId,
    this.trackingRef,
  });

  @override
  State<ParcelTrackingMapScreen> createState() => _ParcelTrackingMapScreenState();
}

class _ParcelTrackingMapScreenState extends State<ParcelTrackingMapScreen> {
  final MapController _mapController = MapController();
  final ApiClient _api = ApiClient();
  Timer? _refreshTimer;
  List<LatLng> _routePoints = [];
  LatLng? _courierPosition;
  LatLng? _destinationPosition;
  String? _eta;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTrackingData();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadTrackingData());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadTrackingData() async {
    try {
      final data = await _api.get<Map<String, dynamic>>('/parcels/${widget.parcelId}');

      final List<LatLng> points = [];

      if (data['senderAddress'] is Map) {
        final sender = data['senderAddress'] as Map;
        final lat = _toDouble(sender['latitude']);
        final lng = _toDouble(sender['longitude']);
        if (lat != null && lng != null) points.add(LatLng(lat, lng));
      }

      if (data['recipientAddress'] is Map) {
        final recipient = data['recipientAddress'] as Map;
        final lat = _toDouble(recipient['latitude']);
        final lng = _toDouble(recipient['longitude']);
        if (lat != null && lng != null) {
          _destinationPosition = LatLng(lat, lng);
          points.add(_destinationPosition!);
        }
      }

      // Try to fetch courier location
      try {
        final locations = await _api.get<dynamic>('/logistics/positions/latest');
        if (locations is List && locations.isNotEmpty) {
          final loc = locations.first;
          final lat = _toDouble(loc['latitude']);
          final lng = _toDouble(loc['longitude']);
          if (lat != null && lng != null) {
            _courierPosition = LatLng(lat, lng);
            points.add(_courierPosition!);
          }
        }
      } catch (_) {}

      _eta = data['expectedDeliveryAt'] as String?;

      if (mounted) {
        setState(() {
          _routePoints = points;
          _isLoading = false;
        });
        if (points.isNotEmpty) {
          _mapController.fitCamera(CameraFit.coordinates(coordinates: points, padding: const EdgeInsets.all(50)));
        }
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.trackingRef ?? tr('tracking')),
      ),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
              ? ErrorRetryWidget(message: _error!, onRetry: _loadTrackingData)
              : Stack(
                  children: [
                    // Map
                    FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: _courierPosition ?? _destinationPosition ?? const LatLng(5.95, 10.15),
                        initialZoom: 12,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.smartcampost.mobile',
                        ),
                        if (_routePoints.length >= 2)
                          PolylineLayer(
                            polylines: [
                              Polyline(
                                points: _routePoints,
                                strokeWidth: 3,
                                color: AppTheme.primaryColor.withValues(alpha: 0.6),
                              ),
                            ],
                          ),
                        MarkerLayer(
                          markers: [
                            if (_routePoints.isNotEmpty)
                              Marker(
                                point: _routePoints.first,
                                width: 36,
                                height: 36,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: const Icon(Icons.store, color: Colors.white, size: 18),
                                ),
                              ),
                            if (_destinationPosition != null)
                              Marker(
                                point: _destinationPosition!,
                                width: 36,
                                height: 36,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppTheme.successColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: const Icon(Icons.flag, color: Colors.white, size: 18),
                                ),
                              ),
                            if (_courierPosition != null)
                              Marker(
                                point: _courierPosition!,
                                width: 40,
                                height: 40,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppTheme.accentColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3),
                                    boxShadow: [
                                      BoxShadow(color: AppTheme.accentColor.withValues(alpha: 0.4), blurRadius: 10, spreadRadius: 2),
                                    ],
                                  ),
                                  child: const Icon(Icons.delivery_dining, color: Colors.white, size: 20),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),

                    // Bottom info card
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 16 + MediaQuery.of(context).padding.bottom,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderColor),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: _courierPosition != null
                                    ? AppTheme.accentColor.withValues(alpha: 0.1)
                                    : AppTheme.surfaceElevated,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                _courierPosition != null ? Icons.delivery_dining : Icons.search,
                                color: _courierPosition != null ? AppTheme.accentColor : AppTheme.textTertiary,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _courierPosition != null ? tr('in_transit') : tr('pending'),
                                    style: AppTheme.heading4,
                                  ),
                                  if (_eta != null)
                                    Text(
                                      'ETA: ${_eta!.substring(0, _eta!.length > 16 ? 16 : _eta!.length)}',
                                      style: AppTheme.caption,
                                    ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: _loadTrackingData,
                              icon: const Icon(Icons.refresh),
                              tooltip: tr('retry'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}
