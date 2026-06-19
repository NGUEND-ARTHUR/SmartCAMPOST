import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/api_client.dart';
import 'package:smartcampost_mobile/core/constants.dart';
import 'package:smartcampost_mobile/models/address.dart';
import 'package:smartcampost_mobile/models/common.dart';
import 'package:smartcampost_mobile/models/payment.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/payment_service.dart';
import 'package:smartcampost_mobile/services/pickup_service.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

String _tr(BuildContext context, String key) =>
    context.watch<LocaleProvider>().tr(key);

class ClientPickupsScreen extends StatefulWidget {
  const ClientPickupsScreen({super.key});

  @override
  State<ClientPickupsScreen> createState() => _ClientPickupsScreenState();
}

class _ClientPickupsScreenState extends State<ClientPickupsScreen> {
  final _parcelController = TextEditingController();
  final _addressController = TextEditingController();
  final _windowController = TextEditingController();
  List<PickupRequest> _pickups = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _parcelController.dispose();
    _addressController.dispose();
    _windowController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await PickupService().getMyPickups(size: 50);
      if (mounted) setState(() => _pickups = page.content);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _createPickup() async {
    final parcelId = _parcelController.text.trim();
    if (parcelId.isEmpty) return;
    try {
      await PickupService().createPickup({
        'parcelId': parcelId,
        'address': _addressController.text.trim(),
        'timeWindow': _windowController.text.trim(),
      });
      if (mounted) Navigator.pop(context);
      _parcelController.clear();
      _addressController.clear();
      _windowController.clear();
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${_tr(context, 'pickup_request_failed')}: $e')));
    }
  }

  void _showCreateSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Request pickup',
              style: Theme.of(
                ctx,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _parcelController,
              decoration: const InputDecoration(
                labelText: 'Parcel ID',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _addressController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Pickup address',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _windowController,
              decoration: const InputDecoration(
                labelText: 'Preferred time window',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _createPickup,
                icon: const Icon(Icons.local_shipping),
                label: Text(_tr(context, 'submit_request')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'pickups')),
        actions: const [LanguageSwitchAction()],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSheet,
        icon: const Icon(Icons.add),
        label: Text(_tr(context, 'request')),
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
          ? ErrorRetryWidget(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              child: _pickups.isEmpty
                  ? EmptyStateWidget(
                      icon: Icons.local_shipping_outlined,
                      title: _tr(context, 'no_pickup_requests'),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _pickups.length,
                      itemBuilder: (_, i) {
                        final pickup = _pickups[i];
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.local_shipping),
                            title: Text(pickup.parcelId ?? pickup.id),
                            subtitle: Text(
                              [
                                pickup.state,
                                pickup.addressString,
                                pickup.timeWindow,
                              ].whereType<String>().join('\n'),
                            ),
                            isThreeLine: true,
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class SupportCenterScreen extends StatefulWidget {
  const SupportCenterScreen({super.key});

  @override
  State<SupportCenterScreen> createState() => _SupportCenterScreenState();
}

class _SupportCenterScreenState extends State<SupportCenterScreen> {
  final _subjectController = TextEditingController();
  final _descriptionController = TextEditingController();
  List<SupportTicket> _tickets = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final tickets = await SupportService().getMyTickets();
      if (mounted) setState(() => _tickets = tickets);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _createTicket() async {
    final subject = _subjectController.text.trim();
    if (subject.isEmpty) return;
    try {
      await SupportService().createTicket({
        'subject': subject,
        'description': _descriptionController.text.trim(),
        'category': 'GENERAL',
        'priority': 'NORMAL',
      });
      if (mounted) Navigator.pop(context);
      _subjectController.clear();
      _descriptionController.clear();
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${_tr(context, 'ticket_creation_failed')}: $e')));
    }
  }

  void _showCreateSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'New support ticket',
              style: Theme.of(
                ctx,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _subjectController,
              decoration: const InputDecoration(
                labelText: 'Subject',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _createTicket,
                icon: const Icon(Icons.support_agent),
                label: Text(_tr(context, 'create_ticket')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'support')),
        actions: const [LanguageSwitchAction()],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSheet,
        icon: const Icon(Icons.add_comment),
        label: Text(_tr(context, 'ticket')),
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
          ? ErrorRetryWidget(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              child: _tickets.isEmpty
                  ? EmptyStateWidget(
                      icon: Icons.support_agent,
                      title: _tr(context, 'no_support_tickets'),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _tickets.length,
                      itemBuilder: (_, i) {
                        final ticket = _tickets[i];
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.support_agent),
                            title: Text(ticket.subject),
                            subtitle: Text(
                              [
                                ticket.status,
                                ticket.category,
                                ticket.description,
                              ].whereType<String>().join('\n'),
                            ),
                            isThreeLine: true,
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class CourierMapScreen extends StatefulWidget {
  const CourierMapScreen({super.key});

  @override
  State<CourierMapScreen> createState() => _CourierMapScreenState();
}

class _CourierMapScreenState extends State<CourierMapScreen> {
  LatLng _center = const LatLng(
    AppConstants.defaultLatitude,
    AppConstants.defaultLongitude,
  );
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLocation();
  }

  Future<void> _loadLocation() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission != LocationPermission.denied &&
          permission != LocationPermission.deniedForever) {
        final position = await Geolocator.getCurrentPosition();
        _center = LatLng(position.latitude, position.longitude);
      }
    } catch (_) {
      _center = const LatLng(
        AppConstants.defaultLatitude,
        AppConstants.defaultLongitude,
      );
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'route_map')),
        actions: const [LanguageSwitchAction()],
      ),
      body: _loading
          ? const LoadingIndicator()
          : FlutterMap(
              options: MapOptions(initialCenter: _center, initialZoom: 13),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'cm.smartcampost.smartcampost_mobile',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _center,
                      width: 48,
                      height: 48,
                      child: const Icon(
                        Icons.my_location,
                        color: Colors.blue,
                        size: 36,
                      ),
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

class AssignCourierScreen extends StatefulWidget {
  const AssignCourierScreen({super.key});

  @override
  State<AssignCourierScreen> createState() => _AssignCourierScreenState();
}

class _AssignCourierScreenState extends State<AssignCourierScreen> {
  List<PickupRequest> _pickups = [];
  List<dynamic> _couriers = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        PickupService().getPickups(size: 50),
        UserManagementService().getCouriers(),
      ]);
      if (mounted) {
        setState(() {
          _pickups = (results[0] as dynamic).content as List<PickupRequest>;
          _couriers = results[1] as List<dynamic>;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _assign(PickupRequest pickup, String courierId) async {
    try {
      await PickupService().assignCourier(pickup.id, courierId);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${_tr(context, 'assignment_failed')}: $e')));
    }
  }

  void _showCourierPicker(PickupRequest pickup) {
    showModalBottomSheet(
      context: context,
      builder: (_) => ListView(
        padding: const EdgeInsets.all(12),
        children: _couriers.whereType<Map<String, dynamic>>().map((courier) {
          final id = courier['id']?.toString() ?? '';
          final name =
              courier['fullName'] ??
              courier['name'] ??
              courier['phone'] ??
              'Courier';
          return ListTile(
            leading: const Icon(Icons.delivery_dining),
            title: Text(name.toString()),
            subtitle: Text(id),
            onTap: () {
              Navigator.pop(context);
              if (id.isNotEmpty) _assign(pickup, id);
            },
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'assign_courier')),
        actions: const [LanguageSwitchAction()],
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
          ? ErrorRetryWidget(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              child: _pickups.isEmpty
                  ? EmptyStateWidget(
                      icon: Icons.assignment_ind,
                      title: _tr(context, 'no_pickups_to_assign'),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _pickups.length,
                      itemBuilder: (_, i) {
                        final pickup = _pickups[i];
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.assignment_ind),
                            title: Text(pickup.parcelId ?? pickup.id),
                            subtitle: Text(
                              [
                                pickup.state,
                                pickup.addressString,
                                pickup.courierId == null
                                    ? 'No courier assigned'
                                    : 'Courier: ${pickup.courierId}',
                              ].whereType<String>().join('\n'),
                            ),
                            isThreeLine: true,
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => _showCourierPicker(pickup),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class CongestionScreen extends StatefulWidget {
  const CongestionScreen({super.key});

  @override
  State<CongestionScreen> createState() => _CongestionScreenState();
}

class _CongestionScreenState extends State<CongestionScreen> {
  List<dynamic> _alerts = [];
  List<dynamic> _actions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        SelfHealingService().getCongestion(),
        SelfHealingService().getActions(),
      ]);
      if (mounted) {
        setState(() {
          _alerts = results[0];
          _actions = results[1];
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return _MapListScreen(
      title: _tr(context, 'congestion'),
      loading: _loading,
      error: _error,
      onRefresh: _load,
      emptyTitle: 'No congestion detected',
      items: [
        ..._alerts.whereType<Map<String, dynamic>>(),
        ..._actions.whereType<Map<String, dynamic>>(),
      ],
      icon: Icons.warning_amber,
    );
  }
}

class AuditLogsScreen extends StatefulWidget {
  const AuditLogsScreen({super.key});

  @override
  State<AuditLogsScreen> createState() => _AuditLogsScreenState();
}

class _AuditLogsScreenState extends State<AuditLogsScreen> {
  final _idController = TextEditingController();
  String _mode = 'parcel';
  List<dynamic> _records = [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _idController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final id = _idController.text.trim();
    if (id.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (_mode == 'parcel') {
        final response = await AuditService().getParcelAudit(id);
        final records = response['records'] ?? response['auditRecords'];
        _records = records is List ? records : [response];
      } else if (_mode == 'actor') {
        _records = await AuditService().getActorAudit(id);
      } else {
        _records = await AuditService().getAgencyAudit(id);
      }
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'audit_logs')),
        actions: const [LanguageSwitchAction()],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'parcel', label: Text('Parcel')),
                    ButtonSegment(value: 'actor', label: Text('Actor')),
                    ButtonSegment(value: 'agency', label: Text('Agency')),
                  ],
                  selected: {_mode},
                  onSelectionChanged: (s) => setState(() => _mode = s.first),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _idController,
                  decoration: InputDecoration(
                    labelText:
                        '${_mode[0].toUpperCase()}${_mode.substring(1)} ID',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: _search,
                    ),
                  ),
                  onSubmitted: (_) => _search(),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingIndicator()
                : _error != null
                ? ErrorRetryWidget(message: _error!, onRetry: _search)
                : _records.isEmpty
                ? EmptyStateWidget(
                    icon: Icons.history,
                    title: _tr(context, 'search_audit_records'),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _records.length,
                    itemBuilder: (_, i) =>
                        _DataCard(item: _records[i], icon: Icons.history),
                  ),
          ),
        ],
      ),
    );
  }
}

class RefundsScreen extends StatefulWidget {
  const RefundsScreen({super.key});

  @override
  State<RefundsScreen> createState() => _RefundsScreenState();
}

class _RefundsScreenState extends State<RefundsScreen> {
  List<dynamic> _refunds = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final refunds = await RefundService().getRefunds();
      if (mounted) setState(() => _refunds = refunds);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _setStatus(String id, String status) async {
    try {
      await RefundService().updateStatus(id, status);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${_tr(context, 'refund_update_failed')}: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'refunds')),
        actions: const [LanguageSwitchAction()],
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
          ? ErrorRetryWidget(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              child: _refunds.isEmpty
                  ? EmptyStateWidget(
                      icon: Icons.undo,
                      title: _tr(context, 'no_refund_requests'),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _refunds.length,
                      itemBuilder: (_, i) {
                        final item = _refunds[i];
                        final map = item is Map<String, dynamic>
                            ? item
                            : <String, dynamic>{};
                        final id = map['id']?.toString() ?? '';
                        return _DataCard(
                          item: map,
                          icon: Icons.undo,
                          trailing: PopupMenuButton<String>(
                            onSelected: (status) => _setStatus(id, status),
                            itemBuilder: (_) => const [
                              PopupMenuItem(
                                value: 'APPROVED',
                                child: Text('Approve'),
                              ),
                              PopupMenuItem(
                                value: 'REJECTED',
                                child: Text('Reject'),
                              ),
                              PopupMenuItem(
                                value: 'PROCESSED',
                                child: Text('Mark processed'),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final _parcelController = TextEditingController();
  List<dynamic> _invoices = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMine();
  }

  @override
  void dispose() {
    _parcelController.dispose();
    super.dispose();
  }

  Future<void> _loadMine() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final invoices = await InvoiceService().getMyInvoices();
      if (mounted) setState(() => _invoices = invoices);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _searchParcel() async {
    final id = _parcelController.text.trim();
    if (id.isEmpty) return _loadMine();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final invoices = await InvoiceService().getInvoicesByParcel(id);
      if (mounted) setState(() => _invoices = invoices);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'invoices')),
        actions: const [LanguageSwitchAction()],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _parcelController,
              decoration: InputDecoration(
                labelText: 'Parcel ID',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: _searchParcel,
                ),
              ),
              onSubmitted: (_) => _searchParcel(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingIndicator()
                : _error != null
                ? ErrorRetryWidget(message: _error!, onRetry: _loadMine)
                : RefreshIndicator(
                    onRefresh: _loadMine,
                    child: _invoices.isEmpty
                        ? EmptyStateWidget(
                            icon: Icons.receipt_long,
                            title: _tr(context, 'no_invoices'),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: _invoices.length,
                            itemBuilder: (_, i) => _DataCard(
                              item: _invoices[i],
                              icon: Icons.receipt_long,
                            ),
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}

class IntegrationsScreen extends StatefulWidget {
  const IntegrationsScreen({super.key});

  @override
  State<IntegrationsScreen> createState() => _IntegrationsScreenState();
}

class _IntegrationsScreenState extends State<IntegrationsScreen> {
  List<dynamic> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await UserManagementService().getIntegrations();
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return _MapListScreen(
      title: _tr(context, 'integrations'),
      loading: _loading,
      error: _error,
      onRefresh: _load,
      emptyTitle: 'No integrations configured',
      items: _items,
      icon: Icons.extension,
    );
  }
}

class PaymentsListScreen extends StatefulWidget {
  const PaymentsListScreen({super.key});

  @override
  State<PaymentsListScreen> createState() => _PaymentsListScreenState();
}

class _PaymentsListScreenState extends State<PaymentsListScreen> {
  List<Payment> _payments = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final payments = await PaymentService().getPayments();
      if (mounted) setState(() => _payments = payments);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'payments')),
        actions: const [LanguageSwitchAction()],
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
          ? ErrorRetryWidget(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              child: _payments.isEmpty
                  ? EmptyStateWidget(
                      icon: Icons.payment,
                      title: _tr(context, 'no_payments'),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _payments.length,
                      itemBuilder: (_, i) {
                        final payment = _payments[i];
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.payment),
                            title: Text(
                              '${payment.amount.toStringAsFixed(0)} ${payment.currency ?? 'XAF'}',
                            ),
                            subtitle: Text(
                              [
                                payment.status,
                                payment.method,
                                payment.parcelTrackingRef,
                              ].whereType<String>().join('\n'),
                            ),
                            isThreeLine: true,
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class AddressBookScreen extends StatefulWidget {
  const AddressBookScreen({super.key});

  @override
  State<AddressBookScreen> createState() => _AddressBookScreenState();
}

class _AddressBookScreenState extends State<AddressBookScreen> {
  final _labelController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _lineController = TextEditingController();
  final _cityController = TextEditingController();
  final _regionController = TextEditingController();
  List<Address> _addresses = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _labelController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _lineController.dispose();
    _cityController.dispose();
    _regionController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await AddressService().getMyAddresses();
      if (mounted) setState(() => _addresses = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    final city = _cityController.text.trim();
    if (city.isEmpty) return;
    try {
      await AddressService().createAddress({
        'label': _labelController.text.trim(),
        'fullName': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'addressLine': _lineController.text.trim(),
        'city': city,
        'region': _regionController.text.trim(),
        'country': 'Cameroon',
      });
      if (mounted) Navigator.pop(context);
      _labelController.clear();
      _nameController.clear();
      _phoneController.clear();
      _lineController.clear();
      _cityController.clear();
      _regionController.clear();
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${_tr(context, 'address_save_failed')}: $e')));
    }
  }

  void _showCreateSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Add address',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _labelController,
                decoration: const InputDecoration(labelText: 'Label'),
              ),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full name'),
              ),
              TextField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
                keyboardType: TextInputType.phone,
              ),
              TextField(
                controller: _lineController,
                decoration: const InputDecoration(labelText: 'Address line'),
              ),
              TextField(
                controller: _cityController,
                decoration: const InputDecoration(labelText: 'City'),
              ),
              TextField(
                controller: _regionController,
                decoration: const InputDecoration(labelText: 'Region'),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _save,
                  icon: const Icon(Icons.save),
                  label: Text(_tr(context, 'save_address')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr(context, 'addresses')),
        actions: const [LanguageSwitchAction()],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSheet,
        icon: const Icon(Icons.add_location_alt),
        label: Text(_tr(context, 'add')),
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
          ? ErrorRetryWidget(message: _error!, onRetry: _load)
          : RefreshIndicator(
              onRefresh: _load,
              child: _addresses.isEmpty
                  ? EmptyStateWidget(
                      icon: Icons.location_on_outlined,
                      title: _tr(context, 'no_addresses'),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _addresses.length,
                      itemBuilder: (_, i) {
                        final a = _addresses[i];
                        return Card(
                          child: ListTile(
                            leading: const Icon(Icons.location_on_outlined),
                            title: Text(a.label ?? a.city ?? 'Address'),
                            subtitle: Text(
                              [
                                a.line1 ?? a.street,
                                a.city,
                                a.region,
                                a.country,
                              ].whereType<String>().join(', '),
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class EndpointListScreen extends StatefulWidget {
  final String title;
  final String endpoint;
  final IconData icon;
  final String emptyTitle;

  const EndpointListScreen({
    super.key,
    required this.title,
    required this.endpoint,
    required this.icon,
    required this.emptyTitle,
  });

  @override
  State<EndpointListScreen> createState() => _EndpointListScreenState();
}

class _EndpointListScreenState extends State<EndpointListScreen> {
  final _api = ApiClient();
  List<dynamic> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _api.get<dynamic>(widget.endpoint);
      if (mounted) setState(() => _items = _extractEndpointItems(data));
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return _MapListScreen(
      title: widget.title,
      loading: _loading,
      error: _error,
      items: _items,
      icon: widget.icon,
      emptyTitle: widget.emptyTitle,
      onRefresh: _load,
    );
  }
}

class EndpointActionScreen extends StatefulWidget {
  final String title;
  final String endpoint;
  final IconData icon;
  final List<String> fields;
  final String submitLabel;

  const EndpointActionScreen({
    super.key,
    required this.title,
    required this.endpoint,
    required this.icon,
    required this.fields,
    required this.submitLabel,
  });

  @override
  State<EndpointActionScreen> createState() => _EndpointActionScreenState();
}

class _EndpointActionScreenState extends State<EndpointActionScreen> {
  final _api = ApiClient();
  final Map<String, TextEditingController> _controllers = {};
  bool _loading = false;
  String? _error;
  dynamic _result;

  @override
  void initState() {
    super.initState();
    for (final field in widget.fields) {
      _controllers[field] = TextEditingController();
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });
    try {
      final body = <String, dynamic>{};
      for (final entry in _controllers.entries) {
        final value = entry.value.text.trim();
        if (value.isNotEmpty) body[entry.key] = value;
      }
      final result = await _api.post<dynamic>(widget.endpoint, data: body);
      if (mounted) setState(() => _result = result);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  String _label(String raw) {
    return raw
        .replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m.group(1)}')
        .replaceAll('_', ' ')
        .trim();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: const [LanguageSwitchAction()],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Icon(widget.icon, size: 48),
          const SizedBox(height: 16),
          for (final field in widget.fields) ...[
            TextField(
              controller: _controllers[field],
              minLines: field.toLowerCase().contains('notes') ||
                      field.toLowerCase().contains('refs') ||
                      field.toLowerCase().contains('content')
                  ? 3
                  : 1,
              maxLines: field.toLowerCase().contains('notes') ||
                      field.toLowerCase().contains('refs') ||
                      field.toLowerCase().contains('content')
                  ? 6
                  : 1,
              decoration: InputDecoration(labelText: _label(field)),
            ),
            const SizedBox(height: 12),
          ],
          ElevatedButton.icon(
            onPressed: _loading ? null : _submit,
            icon: _loading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send),
            label: Text(widget.submitLabel),
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            ErrorRetryWidget(message: _error!, onRetry: _submit),
          ],
          if (_result != null) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(_result.toString()),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

List<dynamic> _extractEndpointItems(dynamic data) {
  if (data is List) return data;
  if (data is Map<String, dynamic>) {
    final content = data['content'];
    if (content is List) return content;
    final items = data['items'];
    if (items is List) return items;
    final dataItems = data['data'];
    if (dataItems is List) return dataItems;
    final opportunities = data['opportunities'];
    if (opportunities is List) return opportunities;
    final permissions = data['permissions'];
    if (permissions is List) {
      return permissions
          .map((permission) => {
                'role': data['role'],
                'permission': permission,
              })
          .toList();
    }
  }
  return const [];
}

class UssdMonitorScreen extends StatelessWidget {
  const UssdMonitorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EndpointListScreen(
      title: _tr(context, 'ussd_sessions'),
      endpoint: '/ussd/sessions',
      icon: Icons.dialpad,
      emptyTitle: _tr(context, 'no_ussd_sessions'),
    );
  }
}

class StaffDeliveryMonitoringScreen extends StatelessWidget {
  const StaffDeliveryMonitoringScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EndpointListScreen(
      title: _tr(context, 'delivery_monitoring'),
      endpoint: '/parcels?size=50',
      icon: Icons.local_shipping_outlined,
      emptyTitle: _tr(context, 'no_delivery_records'),
    );
  }
}

class StaffSupportInboxScreen extends StatelessWidget {
  const StaffSupportInboxScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EndpointListScreen(
      title: _tr(context, 'support_inbox'),
      endpoint: '/support/tickets?size=50',
      icon: Icons.support_agent,
      emptyTitle: _tr(context, 'no_support_tickets'),
    );
  }
}

class _MapListScreen extends StatelessWidget {
  final String title;
  final bool loading;
  final String? error;
  final Future<void> Function() onRefresh;
  final String emptyTitle;
  final List<dynamic> items;
  final IconData icon;

  const _MapListScreen({
    required this.title,
    required this.loading,
    required this.error,
    required this.onRefresh,
    required this.emptyTitle,
    required this.items,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: const [LanguageSwitchAction()],
      ),
      body: loading
          ? const LoadingIndicator()
          : error != null
          ? ErrorRetryWidget(message: error!, onRetry: onRefresh)
          : RefreshIndicator(
              onRefresh: onRefresh,
              child: items.isEmpty
                  ? EmptyStateWidget(icon: icon, title: emptyTitle)
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: items.length,
                      itemBuilder: (_, i) =>
                          _DataCard(item: items[i], icon: icon),
                    ),
            ),
    );
  }
}

class _DataCard extends StatelessWidget {
  final dynamic item;
  final IconData icon;
  final Widget? trailing;

  const _DataCard({required this.item, required this.icon, this.trailing});

  @override
  Widget build(BuildContext context) {
    final map = item is Map<String, dynamic>
        ? item as Map<String, dynamic>
        : <String, dynamic>{'value': item.toString()};
    final title = _firstValue(map, [
      'title',
      'subject',
      'name',
      'invoiceNumber',
      'trackingRef',
      'agencyName',
      'status',
      'id',
    ]);
    final details = map.entries
        .where((e) => e.value != null)
        .take(6)
        .map((e) => '${_label(e.key)}: ${e.value}')
        .join('\n');

    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(
          title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(details, maxLines: 5, overflow: TextOverflow.ellipsis),
        isThreeLine: true,
        trailing: trailing,
      ),
    );
  }

  String _firstValue(Map<String, dynamic> map, List<String> keys) {
    for (final key in keys) {
      final value = map[key];
      if (value != null && value.toString().trim().isNotEmpty) {
        return value.toString();
      }
    }
    return 'Record';
  }

  String _label(String raw) {
    return raw
        .replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m.group(1)}')
        .replaceAll('_', ' ')
        .trim();
  }
}
