class AgentRecommendationItem {
  final String title;
  final String? description;
  final String? priority;

  AgentRecommendationItem({required this.title, this.description, this.priority});

  factory AgentRecommendationItem.fromJson(Map<String, dynamic> json) =>
      AgentRecommendationItem(
        title: json['title'] as String? ?? '',
        description: json['description'] as String?,
        priority: json['priority'] as String?,
      );
}

class AgentStatusResponse {
  final String? agentHealth;
  final String? summary;
  final List<AgentRecommendationItem> recommendations;

  AgentStatusResponse({this.agentHealth, this.summary, this.recommendations = const []});

  factory AgentStatusResponse.fromJson(Map<String, dynamic> json) => AgentStatusResponse(
    agentHealth: json['agentHealth'] as String?,
    summary: json['summary'] as String?,
    recommendations: (json['recommendations'] as List<dynamic>?)
            ?.map((e) => AgentRecommendationItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [],
  );
}
