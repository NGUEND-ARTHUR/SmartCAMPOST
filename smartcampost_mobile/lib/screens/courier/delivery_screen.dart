import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/parcel.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/delivery_service.dart';
import 'package:smartcampost_mobile/services/parcel_service.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class DeliveryScreen extends StatefulWidget {
  const DeliveryScreen({super.key});

  @override
  State<DeliveryScreen> createState() => _DeliveryScreenState();
}

class _DeliveryScreenState extends State<DeliveryScreen> {
  List<Parcel> _parcels = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDeliveries();
  }

  Future<void> _loadDeliveries() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final page = await ParcelService().getMyParcels(page: 0, size: 50);
      if (mounted) {
        setState(() {
          _parcels = page.content
              .where(
                (p) =>
                    p.status == 'OUT_FOR_DELIVERY' ||
                    p.status == 'ARRIVED_DEST_AGENCY',
              )
              .toList();
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _startDelivery(String parcelId) async {
    try {
      await DeliveryService().startDelivery({'parcelId': parcelId});
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Delivery started')));
      }
      _loadDeliveries();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _openConfirmation(Parcel parcel) {
    context.push('/courier/delivery-confirm', extra: parcel);
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('my_deliveries'))),
      body: RefreshIndicator(
        onRefresh: _loadDeliveries,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadDeliveries)
            : _parcels.isEmpty
            ? EmptyStateWidget(
                icon: Icons.local_shipping_outlined,
                title: tr('no_deliveries'),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _parcels.length,
                itemBuilder: (_, i) => _DeliveryCard(
                  parcel: _parcels[i],
                  onStart: () => _startDelivery(_parcels[i].id),
                  onConfirm: () => _openConfirmation(_parcels[i]),
                ),
              ),
      ),
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  final Parcel parcel;
  final VoidCallback onStart;
  final VoidCallback onConfirm;

  const _DeliveryCard({
    required this.parcel,
    required this.onStart,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    parcel.displayRef,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
                StatusBadge(status: parcel.status ?? ''),
              ],
            ),
            const SizedBox(height: 8),
            if (parcel.recipientLabel != null)
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    parcel.recipientLabel!,
                    style: const TextStyle(fontSize: 13),
                  ),
                ],
              ),
            if (parcel.destinationAgencyName != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    parcel.destinationAgencyName!,
                    style: const TextStyle(fontSize: 13),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                if (parcel.status == 'ARRIVED_DEST_AGENCY')
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onStart,
                      icon: const Icon(Icons.play_arrow),
                      label: Text(
                        context.read<LocaleProvider>().tr('start_delivery'),
                      ),
                    ),
                  ),
                if (parcel.status == 'OUT_FOR_DELIVERY') ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onConfirm,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentColor,
                      ),
                      icon: const Icon(Icons.check_circle),
                      label: Text(
                        context.read<LocaleProvider>().tr('confirm_delivery'),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
