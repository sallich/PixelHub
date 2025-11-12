FROM openjdk:17-jdk-slim

WORKDIR /app

COPY build/libs/backend*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -jar app.jar"]