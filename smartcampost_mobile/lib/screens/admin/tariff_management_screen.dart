import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class TariffManagementScreen extends StatefulWidget {
  const TariffManagementScreen({super.key});

  @override
  State<TariffManagementScreen> createState() => _TariffManagementScreenState();
}

class _TariffManagementScreenState extends State<TariffManagementScreen> {
  List<dynamic> _tariffs = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTariffs();
  }

  Future<void> _loadTariffs() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final tariffs = await TariffService().getTariffs();
      if (mounted) setState(() => _tariffs = tariffs);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  // Price calculator
  void _showPriceCalculator() {
    final weightController = TextEditingController();
    String serviceType = 'STANDARD';
    String? calculatedPrice;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Price Calculator',
                style: Theme.of(
                  ctx,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: weightController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Weight (kg)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: serviceType,
                decoration: const InputDecoration(
                  labelText: 'Service Type',
                  border: OutlineInputBorder(),
                ),
                items: ['STANDARD', 'EXPRESS', 'ECONOMY']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                onChanged: (v) => setSheetState(() => serviceType = v!),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final w = double.tryParse(weightController.text);
                    if (w == null || w <= 0) return;
                    try {
                      final price = await TariffService().calculatePrice({
                        'weight': w,
                        'serviceType': serviceType,
                      });
                      setSheetState(
                        () => calculatedPrice =
                            '${price['price'] ?? price['amount'] ?? '-'} XAF',
                      );
                    } catch (e) {
                      setSheetState(() => calculatedPrice = 'Error: $e');
                    }
                  },
                  child: const Text('Calculate'),
                ),
              ),
              if (calculatedPrice != null) ...[
                const SizedBox(height: 12),
                Card(
                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.attach_money,
                          color: AppTheme.accentColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          calculatedPrice!,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.accentColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('tariffs'))),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showPriceCalculator,
        icon: const Icon(Icons.calculate),
        label: const Text('Calculator'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadTariffs,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadTariffs)
            : _tariffs.isEmpty
            ? const EmptyStateWidget(
                icon: Icons.calculate_outlined,
                title: 'No tariffs configured',
              )
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _tariffs.length,
                itemBuilder: (_, i) {
                  final t = _tariffs[i];
                  if (t is! Map) return const SizedBox.shrink();
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primaryColor.withValues(
                          alpha: 0.1,
                        ),
                        child: const Icon(
                          Icons.calculate,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      title: Text(
                        '${t['serviceType'] ?? t['name'] ?? 'Tariff'}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        'Weight: ${t['minWeight'] ?? 0}-${t['maxWeight'] ?? '∞'} kg\n'
                        'Price: ${t['pricePerKg'] ?? t['basePrice'] ?? '-'} XAF/kg',
                      ),
                      isThreeLine: true,
                    ),
                  );
                },
              ),
      ),
    );
  }
}
