class DailyForecast {
  final String date;
  final double predictedVolume;
  final double confidence;
  final String demandLevel;

  DailyForecast({
    required this.date,
    required this.predictedVolume,
    required this.confidence,
    required this.demandLevel,
  });

  factory DailyForecast.fromJson(Map<String, dynamic> json) => DailyForecast(
    date: json['date'] as String? ?? '',
    predictedVolume: (json['predictedVolume'] as num?)?.toDouble() ?? 0,
    confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
    demandLevel: json['demandLevel'] as String? ?? '',
  );
}

class DemandForecastResponse {
  final String? agencyId;
  final String? agencyName;
  final String? region;
  final List<DailyForecast> forecasts;
  final double currentBacklog;
  final double averageDailyVolume;
  final String trend;
  final double confidenceScore;
  final String? recommendation;

  DemandForecastResponse({
    this.agencyId,
    this.agencyName,
    this.region,
    this.forecasts = const [],
    this.currentBacklog = 0,
    this.averageDailyVolume = 0,
    this.trend = '',
    this.confidenceScore = 0,
    this.recommendation,
  });

  factory DemandForecastResponse.fromJson(Map<String, dynamic> json) => DemandForecastResponse(
    agencyId: json['agencyId']?.toString(),
    agencyName: json['agencyName'] as String?,
    region: json['region'] as String?,
    forecasts: (json['forecasts'] as List<dynamic>?)
            ?.map((e) => DailyForecast.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
    currentBacklog: (json['currentBacklog'] as num?)?.toDouble() ?? 0,
    averageDailyVolume: (json['averageDailyVolume'] as num?)?.toDouble() ?? 0,
    trend: json['trend'] as String? ?? '',
    confidenceScore: (json['confidenceScore'] as num?)?.toDouble() ?? 0,
    recommendation: json['recommendation'] as String?,
  );
}
