import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/parcel.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/parcel_service.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ParcelValidationScreen extends StatefulWidget {
  const ParcelValidationScreen({super.key});

  @override
  State<ParcelValidationScreen> createState() => _ParcelValidationScreenState();
}

class _ParcelValidationScreenState extends State<ParcelValidationScreen> {
  List<Parcel> _parcels = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadParcels();
  }

  Future<void> _loadParcels() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final page = await ParcelService().getParcels(page: 0, size: 50);
      if (mounted) {
        setState(() {
          _parcels = page.content.where((p) => p.status == 'CREATED').toList();
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _validateParcel(Parcel parcel) async {
    try {
      await ParcelService().validateAndLock(parcel.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Parcel ${parcel.displayRef} validated'),
            backgroundColor: Colors.green,
          ),
        );
      }
      _loadParcels();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _acceptParcel(Parcel parcel) async {
    try {
      await ParcelService().updateParcelStatus(parcel.id, status: 'ACCEPTED');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Parcel ${parcel.displayRef} accepted'),
            backgroundColor: Colors.green,
          ),
        );
      }
      _loadParcels();
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
      appBar: AppBar(title: Text(tr('validate_parcels'))),
      body: RefreshIndicator(
        onRefresh: _loadParcels,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadParcels)
            : _parcels.isEmpty
            ? EmptyStateWidget(
                icon: Icons.check_circle_outline,
                title: tr('no_pending_validation'),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _parcels.length,
                itemBuilder: (_, i) => _ValidationCard(
                  parcel: _parcels[i],
                  onValidate: () => _validateParcel(_parcels[i]),
                  onAccept: () => _acceptParcel(_parcels[i]),
                ),
              ),
      ),
    );
  }
}

class _ValidationCard extends StatelessWidget {
  final Parcel parcel;
  final VoidCallback onValidate;
  final VoidCallback onAccept;

  const _ValidationCard({
    required this.parcel,
    required this.onValidate,
    required this.onAccept,
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
            if (parcel.clientName != null)
              _DetailRow(
                Icons.person_outline,
                '${context.read<LocaleProvider>().tr('sender')}: ${parcel.clientName}',
              ),
            if (parcel.weight != null)
              _DetailRow(
                Icons.scale,
                '${context.read<LocaleProvider>().tr('weight')}: ${parcel.weight} kg',
              ),
            if (parcel.declaredValue != null)
              _DetailRow(
                Icons.attach_money,
                '${context.read<LocaleProvider>().tr('declared_value')}: ${parcel.declaredValue} XAF',
              ),
            if (parcel.serviceType != null)
              _DetailRow(
                Icons.category,
                '${context.read<LocaleProvider>().tr('service_type')}: ${parcel.serviceType}',
              ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onValidate,
                    icon: const Icon(Icons.verified),
                    label: Text(
                      context.read<LocaleProvider>().tr('validate_and_lock'),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onAccept,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentColor,
                    ),
                    icon: const Icon(Icons.check),
                    label: Text(context.read<LocaleProvider>().tr('accept')),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _DetailRow(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 6),
          Text(text, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }
}
