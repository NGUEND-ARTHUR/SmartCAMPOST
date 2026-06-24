import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:smartcampost_mobile/screens/shared/operational_screens.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class GpsEndpointListScreen extends StatefulWidget {
  final String title;
  final String baseEndpoint;
  final IconData icon;
  final String emptyTitle;

  const GpsEndpointListScreen({
    super.key,
    required this.title,
    required this.baseEndpoint,
    required this.icon,
    required this.emptyTitle,
  });

  @override
  State<GpsEndpointListScreen> createState() => _GpsEndpointListScreenState();
}

class _GpsEndpointListScreenState extends State<GpsEndpointListScreen> {
  Position? _position;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  Future<void> _getLocation() async {
    setState(() { _loading = true; _error = null; });
    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        setState(() { _error = 'Location permission denied'; _loading = false; });
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      setState(() { _position = pos; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: const LoadingIndicator(),
      );
    }

    if (_error != null || _position == null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: ErrorRetryWidget(
          message: _error ?? 'Could not determine location',
          onRetry: _getLocation,
        ),
      );
    }

    final endpoint = '${widget.baseEndpoint}?latitude=${_position!.latitude}&longitude=${_position!.longitude}';

    return EndpointListScreen(
      title: widget.title,
      endpoint: endpoint,
      icon: widget.icon,
      emptyTitle: widget.emptyTitle,
    );
  }
}
