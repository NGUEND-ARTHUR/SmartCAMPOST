import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/providers/parcel_provider.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class ClientDashboardScreen extends StatefulWidget {
  const ClientDashboardScreen({super.key});

  @override
  State<ClientDashboardScreen> createState() => _ClientDashboardScreenState();
}

class _ClientDashboardScreenState extends State<ClientDashboardScreen> {
  @override
  void initState() {
    super.initState();
    final provider = context.read<ParcelProvider>();
    Future.microtask(() {
      provider.loadMyParcels(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final parcels = context.watch<ParcelProvider>();
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('dashboard')),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.language),
            onPressed: () => context.read<LocaleProvider>().toggleLocale(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => parcels.loadMyParcels(refresh: true),
        child: ListView(
          children: [
            // Welcome card
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryColor, Color(0xFF2D5F8A)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${tr('welcome')}, ${auth.user?.displayName ?? ''}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    tr('dashboard_subtitle'),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ),

            // Quick actions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _QuickAction(
                    icon: Icons.add_box_outlined,
                    label: tr('new_parcel'),
                    color: AppTheme.primaryColor,
                    onTap: () => context.push('/client/parcels/create'),
                  ),
                  const SizedBox(width: 12),
                  _QuickAction(
                    icon: Icons.search,
                    label: tr('track'),
                    color: AppTheme.secondaryColor,
                    onTap: () => context.push('/client/track'),
                  ),
                  const SizedBox(width: 12),
                  _QuickAction(
                    icon: Icons.local_shipping_outlined,
                    label: tr('pickups'),
                    color: AppTheme.accentColor,
                    onTap: () => context.push('/client/pickups'),
                  ),
                ],
              ),
            ),

            // Recent parcels
            SectionTitle(
              title: tr('recent_parcels'),
              trailing: TextButton(
                onPressed: () => context.push('/client/parcels'),
                child: Text(tr('see_all')),
              ),
            ),

            if (parcels.isLoading && parcels.parcels.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: LoadingIndicator(),
              )
            else if (parcels.parcels.isEmpty)
              EmptyStateWidget(
                icon: Icons.inbox_outlined,
                title: tr('no_parcels'),
                action: ElevatedButton.icon(
                  onPressed: () => context.push('/client/parcels/create'),
                  icon: const Icon(Icons.add),
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

            const SizedBox(height: 24),
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
        break; // Already on dashboard
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

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ClientBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _ClientBottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      items: [
        BottomNavigationBarItem(
          icon: const Icon(Icons.dashboard),
          label: tr('home'),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.inventory_2),
          label: tr('parcels'),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.search),
          label: tr('track'),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.support_agent),
          label: tr('support'),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.person),
          label: tr('profile'),
        ),
      ],
    );
  }
}
