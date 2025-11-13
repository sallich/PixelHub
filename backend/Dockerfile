FROM eclipse-temurin:21

WORKDIR /app

COPY build/libs/backend-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Xms1G -Xmx2G -jar /app/app.jar"]