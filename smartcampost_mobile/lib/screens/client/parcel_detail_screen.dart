import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
}
