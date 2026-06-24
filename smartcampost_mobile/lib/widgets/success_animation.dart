import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:smartcampost_mobile/core/theme.dart';

class SuccessAnimation extends StatelessWidget {
  final String message;
  final String? subtitle;
  final VoidCallback? onDone;

  const SuccessAnimation({
    super.key,
    required this.message,
    this.subtitle,
    this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Lottie.asset(
              'assets/animations/delivery_success.json',
              width: 160,
              height: 160,
              repeat: false,
              onLoaded: (composition) {
                Future.delayed(composition.duration + const Duration(milliseconds: 500), () {
                  onDone?.call();
                });
              },
            ),
            const SizedBox(height: 24),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTheme.heading2,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: AppTheme.bodyMedium.copyWith(color: AppTheme.textSecondary),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
