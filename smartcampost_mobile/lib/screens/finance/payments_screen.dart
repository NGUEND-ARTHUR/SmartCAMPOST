import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/payment.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  List<Payment> _payments = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      // Payment listing would use a generic endpoint; adapting to available service
      // In production, DashboardService or a dedicated endpoint would list all payments
      if (mounted) setState(() => _payments = []);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  void _showPaymentDetail(Payment payment) {
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment #${payment.id}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const Divider(),
            InfoRow(
              label: 'Amount',
              value: '${payment.amount} ${payment.currency ?? 'XAF'}',
            ),
            InfoRow(label: 'Method', value: payment.method ?? '-'),
            InfoRow(label: 'Status', value: payment.status ?? '-'),
            InfoRow(label: 'Parcel ID', value: payment.parcelId ?? '-'),
            InfoRow(label: 'Ref', value: payment.externalRef ?? '-'),
            InfoRow(
              label: 'Date',
              value: payment.timestamp?.toString().split('.').first ?? '-',
            ),
            if (payment.reversed == true)
              const Chip(
                label: Text('REVERSED'),
                color: WidgetStatePropertyAll(Colors.red),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('payments'))),
      body: RefreshIndicator(
        onRefresh: _loadPayments,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadPayments)
            : _payments.isEmpty
            ? EmptyStateWidget(icon: Icons.payment, title: tr('no_payments'))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _payments.length,
                itemBuilder: (_, i) {
                  final p = _payments[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 3),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _statusColor(
                          p.status,
                        ).withValues(alpha: 0.15),
                        child: Icon(
                          Icons.payment,
                          color: _statusColor(p.status),
                        ),
                      ),
                      title: Text(
                        '${p.amount} ${p.currency ?? 'XAF'}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text('${p.method ?? '-'} • ${p.status ?? '-'}'),
                      trailing: Text(
                        p.timestamp?.toString().split('T').first ?? '',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.grey,
                        ),
                      ),
                      onTap: () => _showPaymentDetail(p),
                    ),
                  );
                },
              ),
      ),
    );
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'COMPLETED':
        return AppTheme.accentColor;
      case 'PENDING':
        return AppTheme.warningColor;
      case 'FAILED':
        return Colors.red;
      case 'REVERSED':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
