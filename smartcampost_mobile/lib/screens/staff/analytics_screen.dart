import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:smartcampost_mobile/core/theme.dart';
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

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
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
                ],
              ),
      ),
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
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
