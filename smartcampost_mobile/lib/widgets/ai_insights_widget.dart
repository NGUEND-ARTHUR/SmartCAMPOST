import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';

const _healthColors = {
  'HEALTHY': AppTheme.successColor,
  'DEGRADED': AppTheme.warningColor,
  'OFFLINE': AppTheme.textTertiary,
};

const _priorityColors = {
  'HIGH': Color(0xFFDC2626),
  'MEDIUM': Color(0xFFD97706),
  'LOW': AppTheme.textTertiary,
};

class AIInsightsWidget extends StatefulWidget {
  final EdgeInsetsGeometry margin;

  const AIInsightsWidget({
    super.key,
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
  });

  @override
  State<AIInsightsWidget> createState() => _AIInsightsWidgetState();
}

class _AIInsightsWidgetState extends State<AIInsightsWidget> {
  final AiService _aiService = AiService();
  AgentStatusResponse? _status;
  bool _loading = true;
  bool _failed = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final status = await _aiService.getAgentStatus();
      if (mounted) {
        setState(() {
          _status = status;
          _loading = false;
          _failed = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_failed && _status == null) return const SizedBox.shrink();
    final tr = context.read<LocaleProvider>().tr;

    return Card(
      margin: widget.margin,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, size: 18, color: AppTheme.primaryColor),
                    const SizedBox(width: 6),
                    Text(tr('ai_insights'), style: AppTheme.heading4),
                  ],
                ),
                if (_status?.agentHealth != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: (_healthColors[_status!.agentHealth] ?? AppTheme.textTertiary)
                          .withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _status!.agentHealth!,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: _healthColors[_status!.agentHealth] ?? AppTheme.textTertiary,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                ),
              )
            else ...[
              if (_status?.summary != null) ...[
                Text(_status!.summary!, style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary)),
                const SizedBox(height: 8),
              ],
              if ((_status?.recommendations ?? []).isEmpty)
                Text(
                  tr('ai_insights_none'),
                  style: AppTheme.caption,
                )
              else
                ...(_status!.recommendations.map((rec) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceElevated,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.lightbulb_outline, size: 16, color: AppTheme.primaryColor),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          rec.title,
                                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                        ),
                                      ),
                                      if (rec.priority != null) ...[
                                        const SizedBox(width: 6),
                                        Text(
                                          rec.priority!,
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: _priorityColors[rec.priority] ?? AppTheme.textTertiary,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  if (rec.description != null) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      rec.description!,
                                      style: AppTheme.caption,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ))),
            ],
          ],
        ),
      ),
    );
  }
}
