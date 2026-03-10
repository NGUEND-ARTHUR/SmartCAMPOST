import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
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
        title: Text(tr('admin_dashboard')),
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
                    '${tr('welcome')}, ${auth.user?.displayName ?? 'Admin'}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stats grid
                  Row(
                    children: [
                      _StatCard(
                        title: tr('users'),
                        value: '${_stats['totalUsers'] ?? 0}',
                        icon: Icons.people,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('agencies'),
                        value: '${_stats['totalAgencies'] ?? 0}',
                        icon: Icons.business,
                        color: Colors.teal,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _StatCard(
                        title: tr('total_parcels'),
                        value: '${_stats['totalParcels'] ?? 0}',
                        icon: Icons.inventory_2,
                        color: AppTheme.warningColor,
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        title: tr('revenue'),
                        value: '${_stats['totalRevenue'] ?? 0}',
                        icon: Icons.attach_money,
                        color: AppTheme.accentColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  SectionTitle(title: tr('administration')),
                  _ActionTile(
                    icon: Icons.people_outline,
                    title: tr('user_management'),
                    subtitle: tr('manage_users_subtitle'),
                    onTap: () => context.push('/admin/users'),
                  ),
                  _ActionTile(
                    icon: Icons.calculate_outlined,
                    title: tr('tariffs'),
                    subtitle: tr('manage_tariffs_subtitle'),
                    onTap: () => context.push('/admin/tariffs'),
                  ),
                  _ActionTile(
                    icon: Icons.inventory,
                    title: tr('all_parcels'),
                    subtitle: tr('view_all_parcels'),
                    onTap: () => context.push('/admin/parcels'),
                  ),
                  _ActionTile(
                    icon: Icons.bar_chart,
                    title: tr('analytics'),
                    subtitle: tr('system_analytics'),
                    onTap: () => context.push('/admin/analytics'),
                  ),
                  _ActionTile(
                    icon: Icons.security,
                    title: tr('audit_logs'),
                    subtitle: tr('view_audit_logs'),
                    onTap: () => context.push('/admin/audit'),
                  ),
                  _ActionTile(
                    icon: Icons.warning_amber,
                    title: tr('risk_alerts'),
                    subtitle: tr('view_risk_alerts'),
                    onTap: () => context.push('/admin/risk'),
                  ),
                ],
              ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: (i) {
          switch (i) {
            case 1:
              context.push('/admin/users');
              break;
            case 2:
              context.push('/admin/parcels');
              break;
            case 3:
              context.push('/admin/analytics');
              break;
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.dashboard),
            label: tr('home'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.people),
            label: tr('users'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.inventory_2),
            label: tr('parcels'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.bar_chart),
            label: tr('analytics'),
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
