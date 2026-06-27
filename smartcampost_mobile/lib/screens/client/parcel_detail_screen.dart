import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ParcelDetailScreen extends StatefulWidget {
  final String parcelId;

  const ParcelDetailScreen({super.key, required this.parcelId});

  @override
  State<ParcelDetailScreen> createState() => _ParcelDetailScreenState();
}

class _ParcelDetailScreenState extends State<ParcelDetailScreen> {
  @override
  void initState() {
    super.initState();
    final provider = context.read<ParcelProvider>();
    Future.microtask(() {
      provider.loadParcelDetail(widget.parcelId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final parcels = context.watch<ParcelProvider>();
    final tr = context.read<LocaleProvider>().tr;
    final parcel = parcels.selectedParcel;

    return Scaffold(
      appBar: AppBar(title: Text(parcel?.displayRef ?? tr('parcel_details'))),
      body: parcels.isLoading
          ? const LoadingIndicator()
          : parcels.error != null
          ? ErrorRetryWidget(
              message: parcels.error!,
              onRetry: () => parcels.loadParcelDetail(widget.parcelId),
            )
          : parcel == null
          ? const EmptyStateWidget(
              icon: Icons.inbox_outlined,
              title: 'Parcel not found',
            )
          : RefreshIndicator(
              onRefresh: () => parcels.loadParcelDetail(widget.parcelId),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status header
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: 0.05),
                      child: Column(
                        children: [
                          StatusBadge(
                            status: parcel.status ?? 'UNKNOWN',
                            fontSize: 14,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            parcel.displayRef,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),

                    // Route info
                    SectionTitle(title: tr('route')),
                    Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                children: [
                                  const Icon(
                                    Icons.flight_takeoff,
                                    color: Colors.blue,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    tr('from'),
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    parcel.senderCity ?? '-',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                  if (parcel.originAgencyName != null)
                                    Text(
                                      parcel.originAgencyName!,
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodySmall,
                                    ),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward, color: Colors.grey),
                            Expanded(
                              child: Column(
                                children: [
                                  const Icon(
                                    Icons.flight_land,
                                    color: Colors.green,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    tr('to'),
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    parcel.recipientCity ?? '-',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                  if (parcel.destinationAgencyName != null)
                                    Text(
                                      parcel.destinationAgencyName!,
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodySmall,
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Parcel details
                    SectionTitle(title: tr('details')),
                    Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            InfoRow(
                              label: tr('weight'),
                              value: parcel.weight != null
                                  ? '${parcel.weight} kg'
                                  : null,
                              icon: Icons.scale,
                            ),
                            InfoRow(
                              label: tr('dimensions'),
                              value: parcel.dimensions,
                              icon: Icons.straighten,
                            ),
                            InfoRow(
                              label: tr('declared_value'),
                              value: parcel.declaredValue != null
                                  ? '${parcel.declaredValue} XAF'
                                  : null,
                              icon: Icons.attach_money,
                            ),
                            InfoRow(
                              label: tr('service_type'),
                              value: parcel.serviceType,
                              icon: Icons.local_shipping_outlined,
                            ),
                            InfoRow(
                              label: tr('fragile'),
                              value: parcel.fragile == true
                                  ? tr('yes')
                                  : tr('no'),
                              icon: Icons.warning_amber_rounded,
                            ),
                            if (parcel.descriptionComment != null)
                              InfoRow(
                                label: tr('description'),
                                value: parcel.descriptionComment,
                                icon: Icons.description_outlined,
                              ),
                            if (parcel.lastAppliedPrice != null)
                              InfoRow(
                                label: tr('price'),
                                value: '${parcel.lastAppliedPrice} XAF',
                                icon: Icons.price_check,
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

                    // ─── Authorize Delegate ───
                    if (parcel.status != 'DELIVERED' && parcel.status != 'CANCELLED')
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        child: OutlinedButton.icon(
                          onPressed: () => _showDelegateSheet(context, parcel.id),
                          icon: const Icon(Icons.person_add_outlined, size: 18),
                          label: const Text('Authorize someone to collect'),
                        ),
                      ),

                    // ─── Status Timeline ───
                    SectionTitle(title: tr('tracking')),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _StatusTimeline(currentStatus: parcel.status ?? 'CREATED'),
                    ),
                    const SizedBox(height: 8),

                    // QR Code section
                    if (parcel.qrStatus != null) ...[
                      SectionTitle(title: tr('qr_code')),
                      Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              InfoRow(
                                label: tr('qr_status'),
                                value: parcel.qrStatus,
                                icon: Icons.qr_code,
                              ),
                              if (parcel.locked == true)
                                const InfoRow(
                                  label: 'Locked',
                                  value: 'Yes - Validated',
                                  icon: Icons.lock,
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  void _showDelegateSheet(BuildContext context, String parcelId) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final idCtrl = TextEditingController();
    final relCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Authorize Someone to Collect', style: AppTheme.heading3),
            const SizedBox(height: 4),
            Text('They will receive a PIN code via SMS', style: AppTheme.caption),
            const SizedBox(height: 16),
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full Name *')),
            const SizedBox(height: 10),
            TextField(controller: phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone *', hintText: '+237...')),
            const SizedBox(height: 10),
            TextField(controller: idCtrl, decoration: const InputDecoration(labelText: 'ID Number (optional)')),
            const SizedBox(height: 10),
            TextField(controller: relCtrl, decoration: const InputDecoration(labelText: 'Relationship (optional)')),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) return;
                try {
                  final res = await ApiClient().post<Map<String, dynamic>>(
                    '/parcels/$parcelId/delegates',
                    data: {
                      'delegateName': nameCtrl.text.trim(),
                      'delegatePhone': phoneCtrl.text.trim(),
                      if (idCtrl.text.trim().isNotEmpty) 'delegateIdNumber': idCtrl.text.trim(),
                      if (relCtrl.text.trim().isNotEmpty) 'relationship': relCtrl.text.trim(),
                    },
                  );
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: Text('Delegate authorized! PIN: ${res['pinCode']}'),
                        duration: const Duration(seconds: 10),
                      ));
                    }
                  }
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
                  }
                }
              },
              icon: const Icon(Icons.person_add, size: 18),
              label: const Text('Authorize & Send PIN'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusTimeline extends StatelessWidget {
  final String currentStatus;
  const _StatusTimeline({required this.currentStatus});

  static const _steps = [
    ('CREATED', Icons.add_circle_outline, 'Created'),
    ('ACCEPTED', Icons.check_circle_outline, 'Accepted'),
    ('TAKEN_IN_CHARGE', Icons.inventory_2_outlined, 'Picked Up'),
    ('IN_TRANSIT', Icons.local_shipping_outlined, 'In Transit'),
    ('ARRIVED_DEST_AGENCY', Icons.store_outlined, 'At Agency'),
    ('OUT_FOR_DELIVERY', Icons.delivery_dining, 'Out for Delivery'),
    ('DELIVERED', Icons.done_all, 'Delivered'),
  ];

  @override
  Widget build(BuildContext context) {
    final currentIdx = _steps.indexWhere((s) => s.$1 == currentStatus);
    final reachedIdx = currentIdx < 0 ? 0 : currentIdx;

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          children: List.generate(_steps.length, (i) {
            final step = _steps[i];
            final isReached = i <= reachedIdx;
            final isCurrent = i == reachedIdx;
            final isLast = i == _steps.length - 1;
            final color = isReached ? AppTheme.getStatusColor(step.$1) : AppTheme.borderColor;

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Dot + line column
                SizedBox(
                  width: 32,
                  child: Column(
                    children: [
                      Container(
                        width: isCurrent ? 28 : 22,
                        height: isCurrent ? 28 : 22,
                        decoration: BoxDecoration(
                          color: isReached ? color.withValues(alpha: 0.15) : AppTheme.surfaceElevated,
                          shape: BoxShape.circle,
                          border: Border.all(color: color, width: isCurrent ? 2.5 : 1.5),
                        ),
                        child: Icon(
                          step.$2,
                          size: isCurrent ? 14 : 12,
                          color: isReached ? color : AppTheme.textTertiary,
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 2,
                          height: 28,
                          color: i < reachedIdx ? color : AppTheme.borderColor,
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Label
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(top: isCurrent ? 4 : 2, bottom: isLast ? 0 : 10),
                    child: Text(
                      step.$3,
                      style: TextStyle(
                        fontSize: isCurrent ? 14 : 13,
                        fontWeight: isCurrent ? FontWeight.w700 : (isReached ? FontWeight.w500 : FontWeight.w400),
                        color: isReached ? AppTheme.textPrimary : AppTheme.textTertiary,
                      ),
                    ),
                  ),
                ),
                // Checkmark for completed steps
                if (isReached && !isCurrent)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Icon(Icons.check, size: 16, color: color),
                  ),
              ],
            );
          }),
        ),
      ),
    );
  }
}
