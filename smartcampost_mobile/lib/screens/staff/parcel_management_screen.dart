import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/models/parcel.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/parcel_service.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ParcelManagementScreen extends StatefulWidget {
  const ParcelManagementScreen({super.key});

  @override
  State<ParcelManagementScreen> createState() => _ParcelManagementScreenState();
}

class _ParcelManagementScreenState extends State<ParcelManagementScreen> {
  List<Parcel> _parcels = [];
  bool _isLoading = true;
  String? _error;
  int _page = 0;
  bool _hasMore = true;
  String? _statusFilter;
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  final List<String> _statuses = [
    'ALL',
    'CREATED',
    'ACCEPTED',
    'TAKEN_IN_CHARGE',
    'IN_TRANSIT',
    'ARRIVED_HUB',
    'ARRIVED_DEST_AGENCY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED_TO_SENDER',
  ];

  @override
  void initState() {
    super.initState();
    _loadParcels();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) _loadMoreParcels();
    }
  }

  Future<void> _loadParcels() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _page = 0;
    });
    try {
      final page = await ParcelService().getParcels(page: 0, size: 20);
      if (mounted) {
        setState(() {
          _parcels = _applyFilters(page.content);
          _hasMore = page.hasNextPage;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _loadMoreParcels() async {
    _page++;
    setState(() => _isLoading = true);
    try {
      final page = await ParcelService().getParcels(page: _page, size: 20);
      if (mounted) {
        setState(() {
          _parcels.addAll(_applyFilters(page.content));
          _hasMore = page.hasNextPage;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  List<Parcel> _applyFilters(List<Parcel> parcels) {
    var filtered = parcels;
    if (_statusFilter != null && _statusFilter != 'ALL') {
      filtered = filtered.where((p) => p.status == _statusFilter).toList();
    }
    final query = _searchController.text.trim().toLowerCase();
    if (query.isNotEmpty) {
      filtered = filtered
          .where(
            (p) =>
                (p.trackingNumber?.toLowerCase().contains(query) ?? false) ||
                (p.clientName?.toLowerCase().contains(query) ?? false) ||
                (p.recipientLabel?.toLowerCase().contains(query) ?? false),
          )
          .toList();
    }
    return filtered;
  }

  Future<void> _updateStatus(Parcel parcel, String newStatus) async {
    try {
      await ParcelService().updateParcelStatus(parcel.id, status: newStatus);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Status updated to $newStatus')));
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

  void _showStatusDialog(Parcel parcel) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Update Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: _statuses
              .where((s) => s != 'ALL')
              .map(
                (status) => ListTile(
                  title: Text(status.replaceAll('_', ' ')),
                  leading: Icon(
                    status == parcel.status
                        ? Icons.radio_button_checked
                        : Icons.radio_button_unchecked,
                    color: status == parcel.status
                        ? Theme.of(context).primaryColor
                        : null,
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _updateStatus(parcel, status);
                  },
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('all_parcels'))),
      body: Column(
        children: [
          // Search and filter bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: tr('search_parcels'),
                    prefixIcon: const Icon(Icons.search),
                    border: const OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (_) => _loadParcels(),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 36,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _statuses.length,
                    itemBuilder: (_, i) {
                      final s = _statuses[i];
                      final selected = (_statusFilter ?? 'ALL') == s;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: FilterChip(
                          label: Text(
                            s.replaceAll('_', ' '),
                            style: TextStyle(
                              fontSize: 11,
                              color: selected ? Colors.white : null,
                            ),
                          ),
                          selected: selected,
                          onSelected: (_) {
                            setState(
                              () => _statusFilter = s == 'ALL' ? null : s,
                            );
                            _loadParcels();
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Parcels list
          Expanded(
            child: _error != null
                ? ErrorRetryWidget(message: _error!, onRetry: _loadParcels)
                : RefreshIndicator(
                    onRefresh: _loadParcels,
                    child: _parcels.isEmpty && !_isLoading
                        ? const EmptyStateWidget(
                            icon: Icons.inventory_2_outlined,
                            title: 'No parcels found',
                          )
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            itemCount: _parcels.length + (_isLoading ? 1 : 0),
                            itemBuilder: (_, i) {
                              if (i == _parcels.length) {
                                return const LoadingIndicator();
                              }
                              final parcel = _parcels[i];
                              return ParcelCard(
                                trackingRef: parcel.displayRef,
                                status: parcel.status,
                                senderCity: parcel.senderCity,
                                recipientCity: parcel.recipientCity,
                                createdAt: parcel.createdAt,
                                onTap: () => _showStatusDialog(parcel),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
