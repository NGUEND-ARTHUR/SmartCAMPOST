Subscribe to the AI SSE endpoint from Flutter

1) Add `eventsource` package to `pubspec.yaml` dependencies:

```yaml
dependencies:
  eventsource: ^0.2.0
```

2) Example usage (Dart):

```dart
import 'package:eventsource/eventsource.dart';

void subscribeAiEvents(String baseApi, String token) async {
  final url = token != null ? '$baseApi/stream/ai?token=$token' : '$baseApi/stream/ai';
  final stream = await EventSource.connect(url);
  stream.listen((Event event) {
    print('AI event: ${event.event} -> ${event.data}');
    // handle 'ai-decision', 'ai-execution', 'ai-runtime'
  });
}
```

3) Call `subscribeAiEvents` from a top-level provider or app init, pass API base like `https://api.example.com/api` and the JWT token.

Notes:
- Ensure the backend endpoint `/api/stream/ai` is reachable and that CORS allows your mobile app domain if using webview.
- The example uses a simple print handler — integrate with your app state to surface notifications.
