import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/models/common.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final notifs = await NotificationService().getNotifications();
      if (mounted) setState(() => _notifications = notifs);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _markAllRead() async {
    try {
      await NotificationService().markAllAsRead();
      _loadNotifications();
    } catch (_) {}
  }

  Future<void> _markRead(String? id) async {
    if (id == null) return;
    try {
      await NotificationService().markAsRead(id);
      _loadNotifications();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('notifications')),
        actions: [
          if (_notifications.isNotEmpty)
            TextButton(
              onPressed: _markAllRead,
              child: Text(
                tr('mark_all_read'),
                style: const TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNotifications,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadNotifications)
            : _notifications.isEmpty
            ? EmptyStateWidget(
                icon: Icons.notifications_none,
                title: tr('no_notifications'),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(8),
                itemCount: _notifications.length,
                itemBuilder: (_, i) {
                  final n = _notifications[i];
                  return Dismissible(
                    key: Key('notif-${n.id}'),
                    direction: DismissDirection.endToStart,
                    onDismissed: (_) => _markRead(n.id),
                    background: Container(
                      alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 16),
                      color: Colors.green,
                      child: const Icon(Icons.check, color: Colors.white),
                    ),
                    child: Card(
                      margin: const EdgeInsets.symmetric(vertical: 2),
                      color: n.read == true ? null : Colors.blue.shade50,
                      child: ListTile(
                        leading: Icon(
                          _notifIcon(n.type),
                          color: n.read == true ? Colors.grey : Colors.blue,
                        ),
                        title: Text(
                          n.title ?? 'Notification',
                          style: TextStyle(
                            fontWeight: n.read == true
                                ? FontWeight.normal
                                : FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (n.message != null)
                              Text(
                                n.message!,
                                style: const TextStyle(fontSize: 12),
                              ),
                            if (n.createdAt != null)
                              Text(
                                n.createdAt!.toString().split('.').first,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                          ],
                        ),
                        isThreeLine: n.message != null,
                        trailing: n.read != true
                            ? const CircleAvatar(
                                radius: 5,
                                backgroundColor: Colors.blue,
                              )
                            : null,
                        onTap: () => _markRead(n.id),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }

  IconData _notifIcon(String? type) {
    switch (type) {
      case 'PARCEL':
        return Icons.inventory_2;
      case 'DELIVERY':
        return Icons.local_shipping;
      case 'PAYMENT':
        return Icons.payment;
      case 'ALERT':
        return Icons.warning_amber;
      default:
        return Icons.notifications;
    }
  }
}
