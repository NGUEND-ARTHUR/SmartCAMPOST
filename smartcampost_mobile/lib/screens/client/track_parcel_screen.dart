import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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

  @override
  void dispose() {
    _trackingController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final ref = _trackingController.text.trim();
    if (ref.isEmpty) return;
    await context.read<ParcelProvider>().trackParcel(ref);
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
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[400]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        tr('parcel_not_found'),
                        style: TextStyle(color: Colors.red[700]),
                      ),
                    ),
                  ],
                ),
              ),
            ] else if (parcel != null) ...[
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
                  onPressed: () => Navigator.pushNamed(
                    context,
                    '/client/parcels/${parcel.id}',
                  ),
                  icon: const Icon(Icons.open_in_new),
                  label: Text(tr('view_details')),
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
