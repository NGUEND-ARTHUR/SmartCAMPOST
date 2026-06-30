import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:smartcampost_mobile/core/theme.dart';
import 'package:smartcampost_mobile/models/models.dart';
import 'package:smartcampost_mobile/providers/locale_provider.dart';
import 'package:smartcampost_mobile/services/services.dart';
import 'package:smartcampost_mobile/widgets/common_widgets.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic> _analytics = {};
  bool _isLoading = true;
  String? _error;

  final _regionController = TextEditingController();
  final _daysController = TextEditingController(text: '7');
  bool _forecastLoading = false;
  String? _forecastError;
  DemandForecastResponse? _forecastResult;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  @override
  void dispose() {
    _regionController.dispose();
    _daysController.dispose();
    super.dispose();
  }

  Future<void> _runForecast() async {
    setState(() {
      _forecastLoading = true;
      _forecastError = null;
      _forecastResult = null;
    });
    try {
      final days = int.tryParse(_daysController.text.trim()) ?? 7;
      final clampedDays = days.clamp(1, 30);
      final result = await DemandForecastService().forecastDemand(
        region: _regionController.text.trim().isEmpty ? null : _regionController.text.trim(),
        forecastDays: clampedDays,
      );
      if (mounted) setState(() => _forecastResult = result);
    } catch (e) {
      if (mounted) {
        setState(() => _forecastError = e.toString().replaceAll('Exception: ', ''));
      }
    }
    if (mounted) setState(() => _forecastLoading = false);
  }

  Color _demandLevelColor(String level) {
    switch (level.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return Colors.red;
      case 'MEDIUM':
        return Colors.orange;
      default:
        return Colors.green;
    }
  }

  Future<void> _loadAnalytics() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await DashboardService().getDashboardStats();
      if (mounted) setState(() => _analytics = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final tr = context.read<LocaleProvider>().tr;

    return Scaffold(
      appBar: AppBar(title: Text(tr('analytics'))),
      body: RefreshIndicator(
        onRefresh: _loadAnalytics,
        child: _isLoading
            ? const LoadingIndicator()
            : _error != null
            ? ErrorRetryWidget(message: _error!, onRetry: _loadAnalytics)
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Summary cards
                  Row(
                    children: [
                      _MetricCard(
                        label: tr('total_parcels'),
                        value: '${_analytics['totalParcels'] ?? 0}',
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 12),
                      _MetricCard(
                        label: tr('delivered'),
                        value: '${_analytics['delivered'] ?? 0}',
                        color: AppTheme.accentColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _MetricCard(
                        label: tr('revenue'),
                        value: '${_analytics['totalRevenue'] ?? 0} XAF',
                        color: Colors.green,
                      ),
                      const SizedBox(width: 12),
                      _MetricCard(
                        label: tr('avg_delivery_time'),
                        value: '${_analytics['avgDeliveryDays'] ?? '-'} days',
                        color: Colors.orange,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Status distribution pie chart
                  SectionTitle(title: tr('status_distribution')),
                  const SizedBox(height: 8),
                  SizedBox(height: 220, child: _buildPieChart()),
                  const SizedBox(height: 24),

                  // Monthly trend bar chart
                  SectionTitle(title: tr('monthly_trend')),
                  const SizedBox(height: 8),
                  SizedBox(height: 220, child: _buildBarChart()),
                  const SizedBox(height: 24),

                  // Demand forecast
                  SectionTitle(title: tr('demand_forecast')),
                  const SizedBox(height: 8),
                  _buildForecastSection(tr),
                ],
              ),
      ),
    );
  }

  Widget _buildForecastSection(String Function(String) tr) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _regionController,
                decoration: InputDecoration(
                  labelText: tr('region'),
                  hintText: tr('all_agencies'),
                  isDense: true,
                  border: const OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              width: 90,
              child: TextField(
                controller: _daysController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: tr('forecast_days'),
                  isDense: true,
                  border: const OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _forecastLoading ? null : _runForecast,
            icon: _forecastLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.query_stats),
            label: Text(tr('search')),
          ),
        ),
        if (_forecastError != null) ...[
          const SizedBox(height: 10),
          Text(_forecastError!, style: const TextStyle(color: Colors.red)),
        ],
        if (_forecastResult != null) ...[
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  _forecastResult!.agencyName ?? _forecastResult!.region ?? tr('all_agencies'),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _forecastResult!.trend,
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _MetricCard(
                label: tr('current_backlog'),
                value: _forecastResult!.currentBacklog.toStringAsFixed(0),
                color: AppTheme.primaryColor,
              ),
              const SizedBox(width: 12),
              _MetricCard(
                label: tr('avg_daily_volume'),
                value: _forecastResult!.averageDailyVolume.toStringAsFixed(0),
                color: AppTheme.accentColor,
              ),
              const SizedBox(width: 12),
              _MetricCard(
                label: tr('confidence'),
                value: '${(_forecastResult!.confidenceScore * 100).round()}%',
                color: Colors.green,
              ),
            ],
          ),
          if (_forecastResult!.recommendation != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.infoColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(_forecastResult!.recommendation!),
            ),
          ],
          const SizedBox(height: 12),
          ...(_forecastResult!.forecasts.map(
            (f) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(f.date),
                subtitle: Text('${tr('predicted_volume')}: ${f.predictedVolume.toStringAsFixed(0)}'),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _demandLevelColor(f.demandLevel).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    f.demandLevel,
                    style: TextStyle(
                      color: _demandLevelColor(f.demandLevel),
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          )),
        ],
      ],
    );
  }

  Widget _buildPieChart() {
    final statusDist = _analytics['statusDistribution'];
    if (statusDist == null || statusDist is! Map) {
      return const Center(child: Text('No data available'));
    }

    final colors = [
      AppTheme.primaryColor,
      AppTheme.accentColor,
      AppTheme.warningColor,
      Colors.purple,
      Colors.teal,
      Colors.orange,
      Colors.pink,
      Colors.indigo,
      Colors.brown,
      Colors.cyan,
    ];

    final entries = statusDist.entries.toList();
    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 40,
        sections: entries.asMap().entries.map((e) {
          final idx = e.key;
          final entry = e.value;
          final val = (entry.value as num).toDouble();
          return PieChartSectionData(
            value: val,
            color: colors[idx % colors.length],
            title: '${entry.key}\n${val.toInt()}',
            titleStyle: const TextStyle(
              fontSize: 9,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
            radius: 60,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildBarChart() {
    final monthly = _analytics['monthlyParcels'];
    if (monthly == null || monthly is! List || monthly.isEmpty) {
      return const Center(child: Text('No data available'));
    }

    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY:
            (monthly.cast<num>().reduce((a, b) => a > b ? a : b)).toDouble() *
            1.2,
        titlesData: FlTitlesData(
          leftTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: true, reservedSize: 40),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, _) {
                final i = val.toInt();
                return Text(
                  i < months.length ? months[i] : '',
                  style: const TextStyle(fontSize: 10),
                );
              },
            ),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
        ),
        borderData: FlBorderData(show: false),
        barGroups: monthly.asMap().entries.map((e) {
          return BarChartGroupData(
            x: e.key,
            barRods: [
              BarChartRodData(
                toY: (e.value as num).toDouble(),
                color: AppTheme.primaryColor,
                width: 16,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(4),
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MetricCard({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
