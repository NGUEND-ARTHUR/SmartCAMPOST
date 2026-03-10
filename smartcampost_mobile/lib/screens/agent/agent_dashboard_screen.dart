import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class AgentDashboardScreen extends StatefulWidget {
  const AgentDashboardScreen({super.key});

  @override
  State<AgentDashboardScreen> createState() => _AgentDashboardScreenState();
}

class _AgentDashboardScreenState extends State<AgentDashboardScreen> {
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    try {
      final stats = await DashboardService().getDashboardStats();
      if (mounted) setState(() => _stats = stats);
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('agent_dashboard')),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (!context.mounted) return;
              context.go('/login');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
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
                  if (auth.user?.agencyName != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      auth.user!.agencyName!,
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                  ],
                  const SizedBox(height: 20),

                  // Stats
                  Row(
                    children: [
                      _StatCard(
                        title: tr('parcels_today'),
                        value: '${_stats['parcelsToday'] ?? 0}',
                        icon: Icons.inventory_2,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('scanned'),
                        value: '${_stats['scannedToday'] ?? 0}',
                        icon: Icons.qr_code_scanner,
                        color: AppTheme.accentColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _StatCard(
                        title: tr('pending_validation'),
                        value: '${_stats['pendingValidation'] ?? 0}',
                        icon: Icons.pending,
                        color: AppTheme.warningColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('pickups_today'),
                        value: '${_stats['pickupsToday'] ?? 0}',
                        icon: Icons.local_shipping,
                        color: Colors.purple,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  SectionTitle(title: tr('actions')),
                  _ActionTile(
                    icon: Icons.qr_code_scanner,
                    title: tr('scan_parcel'),
                    subtitle: tr('scan_parcel_subtitle'),
                    onTap: () => context.push('/agent/scan'),
                  ),
                  _ActionTile(
                    icon: Icons.add_box_outlined,
                    title: tr('receive_parcel'),
                    subtitle: tr('receive_parcel_subtitle'),
                    onTap: () => context.push('/agent/intake'),
                  ),
                  _ActionTile(
                    icon: Icons.check_circle_outline,
                    title: tr('validate_parcels'),
                    subtitle: tr('validate_parcels_subtitle'),
                    onTap: () => context.push('/agent/validate'),
                  ),
                  _ActionTile(
                    icon: Icons.inventory,
                    title: tr('all_parcels'),
                    subtitle: tr('manage_agency_parcels'),
                    onTap: () => context.push('/agent/parcels'),
                  ),
                  _ActionTile(
                    icon: Icons.people_outline,
                    title: tr('assign_courier'),
                    subtitle: tr('assign_courier_subtitle'),
                    onTap: () => context.push('/agent/assign-courier'),
                  ),
                ],
              ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          switch (i) {
            case 1:
              context.push('/agent/scan');
              break;
            case 2:
              context.push('/agent/parcels');
              break;
            case 3:
              context.push('/agent/validate');
              break;
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.dashboard),
            label: tr('home'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.qr_code_scanner),
            label: tr('scan'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.inventory_2),
            label: tr('parcels'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.check_circle),
            label: tr('validate'),
          ),
        ],
      ),
    );
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
