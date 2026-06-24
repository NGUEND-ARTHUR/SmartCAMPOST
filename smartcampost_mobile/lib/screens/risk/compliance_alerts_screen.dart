import 'package:smartcampost_mobile/core/theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ComplianceAlertsScreen extends StatefulWidget {
  const ComplianceAlertsScreen({super.key});

  @override
  State<ComplianceAlertsScreen> createState() => _ComplianceAlertsScreenState();
}

class _ComplianceAlertsScreenState extends State<ComplianceAlertsScreen> {
  List<Map<String, dynamic>> _alerts = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final raw = await ComplianceService().getAlerts();
      if (mounted) {
        setState(
          () => _alerts = raw.whereType<Map<String, dynamic>>().toList(),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _resolve(Map<String, dynamic> alert) async {
    final id = alert['id']?.toString();
    if (id == null) return;
    final tr = context.read<LocaleProvider>().tr;
    final note = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final controller = TextEditingController();
        return AlertDialog(
          title: Text(tr('resolve_alert')),
          content: TextField(
            controller: controller,
            decoration: InputDecoration(labelText: tr('resolution_note')),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(tr('cancel')),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: Text(tr('resolve')),
            ),
          ],
        );
      },
    );
    if (note == null) return;
    try {
      await ComplianceService().updateAlert(id, {
        'resolved': true,
        'resolutionNote': note,
      });
      await _loadAlerts();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('compliance_alerts'))),
      body: RefreshIndicator(
        onRefresh: _loadAlerts,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadAlerts)
            : _alerts.isEmpty
            ? EmptyStateWidget(icon: Icons.check_circle, title: tr('no_alerts'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _alerts.length,
                itemBuilder: (_, i) {
                  final alert = _alerts[i];
                  final severity = alert['severity']?.toString() ?? 'LOW';
                  final resolved = alert['resolved'] == true;
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 3),
                    child: ListTile(
                      leading: Icon(
                        _levelIcon(severity),
                        color: resolved ? Colors.grey : _levelColor(severity),
                        size: 28,
                      ),
                      title: Text(
                        alert['description']?.toString() ??
                            alert['alertType']?.toString() ??
                            tr('alerts'),
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${alert['alertType'] ?? ''} — ${alert['status'] ?? ''}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          Text(
                            alert['createdAt']?.toString().split('T').first ??
                                '',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textTertiary,
                            ),
                          ),
                        ],
                      ),
                      isThreeLine: true,
                      onTap: resolved ? null : () => _resolve(alert),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: (resolved ? Colors.green : _levelColor(severity))
                              .withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          resolved ? tr('resolved') : severity,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: resolved ? Colors.green : _levelColor(severity),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }

  IconData _levelIcon(String severity) {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return Icons.error;
      case 'MEDIUM':
        return Icons.warning;
      default:
        return Icons.info;
    }
  }

  Color _levelColor(String severity) {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return Colors.red;
      case 'MEDIUM':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }
}
