FROM eclipse-temurin:21

WORKDIR /app

COPY build/libs/backend*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Xms1G -Xmx2G -jar app.jar"]