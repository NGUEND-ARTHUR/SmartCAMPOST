import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/models/common.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ComplianceAlertsScreen extends StatefulWidget {
  const ComplianceAlertsScreen({super.key});

  @override
  State<ComplianceAlertsScreen> createState() => _ComplianceAlertsScreenState();
}

class _ComplianceAlertsScreenState extends State<ComplianceAlertsScreen> {
  List<CongestionAlert> _alerts = [];
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
          () => _alerts = raw
              .whereType<Map<String, dynamic>>()
              .map((e) => CongestionAlert.fromJson(e))
              .toList(),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
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
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 3),
                    child: ListTile(
                      leading: Icon(
                        _levelIcon(alert.congestionLevel),
                        color: _levelColor(alert.congestionLevel),
                        size: 28,
                      ),
                      title: Text(
                        alert.agencyName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${tr('parcels')}: ${alert.parcelCount} / ${tr('threshold')}: ${alert.threshold}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          Text(
                            alert.detectedAt.split('.').first,
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[500],
                            ),
                          ),
                          if (alert.suggestedActions.isNotEmpty)
                            Text(
                              alert.suggestedActions.join(', '),
                              style: const TextStyle(fontSize: 11),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                      isThreeLine: true,
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _levelColor(
                            alert.congestionLevel,
                          ).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${tr('level')} ${alert.congestionLevel}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _levelColor(alert.congestionLevel),
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

  IconData _levelIcon(int level) {
    if (level >= 3) return Icons.error;
    if (level == 2) return Icons.warning;
    return Icons.info;
  }

  Color _levelColor(int level) {
    if (level >= 3) return Colors.red;
    if (level == 2) return Colors.orange;
    return Colors.blue;
  }
}
