import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';

class ParcelChatWidget extends StatefulWidget {
  final String parcelId;
  final EdgeInsetsGeometry margin;

  const ParcelChatWidget({
    super.key,
    required this.parcelId,
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
  });

  @override
  State<ParcelChatWidget> createState() => _ParcelChatWidgetState();
}

class _ParcelChatWidgetState extends State<ParcelChatWidget> {
  final ParcelMessageService _service = ParcelMessageService();
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<ParcelMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String? _error;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _load(initial: true);
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) => _load());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load({bool initial = false}) async {
    try {
      final messages = await _service.list(widget.parcelId);
      if (!mounted) return;
      setState(() {
        _messages = messages;
        _loading = false;
        _error = null;
      });
      if (messages.any((m) => !m.mine && !m.read)) {
        _service.markRead(widget.parcelId).catchError((_) {});
      }
      if (initial) _scrollToBottom();
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = initial ? e.toString() : _error;
        });
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final sent = await _service.send(widget.parcelId, text);
      _controller.clear();
      if (mounted) {
        setState(() => _messages = [..._messages, sent]);
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
    if (mounted) setState(() => _sending = false);
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Card(
      margin: widget.margin,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.chat_bubble_outline, size: 18, color: AppTheme.primaryColor),
                const SizedBox(width: 6),
                Text(tr('parcel_chat'), style: AppTheme.heading4),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 260,
              child: _loading
                  ? const Center(
                      child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  : _error != null
                      ? Center(
                          child: Text(
                            tr('chat_load_error'),
                            style: const TextStyle(color: AppTheme.errorColor, fontSize: 12),
                          ),
                        )
                      : _messages.isEmpty
                          ? Center(
                              child: Text(
                                tr('no_messages_yet'),
                                style: AppTheme.caption,
                              ),
                            )
                          : ListView.builder(
                              controller: _scrollController,
                              itemCount: _messages.length,
                              itemBuilder: (context, i) => _MessageBubble(message: _messages[i]),
                            ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    minLines: 1,
                    maxLines: 3,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    decoration: InputDecoration(
                      hintText: tr('type_a_message'),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: AppTheme.surfaceElevated,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Material(
                  color: _sending ? Colors.grey : AppTheme.primaryColor,
                  shape: const CircleBorder(),
                  child: InkWell(
                    onTap: _sending ? null : _send,
                    customBorder: const CircleBorder(),
                    child: const Padding(
                      padding: EdgeInsets.all(10),
                      child: Icon(Icons.send, color: Colors.white, size: 18),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ParcelMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isMine = message.mine;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (!isMine && message.senderName != null)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 2),
              child: Text(
                '${message.senderName}${message.senderRole != null ? ' (${message.senderRole})' : ''}',
                style: AppTheme.caption.copyWith(fontSize: 10),
              ),
            ),
          Align(
            alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.65),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isMine ? AppTheme.primaryColor : AppTheme.surfaceElevated,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(14),
                  topRight: const Radius.circular(14),
                  bottomLeft: Radius.circular(isMine ? 14 : 4),
                  bottomRight: Radius.circular(isMine ? 4 : 14),
                ),
              ),
              child: Text(
                message.content,
                style: TextStyle(
                  color: isMine ? Colors.white : AppTheme.textPrimary,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
