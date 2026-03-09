import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/models/common.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/pickup_service.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class PickupAssignmentsScreen extends StatefulWidget {
  const PickupAssignmentsScreen({super.key});

  @override
  State<PickupAssignmentsScreen> createState() =>
      _PickupAssignmentsScreenState();
}

class _PickupAssignmentsScreenState extends State<PickupAssignmentsScreen> {
  List<PickupRequest> _pickups = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPickups();
  }

  Future<void> _loadPickups() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await PickupService().getMyPickups();
      if (mounted) setState(() => _pickups = data.content);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _confirmPickup(String id) async {
    try {
      await PickupService().confirmPickup({'pickupId': id});
      _loadPickups();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Pickup confirmed')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('pickups'))),
      body: RefreshIndicator(
        onRefresh: _loadPickups,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadPickups)
            : _pickups.isEmpty
            ? EmptyStateWidget(
                icon: Icons.inventory_2_outlined,
                title: tr('no_pickups'),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _pickups.length,
                itemBuilder: (_, i) => _PickupCard(
                  pickup: _pickups[i],
                  onConfirm: () => _confirmPickup(_pickups[i].id),
                ),
              ),
      ),
    );
  }
}

class _PickupCard extends StatelessWidget {
  final PickupRequest pickup;
  final VoidCallback onConfirm;

  const _PickupCard({required this.pickup, required this.onConfirm});

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
                    'Pickup #${pickup.id}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                StatusBadge(status: pickup.state ?? ''),
              ],
            ),
            const SizedBox(height: 8),
            if (pickup.addressString != null &&
                pickup.addressString!.isNotEmpty)
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      pickup.addressString!,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            if (pickup.requestedDate != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.schedule, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    pickup.requestedDate!,
                    style: const TextStyle(fontSize: 13),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            if (pickup.state == 'ASSIGNED' || pickup.state == 'PENDING')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onConfirm,
                  icon: const Icon(Icons.check),
                  label: const Text('Confirm Pickup'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
