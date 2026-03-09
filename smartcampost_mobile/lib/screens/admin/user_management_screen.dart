import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/user.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<User> _agents = [];
  List<User> _couriers = [];
  List<User> _clients = [];
  List<User> _staff = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadUsers();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final svc = UserManagementService();
      final results = await Future.wait([
        svc.getAgents(),
        svc.getCouriers(),
        svc.getClients(),
        svc.getStaff(),
      ]);
      if (mounted) {
        setState(() {
          _agents = (results[0])
              .map((e) => User.fromJson(e as Map<String, dynamic>))
              .toList();
          _couriers = (results[1])
              .map((e) => User.fromJson(e as Map<String, dynamic>))
              .toList();
          _clients = (results[2])
              .map((e) => User.fromJson(e as Map<String, dynamic>))
              .toList();
          _staff = (results[3])
              .map((e) => User.fromJson(e as Map<String, dynamic>))
              .toList();
        });
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
      appBar: AppBar(
        title: Text(tr('user_management')),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: '${tr('agents')} (${_agents.length})'),
            Tab(text: '${tr('couriers')} (${_couriers.length})'),
            Tab(text: '${tr('clients')} (${_clients.length})'),
            Tab(text: '${tr('staff')} (${_staff.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const LoadingIndicator()
          : _error != null
          ? ErrorRetryWidget(message: _error!, onRetry: _loadUsers)
          : TabBarView(
              controller: _tabController,
              children: [
                _UserList(users: _agents, onRefresh: _loadUsers),
                _UserList(users: _couriers, onRefresh: _loadUsers),
                _UserList(users: _clients, onRefresh: _loadUsers),
                _UserList(users: _staff, onRefresh: _loadUsers),
              ],
            ),
    );
  }
}

class _UserList extends StatelessWidget {
  final List<User> users;
  final Future<void> Function() onRefresh;

  const _UserList({required this.users, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (users.isEmpty) {
      return const EmptyStateWidget(
        icon: Icons.people_outline,
        title: 'No users found',
      );
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: users.length,
        itemBuilder: (_, i) => _UserCard(user: users[i]),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final User user;
  const _UserCard({required this.user});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 3),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
          child: Text(
            user.displayName.isNotEmpty
                ? user.displayName[0].toUpperCase()
                : '?',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
        ),
        title: Text(
          user.displayName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (user.email != null)
              Text(user.email!, style: const TextStyle(fontSize: 12)),
            if (user.phone != null)
              Text(user.phone!, style: const TextStyle(fontSize: 12)),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    user.role,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  user.active == true ? Icons.check_circle : Icons.cancel,
                  size: 14,
                  color: user.active == true ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 2),
                Text(
                  user.active == true ? 'Active' : 'Inactive',
                  style: TextStyle(
                    fontSize: 11,
                    color: user.active == true ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
        isThreeLine: true,
        trailing: user.agencyName != null
            ? Chip(
                label: Text(
                  user.agencyName!,
                  style: const TextStyle(fontSize: 10),
                ),
                padding: EdgeInsets.zero,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              )
            : null,
      ),
    );
  }
}
