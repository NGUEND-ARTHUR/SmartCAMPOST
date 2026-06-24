import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/payment_service.dart';
import 'package:smartcampost_mobile/widgets/success_animation.dart';

class MomoPaymentScreen extends StatefulWidget {
  final String parcelId;
  final double amount;
  final String? trackingRef;

  const MomoPaymentScreen({
    super.key,
    required this.parcelId,
    required this.amount,
    this.trackingRef,
  });

  @override
  State<MomoPaymentScreen> createState() => _MomoPaymentScreenState();
}

class _MomoPaymentScreenState extends State<MomoPaymentScreen> {
  final _phoneController = TextEditingController();
  String _provider = 'MTN';
  String _status = 'idle'; // idle | pending | polling | success | failed
  String? _paymentId;
  String? _error;
  Timer? _pollTimer;
  int _pollCount = 0;

  @override
  void dispose() {
    _phoneController.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _initPayment() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) return;

    setState(() { _status = 'pending'; _error = null; });

    try {
      final payment = await PaymentService().initPayment({
        'parcelId': widget.parcelId,
        'method': 'MOBILE_MONEY',
        'provider': _provider,
        'phone': phone,
        'amount': widget.amount,
        'currency': 'XAF',
      });

      _paymentId = payment.id;
      setState(() => _status = 'polling');
      _startPolling();
    } catch (e) {
      setState(() { _status = 'failed'; _error = e.toString(); });
    }
  }

  void _startPolling() {
    _pollCount = 0;
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      _pollCount++;
      if (_pollCount > 24) { // 2 minutes max
        timer.cancel();
        setState(() { _status = 'failed'; _error = 'Payment timed out. Check your phone for a prompt.'; });
        return;
      }

      try {
        final payment = await PaymentService().getPaymentById(_paymentId!);
        if (payment.status == 'SUCCESS') {
          timer.cancel();
          setState(() => _status = 'success');
        } else if (payment.status == 'FAILED' || payment.status == 'CANCELLED') {
          timer.cancel();
          setState(() { _status = 'failed'; _error = 'Payment ${payment.status?.toLowerCase()}.'; });
        }
      } catch (_) {}
    });
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('payments'))),
      body: _buildBody(tr),
    );
  }

  Widget _buildBody(String Function(String) tr) {
    if (_status == 'success') {
      return SuccessAnimation(
        message: tr('success'),
        subtitle: '${widget.amount.toStringAsFixed(0)} XAF',
        onDone: () => Navigator.pop(context, true),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Amount card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryColor, AppTheme.primaryLight],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(tr('amount'), style: const TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  '${widget.amount.toStringAsFixed(0)} XAF',
                  style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700),
                ),
                if (widget.trackingRef != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(widget.trackingRef!, style: const TextStyle(color: Colors.white60, fontSize: 12, fontFamily: 'monospace')),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Provider selection
          Text(tr('method'), style: AppTheme.heading4),
          const SizedBox(height: 10),
          Row(
            children: [
              _ProviderChip(label: 'MTN MoMo', value: 'MTN', selected: _provider == 'MTN', onTap: () => setState(() => _provider = 'MTN')),
              const SizedBox(width: 10),
              _ProviderChip(label: 'Orange Money', value: 'ORANGE', selected: _provider == 'ORANGE', onTap: () => setState(() => _provider = 'ORANGE')),
            ],
          ),
          const SizedBox(height: 20),

          // Phone input
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            enabled: _status == 'idle' || _status == 'failed',
            decoration: InputDecoration(
              labelText: tr('phone'),
              prefixIcon: const Icon(Icons.phone_outlined),
              hintText: '+237...',
            ),
          ),
          const SizedBox(height: 20),

          // Error
          if (_error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.errorColor.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, size: 18, color: AppTheme.errorColor),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_error!, style: AppTheme.caption.copyWith(color: AppTheme.errorColor))),
                ],
              ),
            ),

          // Pay button / polling state
          if (_status == 'polling')
            Column(
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text('Waiting for confirmation...', style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary)),
                const Text('Check your phone for a payment prompt', style: AppTheme.caption),
              ],
            )
          else
            SizedBox(
              height: 52,
              child: ElevatedButton.icon(
                onPressed: (_status == 'idle' || _status == 'failed') ? _initPayment : null,
                icon: _status == 'pending'
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.payment),
                label: Text(_status == 'pending' ? tr('sending') : tr('confirm')),
              ),
            ),
        ],
      ),
    );
  }
}

class _ProviderChip extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _ProviderChip({required this.label, required this.value, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primaryColor.withValues(alpha: 0.1) : AppTheme.surfaceElevated,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppTheme.primaryColor : AppTheme.borderColor,
              width: selected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? AppTheme.primaryColor : AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
