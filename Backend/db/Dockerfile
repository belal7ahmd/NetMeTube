# Use an official Mysql runtime as a parent image
FROM mysql/mysql-server

COPY DB.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
