import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/ai_insights_widget.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';
import 'package:smartcampost_mobile/widgets/shimmer.dart';

class ClientDashboardScreen extends StatefulWidget {
  const ClientDashboardScreen({super.key});

  @override
  State<ClientDashboardScreen> createState() => _ClientDashboardScreenState();
}

class _ClientDashboardScreenState extends State<ClientDashboardScreen> {
  int _unreadNotifications = 0;

  @override
  void initState() {
    super.initState();
    final provider = context.read<ParcelProvider>();
    Future.microtask(() {
      provider.loadMyParcels(refresh: true);
    });
    _loadUnreadCount();
  }

  Future<void> _loadUnreadCount() async {
    try {
      final count = await NotificationService().getUnreadCount();
      if (mounted) setState(() => _unreadNotifications = count);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final parcels = context.watch<ParcelProvider>();
    final tr = context.read<LocaleProvider>().tr;
    final name = auth.user?.displayName ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${tr('welcome')}, $name', style: AppTheme.heading4),
            Text(tr('dashboard_subtitle'), style: AppTheme.caption),
          ],
        ),
        toolbarHeight: 64,
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: _unreadNotifications > 0,
              label: Text(
                _unreadNotifications > 99 ? '99+' : '$_unreadNotifications',
              ),
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () async {
              await context.push('/notifications');
              _loadUnreadCount();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/ai-chat'),
        child: const Icon(Icons.smart_toy, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: () => parcels.loadMyParcels(refresh: true),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            // ─── KPI Stats Row ───
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  _KpiCard(
                    icon: Icons.inventory_2_outlined,
                    label: tr('total_parcels'),
                    value: '${parcels.parcels.length}',
                    color: AppTheme.primaryColor,
                  ),
                  const SizedBox(width: 10),
                  _KpiCard(
                    icon: Icons.local_shipping_outlined,
                    label: tr('in_transit'),
                    value: '${parcels.parcels.where((p) => p.status == 'IN_TRANSIT' || p.status == 'OUT_FOR_DELIVERY').length}',
                    color: AppTheme.accentColor,
                  ),
                  const SizedBox(width: 10),
                  _KpiCard(
                    icon: Icons.check_circle_outline,
                    label: tr('delivered'),
                    value: '${parcels.parcels.where((p) => p.status == 'DELIVERED').length}',
                    color: AppTheme.successColor,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const AIInsightsWidget(),
            const SizedBox(height: 12),

            // ─── Quick Actions Grid ───
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(tr('quick_actions'), style: AppTheme.heading4),
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _QuickAction(
                    icon: Icons.add_circle_outline,
                    label: tr('new_parcel'),
                    color: AppTheme.primaryColor,
                    onTap: () => context.push('/client/parcels/create'),
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.qr_code_scanner,
                    label: tr('track'),
                    color: AppTheme.accentColor,
                    onTap: () => context.push('/client/track'),
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.schedule_outlined,
                    label: tr('pickups'),
                    color: AppTheme.infoColor,
                    onTap: () => context.push('/client/pickups'),
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.receipt_long_outlined,
                    label: tr('payments'),
                    color: AppTheme.successColor,
                    onTap: () => context.push('/client/payments'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ─── Recent Parcels ───
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(tr('recent_parcels'), style: AppTheme.heading4),
                  TextButton(
                    onPressed: () => context.push('/client/parcels'),
                    child: Text(tr('view_all'), style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                ],
              ),
            ),

            if (parcels.isLoading && parcels.parcels.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 0, vertical: 8),
                child: ShimmerParcelList(count: 3),
              )
            else if (parcels.parcels.isEmpty)
              EmptyStateWidget(
                icon: Icons.inbox_outlined,
                title: tr('no_parcels'),
                subtitle: tr('no_parcels_subtitle'),
                action: ElevatedButton.icon(
                  onPressed: () => context.push('/client/parcels/create'),
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(tr('new_parcel')),
                ),
              )
            else
              ...parcels.parcels
                  .take(5)
                  .map(
                    (p) => ParcelCard(
                      trackingRef: p.displayRef,
                      status: p.status,
                      senderCity: p.senderCity,
                      recipientCity: p.recipientCity,
                      createdAt: p.createdAt,
                      onTap: () => context.push('/client/parcels/${p.id}'),
                    ),
                  ),
          ],
        ),
      ),
      bottomNavigationBar: _ClientBottomNav(
        currentIndex: 0,
        onTap: (i) => _onNavTap(context, i),
      ),
    );
  }

  void _onNavTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        break;
      case 1:
        context.push('/client/parcels');
        break;
      case 2:
        context.push('/client/track');
        break;
      case 3:
        context.push('/client/support');
        break;
      case 4:
        context.push('/profile');
        break;
    }
  }
}

// ─── KPI Stat Card ───

class _KpiCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _KpiCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderColor),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 10),
            Text(value, style: AppTheme.heading2.copyWith(fontSize: 22)),
            const SizedBox(height: 2),
            Text(label, style: AppTheme.caption.copyWith(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

// ─── Quick Action Button ───

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color.withValues(alpha: 0.15)),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: AppTheme.caption.copyWith(fontWeight: FontWeight.w600, fontSize: 11),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Bottom Navigation ───

class _ClientBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _ClientBottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: const Border(top: BorderSide(color: AppTheme.borderColor, width: 0.5)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard, label: tr('home'), isActive: currentIndex == 0, onTap: () => onTap(0)),
              _NavItem(icon: Icons.inventory_2_outlined, activeIcon: Icons.inventory_2, label: tr('parcels'), isActive: currentIndex == 1, onTap: () => onTap(1)),
              _NavItem(icon: Icons.search, activeIcon: Icons.search, label: tr('track'), isActive: currentIndex == 2, onTap: () => onTap(2)),
              _NavItem(icon: Icons.support_agent_outlined, activeIcon: Icons.support_agent, label: tr('support'), isActive: currentIndex == 3, onTap: () => onTap(3)),
              _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: tr('profile'), isActive: currentIndex == 4, onTap: () => onTap(4)),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({required this.icon, required this.activeIcon, required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: isActive ? AppTheme.primaryColor.withValues(alpha: 0.1) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isActive ? activeIcon : icon,
                size: 24,
                color: isActive ? AppTheme.primaryColor : AppTheme.textTertiary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                color: isActive ? AppTheme.primaryColor : AppTheme.textTertiary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
