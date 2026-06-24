import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smartcampost_mobile/core/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _currentPage = 0;

  static const _slides = [
    _SlideData(
      icon: Icons.local_shipping_outlined,
      color: AppTheme.primaryColor,
      titleKey: 'Track Your Parcels',
      subtitleKey: 'Real-time GPS tracking across Cameroon.\nKnow exactly where your package is, every step of the way.',
    ),
    _SlideData(
      icon: Icons.account_balance_wallet_outlined,
      color: AppTheme.accentColor,
      titleKey: 'Pay With Ease',
      subtitleKey: 'MTN Mobile Money, Orange Money, or cash.\nSecure payments with instant confirmation.',
    ),
    _SlideData(
      icon: Icons.notifications_active_outlined,
      color: AppTheme.successColor,
      titleKey: 'Stay Notified',
      subtitleKey: 'SMS and push notifications at every milestone.\nPickup, transit, delivery — you\'ll always know.',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_currentPage < _slides.length - 1) {
      _controller.nextPage(duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _currentPage == _slides.length - 1;

    return Scaffold(
      backgroundColor: AppTheme.surfaceColor,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: () => context.go('/login'),
                  child: Text(
                    'Skip',
                    style: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),

            // Page view
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _currentPage = i),
                itemCount: _slides.length,
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return _SlideWidget(data: slide);
                },
              ),
            ),

            // Dots + button
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 16, 28, 32),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Page dots
                  Row(
                    children: List.generate(_slides.length, (i) {
                      final isActive = i == _currentPage;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.only(right: 8),
                        height: 8,
                        width: isActive ? 28 : 8,
                        decoration: BoxDecoration(
                          color: isActive ? AppTheme.primaryColor : AppTheme.borderColor,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),

                  // Next / Get Started button
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _next,
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(horizontal: isLast ? 32 : 20),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(isLast ? 'Get Started' : 'Next'),
                          if (!isLast) ...[
                            const SizedBox(width: 6),
                            const Icon(Icons.arrow_forward, size: 18),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SlideData {
  final IconData icon;
  final Color color;
  final String titleKey;
  final String subtitleKey;

  const _SlideData({
    required this.icon,
    required this.color,
    required this.titleKey,
    required this.subtitleKey,
  });
}

class _SlideWidget extends StatelessWidget {
  final _SlideData data;

  const _SlideWidget({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Animated icon container
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.8, end: 1.0),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutBack,
            builder: (context, scale, child) => Transform.scale(scale: scale, child: child),
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    data.color.withValues(alpha: 0.15),
                    data.color.withValues(alpha: 0.05),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.6, 1.0],
                ),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: data.color.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(color: data.color.withValues(alpha: 0.2), width: 2),
                  ),
                  child: Icon(data.icon, size: 40, color: data.color),
                ),
              ),
            ),
          ),
          const SizedBox(height: 48),

          // Title
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeOut,
            builder: (context, opacity, child) => Opacity(opacity: opacity, child: child),
            child: Text(
              data.titleKey,
              textAlign: TextAlign.center,
              style: AppTheme.heading1.copyWith(fontSize: 26),
            ),
          ),
          const SizedBox(height: 16),

          // Subtitle
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOut,
            builder: (context, opacity, child) => Opacity(opacity: opacity, child: child),
            child: Text(
              data.subtitleKey,
              textAlign: TextAlign.center,
              style: AppTheme.bodyLarge.copyWith(
                color: AppTheme.textSecondary,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
