FROM maven:3.9.11-eclipse-temurin-17
# FROM maven:3.8.2-jdk-8 # for Java 8

WORKDIR /bezkoder-app
COPY . .
RUN mvn clean package -DskipTests

CMD mvn spring-boot:run