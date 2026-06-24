import 'package:smartcampost_mobile/core/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/core/constants.dart';
import 'package:smartcampost_mobile/models/parcel.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class TrackParcelScreen extends StatefulWidget {
  const TrackParcelScreen({super.key});

  @override
  State<TrackParcelScreen> createState() => _TrackParcelScreenState();
}

class _TrackParcelScreenState extends State<TrackParcelScreen> {
  final _trackingController = TextEditingController();
  final _chatController = TextEditingController();
  final _ratingController = TextEditingController();
  int _rating = 0;

  @override
  void dispose() {
    _trackingController.dispose();
    _chatController.dispose();
    _ratingController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final ref = _trackingController.text.trim();
    if (ref.isEmpty) return;
    await context.read<ParcelProvider>().trackParcel(ref);
  }

  Future<void> _sendChat(Parcel parcel) async {
    final message = _chatController.text.trim();
    if (message.isEmpty) return;
    try {
      await ApiClient().post<dynamic>(
        '/conversations',
        data: {
          'channel': 'MOBILE',
          'message': message,
          'contextData': {
            'trackingRef': parcel.displayRef,
            'parcelId': parcel.id,
          },
        },
      );
      _chatController.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<LocaleProvider>().tr('message_sent'))),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _submitRating(Parcel parcel) async {
    if (_rating < 1) return;
    try {
      await ApiClient().post<dynamic>(
        '/ratings',
        data: {
          'score': _rating,
          'comment': _ratingController.text.trim(),
          'trackingRef': parcel.displayRef,
          'ratedRole': 'COURIER',
        },
      );
      _ratingController.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<LocaleProvider>().tr('rating_saved'))),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final parcels = context.watch<ParcelProvider>();
    final tr = context.read<LocaleProvider>().tr;
    final parcel = parcels.selectedParcel;

    return Scaffold(
      appBar: AppBar(title: Text(tr('track_parcel'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Search bar
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _trackingController,
                    decoration: InputDecoration(
                      hintText: tr('enter_tracking_number'),
                      prefixIcon: const Icon(Icons.search),
                    ),
                    onFieldSubmitted: (_) => _search(),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: parcels.isLoading ? null : _search,
                    child: parcels.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.search),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            if (parcels.error != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.errorColor.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: AppTheme.errorColor),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        tr('parcel_not_found'),
                        style: const TextStyle(color: AppTheme.errorColor),
                      ),
                    ),
                  ],
                ),
              ),
            ] else if (parcel != null) ...[
              AnimatedParcelMap(parcel: parcel),
              const SizedBox(height: 16),
              TrackingInsightCard(parcel: parcel),
              const SizedBox(height: 16),
              // Result card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            parcel.displayRef,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          StatusBadge(status: parcel.status ?? 'UNKNOWN'),
                        ],
                      ),
                      const Divider(height: 24),
                      InfoRow(
                        label: tr('from'),
                        value:
                            '${parcel.senderCity ?? '-'} (${parcel.originAgencyName ?? '-'})',
                        icon: Icons.flight_takeoff,
                      ),
                      InfoRow(
                        label: tr('to'),
                        value:
                            '${parcel.recipientCity ?? '-'} (${parcel.destinationAgencyName ?? '-'})',
                        icon: Icons.flight_land,
                      ),
                      InfoRow(
                        label: tr('weight'),
                        value: parcel.weight != null
                            ? '${parcel.weight} kg'
                            : null,
                        icon: Icons.scale,
                      ),
                      InfoRow(
                        label: tr('service_type'),
                        value: parcel.serviceType,
                        icon: Icons.local_shipping_outlined,
                      ),
                      InfoRow(
                        label: tr('created_at'),
                        value: parcel.createdAt,
                        icon: Icons.calendar_today,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/client/parcels/${parcel.id}'),
                  icon: const Icon(Icons.open_in_new),
                  label: Text(tr('view_details')),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tr('delivery_contact'),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                          child: const Icon(Icons.person),
                        ),
                        title: Text(parcel.validatedByStaffName ?? parcel.destinationAgencyName ?? 'SmartCAMPOST'),
                        subtitle: Text(parcel.validatedByStaffId != null ? 'Agent' : 'Agency / courier desk'),
                        trailing: IconButton(
                          icon: const Icon(Icons.call),
                          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(tr('phone_unavailable'))),
                          ),
                        ),
                      ),
                      TextField(
                        controller: _chatController,
                        minLines: 2,
                        maxLines: 4,
                        decoration: InputDecoration(
                          labelText: tr('chat_message'),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () => _sendChat(parcel),
                          icon: const Icon(Icons.send),
                          label: Text(tr('send_message')),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tr('rate_service'),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: List.generate(5, (index) {
                          final score = index + 1;
                          return IconButton(
                            onPressed: () => setState(() => _rating = score),
                            icon: Icon(
                              score <= _rating ? Icons.star : Icons.star_border,
                              color: Colors.amber,
                            ),
                          );
                        }),
                      ),
                      TextField(
                        controller: _ratingController,
                        minLines: 2,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: tr('rating_comment'),
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _rating < 1 ? null : () => _submitRating(parcel),
                          icon: const Icon(Icons.reviews),
                          label: Text(tr('submit_rating')),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              const SizedBox(height: 60),
              EmptyStateWidget(
                icon: Icons.local_shipping_outlined,
                title: tr('track_parcel_hint'),
                subtitle: tr('track_parcel_subtitle'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class TrackingInsightCard extends StatelessWidget {
  final Parcel parcel;

  const TrackingInsightCard({super.key, required this.parcel});

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;
    final status = (parcel.status ?? '').toUpperCase();
    final delivered = status.contains('DELIVERED');
    final moving = status.contains('TRANSIT') || status.contains('OUT');
    final etaHours = delivered ? 0 : (moving ? 8 : 18);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.auto_graph, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    tr('smart_tracking'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _InsightChip(
                  icon: Icons.local_shipping,
                  label: moving ? tr('in_motion') : parcel.status ?? tr('status'),
                ),
                _InsightChip(
                  icon: Icons.schedule,
                  label: delivered ? tr('delivered') : tr('dynamic_eta').replaceAll('{hours}', '$etaHours'),
                ),
                _InsightChip(
                  icon: delivered ? Icons.verified : Icons.notifications_active,
                  label: delivered ? tr('proof_ready') : tr('proactive_alerts'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InsightChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InsightChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 6),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class AnimatedParcelMap extends StatefulWidget {
  final Parcel parcel;

  const AnimatedParcelMap({super.key, required this.parcel});

  @override
  State<AnimatedParcelMap> createState() => _AnimatedParcelMapState();
}

class _AnimatedParcelMapState extends State<AnimatedParcelMap>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final origin = LatLng(
      widget.parcel.creationLatitude ?? AppConstants.defaultLatitude,
      widget.parcel.creationLongitude ?? AppConstants.defaultLongitude,
    );
    final current = LatLng(
      widget.parcel.currentLatitude ?? origin.latitude + 0.08,
      widget.parcel.currentLongitude ?? origin.longitude + 0.08,
    );

    return SizedBox(
      height: 260,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: FlutterMap(
          options: MapOptions(initialCenter: current, initialZoom: 11),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'cm.smartcampost.smartcampost_mobile',
            ),
            PolylineLayer(
              polylines: [
                Polyline(
                  points: [origin, current],
                  strokeWidth: 5,
                  color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.7),
                ),
              ],
            ),
            AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                final t = _controller.value;
                final parcelPoint = LatLng(
                  origin.latitude + (current.latitude - origin.latitude) * t,
                  origin.longitude + (current.longitude - origin.longitude) * t,
                );
                return MarkerLayer(
                  markers: [
                    Marker(
                      point: origin,
                      width: 42,
                      height: 42,
                      child: const Icon(Icons.store, color: Colors.green, size: 34),
                    ),
                    Marker(
                      point: current,
                      width: 54,
                      height: 54,
                      child: _PulseMarker(
                        icon: Icons.delivery_dining,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    Marker(
                      point: parcelPoint,
                      width: 48,
                      height: 48,
                      child: const _PulseMarker(
                        icon: Icons.inventory_2,
                        color: Colors.orange,
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _PulseMarker extends StatelessWidget {
  final IconData icon;
  final Color color;

  const _PulseMarker({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.82, end: 1),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeInOut,
      builder: (context, value, child) => Transform.scale(
        scale: value,
        child: child,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.35),
              blurRadius: 18,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Icon(icon, color: Colors.white),
      ),
    );
  }
}
