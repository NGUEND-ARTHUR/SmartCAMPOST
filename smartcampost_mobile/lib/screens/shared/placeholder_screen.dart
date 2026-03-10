import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';

class PlaceholderScreen extends StatelessWidget {
  final String titleKey;
  final IconData icon;
  const PlaceholderScreen({
    super.key,
    required this.titleKey,
    this.icon = Icons.construction,
  });

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;
    return Scaffold(
      appBar: AppBar(title: Text(tr(titleKey))),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              tr('coming_soon'),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              tr('feature_in_development'),
              style: TextStyle(color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }
}
