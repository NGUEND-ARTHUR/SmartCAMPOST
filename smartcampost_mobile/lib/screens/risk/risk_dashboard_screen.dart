import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class RiskDashboardScreen extends StatefulWidget {
  const RiskDashboardScreen({super.key});

  @override
  State<RiskDashboardScreen> createState() => _RiskDashboardScreenState();
}

class _RiskDashboardScreenState extends State<RiskDashboardScreen> {
  Map<String, dynamic> _stats = {};
  List<dynamic> _alerts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        DashboardService().getDashboardStats(),
        ComplianceService().getRiskAlerts(),
      ]);
      if (mounted) {
        setState(() {
          _stats = results[0] as Map<String, dynamic>;
          _alerts = results[1] as List<dynamic>;
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('risk_dashboard')),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (!context.mounted) return;
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const LoadingIndicator()
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    '${tr('welcome')}, ${auth.user?.displayName ?? ''}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),

                  Row(
                    children: [
                      _StatCard(
                        title: tr('active_alerts'),
                        value: '${_stats['activeAlerts'] ?? _alerts.length}',
                        icon: Icons.warning_amber,
                        color: Colors.red,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('high_risk'),
                        value: '${_stats['highRiskParcels'] ?? 0}',
                        icon: Icons.security,
                        color: AppTheme.warningColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _StatCard(
                        title: tr('compliance_score'),
                        value: '${_stats['complianceScore'] ?? 95}%',
                        icon: Icons.verified_user,
                        color: AppTheme.accentColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('fraud_attempts'),
                        value: '${_stats['fraudAttempts'] ?? 0}',
                        icon: Icons.gpp_bad,
                        color: Colors.deepOrange,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  SectionTitle(title: tr('actions')),
                  _ActionTile(
                    icon: Icons.warning_amber_outlined,
                    title: tr('compliance_alerts'),
                    subtitle: tr('view_compliance_alerts'),
                    onTap: () => Navigator.pushNamed(context, '/risk/alerts'),
                  ),
                  _ActionTile(
                    icon: Icons.security,
                    title: tr('risk_alerts'),
                    subtitle: tr('view_risk_alerts'),
                    onTap: () =>
                        Navigator.pushNamed(context, '/risk/risk-alerts'),
                  ),
                  _ActionTile(
                    icon: Icons.history,
                    title: tr('audit_logs'),
                    subtitle: tr('view_audit_trail'),
                    onTap: () => Navigator.pushNamed(context, '/risk/audit'),
                  ),
                  const SizedBox(height: 24),

                  // Recent alerts
                  if (_alerts.isNotEmpty) ...[
                    SectionTitle(title: tr('recent_alerts')),
                    ..._alerts.take(5).map((alert) {
                      final a = alert is Map ? alert : {};
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 3),
                        child: ListTile(
                          leading: Icon(
                            _alertIcon(a['severity']?.toString()),
                            color: _alertColor(a['severity']?.toString()),
                          ),
                          title: Text(
                            a['message']?.toString() ??
                                a['type']?.toString() ??
                                'Alert',
                            style: const TextStyle(fontSize: 14),
                          ),
                          subtitle: Text(
                            a['createdAt']?.toString().split('T').first ?? '',
                            style: const TextStyle(fontSize: 12),
                          ),
                          trailing: Chip(
                            label: Text(
                              a['severity']?.toString() ?? 'INFO',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Colors.white,
                              ),
                            ),
                            backgroundColor: _alertColor(
                              a['severity']?.toString(),
                            ),
                            padding: EdgeInsets.zero,
                          ),
                        ),
                      );
                    }),
                  ],
                ],
              ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          switch (i) {
            case 1:
              Navigator.pushNamed(context, '/risk/alerts');
              break;
            case 2:
              Navigator.pushNamed(context, '/risk/audit');
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.warning_amber),
            label: 'Alerts',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'Audit'),
        ],
      ),
    );
  }

  IconData _alertIcon(String? severity) {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return Icons.error;
      case 'MEDIUM':
        return Icons.warning;
      default:
        return Icons.info_outline;
    }
  }

  Color _alertColor(String? severity) {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return Colors.red;
      case 'MEDIUM':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
          child: Icon(icon, color: AppTheme.primaryColor),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
