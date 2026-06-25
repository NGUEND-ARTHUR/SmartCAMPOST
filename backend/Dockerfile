# Multi-stage Dockerfile for SmartCAMPOST backend (Java 21)
# Optimized for fast rebuilds via dependency caching

# ── Build stage ──
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /build

# Step 1: Copy only pom.xml and download dependencies (cached layer)
COPY pom.xml pom.xml
COPY .mvn .mvn
COPY mvnw mvnw
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline -q

# Step 2: Copy source and build (only this layer rebuilds on code changes)
COPY src src
RUN ./mvnw -B -DskipTests package -q

# ── Run stage (slim JRE) ──
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=build /build/target/backend-*.jar /app/app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
