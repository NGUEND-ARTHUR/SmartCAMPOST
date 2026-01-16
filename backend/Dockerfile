# Multi-stage Dockerfile for SmartCAMPOST backend (Java 17)

# Build stage using Maven
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /build

# Copy only what is needed for a fast build cache
COPY .mvn .mvn
COPY mvnw mvnw
COPY pom.xml pom.xml
COPY src src

RUN chmod +x mvnw && ./mvnw -B -DskipTests package

# Run stage using a slim JRE
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the packaged jar from the build stage
COPY --from=build /build/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"

CMD ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
