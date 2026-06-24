import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/auth_provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class TicketDetailScreen extends StatefulWidget {
  final String ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  final _replyController = TextEditingController();
  Map<String, dynamic>? _ticket;
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTicket();
  }

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _loadTicket() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final t = await SupportService().getTicketById(widget.ticketId);
      final ticket = <String, dynamic>{
        'subject': t.subject,
        'status': t.status ?? '',
        'category': t.category ?? '',
        'message': t.description ?? '',
      };
      if (mounted) setState(() { _ticket = ticket; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _sendReply() async {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;
    setState(() => _isSending = true);
    try {
      await SupportService().replyToTicket(widget.ticketId, text);
      _replyController.clear();
      await _loadTicket();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
    if (mounted) setState(() => _isSending = false);
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;
    final role = context.read<AuthProvider>().userRole.toUpperCase();
    final canReply = role != 'CLIENT';

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(tr('ticket'))),
        body: const LoadingIndicator(),
      );
    }
    if (_error != null || _ticket == null) {
      return Scaffold(
        appBar: AppBar(title: Text(tr('ticket'))),
        body: ErrorRetryWidget(message: _error ?? 'Not found', onRetry: _loadTicket),
      );
    }

    final subject = _ticket!['subject'] as String? ?? '';
    final status = _ticket!['status'] as String? ?? '';
    final category = _ticket!['category'] as String? ?? '';
    final message = _ticket!['message'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text(tr('ticket')),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: StatusBadge(status: status),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadTicket,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Subject header
                  Text(subject, style: AppTheme.heading3),
                  const SizedBox(height: 4),
                  Text(category, style: AppTheme.caption),
                  const SizedBox(height: 16),

                  // Message thread
                  ..._parseMessages(message),
                ],
              ),
            ),
          ),

          // Reply input (staff/admin only)
          if (canReply)
            Container(
              padding: EdgeInsets.fromLTRB(12, 8, 8, MediaQuery.of(context).padding.bottom + 8),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                border: const Border(top: BorderSide(color: AppTheme.borderColor)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _replyController,
                      enabled: !_isSending,
                      maxLines: 3,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: tr('chat_message'),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: AppTheme.surfaceElevated,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: _isSending ? AppTheme.borderColor : AppTheme.primaryColor,
                    shape: const CircleBorder(),
                    child: InkWell(
                      onTap: _isSending ? null : _sendReply,
                      customBorder: const CircleBorder(),
                      child: const Padding(
                        padding: EdgeInsets.all(12),
                        child: Icon(Icons.send, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  List<Widget> _parseMessages(String message) {
    final parts = message.split(RegExp(r'\n\n\[REPLY\]'));
    final widgets = <Widget>[];

    for (int i = 0; i < parts.length; i++) {
      final text = parts[i].trim();
      if (text.isEmpty) continue;
      final isOriginal = i == 0;

      widgets.add(
        Container(
          margin: EdgeInsets.only(
            bottom: 10,
            left: isOriginal ? 0 : 40,
            right: isOriginal ? 40 : 0,
          ),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isOriginal ? AppTheme.surfaceElevated : AppTheme.primaryColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: isOriginal ? null : Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.15)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isOriginal ? 'Client' : 'Staff',
                style: AppTheme.overline.copyWith(
                  color: isOriginal ? AppTheme.textSecondary : AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 6),
              Text(text, style: AppTheme.bodyMedium),
            ],
          ),
        ),
      );
    }

    if (widgets.isEmpty) {
      widgets.add(Text(message, style: AppTheme.bodyMedium));
    }

    return widgets;
  }
}
