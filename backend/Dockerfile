# Multi-stage Dockerfile for SmartCAMPOST backend (Java 21)

# ── Build stage ──
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /build

# Cache dependencies
COPY pom.xml pom.xml
COPY .mvn .mvn
COPY mvnw mvnw
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline -q

# Build app
COPY src src
RUN ./mvnw -B -DskipTests package -q

# ── Run stage ──
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=build /build/target/backend-*.jar /app/app.jar

# Render uses PORT env var (usually 10000)
ENV PORT=8080
EXPOSE ${PORT}

# Fast JVM startup flags for cloud containers
ENV JAVA_OPTS="-Xms128m -Xmx384m \
  -XX:+UseG1GC \
  -XX:+TieredCompilation \
  -XX:TieredStopAtLevel=1 \
  -XX:+UseStringDeduplication \
  -Dspring.jmx.enabled=false \
  -Dspring.config.location=classpath:/application.yaml,classpath:/application-prod.yaml"

CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT} -jar /app/app.jar --spring.profiles.active=prod"]
