import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class StaffDashboardScreen extends StatefulWidget {
  const StaffDashboardScreen({super.key});

  @override
  State<StaffDashboardScreen> createState() => _StaffDashboardScreenState();
}

class _StaffDashboardScreenState extends State<StaffDashboardScreen> {
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
        title: Text(tr('staff_dashboard')),
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
                  const SizedBox(height: 20),

                  // Overview stats
                  Row(
                    children: [
                      _StatCard(
                        title: tr('total_parcels'),
                        value: '${_stats['totalParcels'] ?? 0}',
                        icon: Icons.inventory_2,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('in_transit'),
                        value: '${_stats['inTransit'] ?? 0}',
                        icon: Icons.local_shipping,
                        color: AppTheme.warningColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _StatCard(
                        title: tr('delivered'),
                        value: '${_stats['delivered'] ?? 0}',
                        icon: Icons.check_circle,
                        color: AppTheme.accentColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('pending_pickups'),
                        value: '${_stats['pendingPickups'] ?? 0}',
                        icon: Icons.pending_actions,
                        color: Colors.orange,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  SectionTitle(title: tr('management')),
                  _ActionTile(
                    icon: Icons.inventory,
                    title: tr('all_parcels'),
                    subtitle: tr('view_manage_parcels'),
                    onTap: () => Navigator.pushNamed(context, '/staff/parcels'),
                  ),
                  _ActionTile(
                    icon: Icons.local_shipping_outlined,
                    title: tr('pickups'),
                    subtitle: tr('manage_pickups'),
                    onTap: () => Navigator.pushNamed(context, '/staff/pickups'),
                  ),
                  _ActionTile(
                    icon: Icons.search,
                    title: tr('track_parcel'),
                    subtitle: tr('track_any_parcel'),
                    onTap: () => Navigator.pushNamed(context, '/staff/track'),
                  ),
                  _ActionTile(
                    icon: Icons.bar_chart,
                    title: tr('analytics'),
                    subtitle: tr('view_analytics'),
                    onTap: () =>
                        Navigator.pushNamed(context, '/staff/analytics'),
                  ),
                  _ActionTile(
                    icon: Icons.warning_amber_outlined,
                    title: tr('congestion_alerts'),
                    subtitle: tr('view_congestion'),
                    onTap: () =>
                        Navigator.pushNamed(context, '/staff/congestion'),
                  ),
                ],
              ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          switch (i) {
            case 1:
              Navigator.pushNamed(context, '/staff/parcels');
              break;
            case 2:
              Navigator.pushNamed(context, '/staff/track');
              break;
            case 3:
              Navigator.pushNamed(context, '/staff/analytics');
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2),
            label: 'Parcels',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Track'),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart),
            label: 'Analytics',
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
