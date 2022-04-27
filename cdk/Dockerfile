FROM node:16-alpine

RUN npm install -g aws-cdk@2.21.1 typescript
WORKDIR /app
COPY . .
RUN npm ci

ENTRYPOINT [ "cdk" ]
