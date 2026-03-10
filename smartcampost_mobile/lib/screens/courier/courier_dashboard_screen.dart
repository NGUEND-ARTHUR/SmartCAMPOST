import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class CourierDashboardScreen extends StatefulWidget {
  const CourierDashboardScreen({super.key});

  @override
  State<CourierDashboardScreen> createState() => _CourierDashboardScreenState();
}

class _CourierDashboardScreenState extends State<CourierDashboardScreen> {
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
        title: Text(tr('courier_dashboard')),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
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
                  // Welcome
                  Text(
                    '${tr('welcome')}, ${auth.user?.displayName ?? ''}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stats grid
                  Row(
                    children: [
                      _StatCard(
                        title: tr('assigned_pickups'),
                        value: '${_stats['assignedPickups'] ?? 0}',
                        icon: Icons.assignment,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('deliveries_today'),
                        value: '${_stats['deliveriesToday'] ?? 0}',
                        icon: Icons.local_shipping,
                        color: AppTheme.accentColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _StatCard(
                        title: tr('completed'),
                        value: '${_stats['completedDeliveries'] ?? 0}',
                        icon: Icons.check_circle,
                        color: Colors.green,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('pending'),
                        value: '${_stats['pendingDeliveries'] ?? 0}',
                        icon: Icons.pending_actions,
                        color: AppTheme.warningColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick actions
                  SectionTitle(title: tr('actions')),
                  _ActionTile(
                    icon: Icons.qr_code_scanner,
                    title: tr('scan_qr'),
                    subtitle: tr('scan_qr_subtitle'),
                    onTap: () => context.push('/courier/scan'),
                  ),
                  _ActionTile(
                    icon: Icons.local_shipping_outlined,
                    title: tr('my_deliveries'),
                    subtitle: tr('my_deliveries_subtitle'),
                    onTap: () => context.push('/courier/deliveries'),
                  ),
                  _ActionTile(
                    icon: Icons.inventory_2_outlined,
                    title: tr('pickups'),
                    subtitle: tr('assigned_pickups_subtitle'),
                    onTap: () => context.push('/courier/pickups'),
                  ),
                  _ActionTile(
                    icon: Icons.map_outlined,
                    title: tr('route_map'),
                    subtitle: tr('route_map_subtitle'),
                    onTap: () => context.push('/courier/map'),
                  ),
                ],
              ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          switch (i) {
            case 1:
              context.push('/courier/deliveries');
              break;
            case 2:
              context.push('/courier/scan');
              break;
            case 3:
              context.push('/courier/pickups');
              break;
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.dashboard),
            label: tr('home'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.local_shipping),
            label: tr('deliveries'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.qr_code_scanner),
            label: tr('scan'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.inventory_2),
            label: tr('pickups'),
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
