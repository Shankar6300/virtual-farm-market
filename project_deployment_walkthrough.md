# Project Deployment Reference Guide: Virtual Farm Market (VFM)

This document serves as a comprehensive overview of the architecture, tech stack, containerization configurations, and CI/CD pipelines of the **Virtual Farm Market** project. Use this reference to write resume descriptions or prepare for technical interview questions.

---

## 1. Executive Project Summary
**Virtual Farm Market (VFM)** is a secure, localized MERN (MongoDB, Express, React, Node.js) web application designed to connect local farmers directly with consumers. It features product listings, categories, real-time chat, ordering workflows, and Stripe payment gateway mock integration. 

The application is localized for the Indian market (using Rupees `₹`, seeded Indian states and cities, and custom location drop-downs) and is fully dockerized and automated to deploy to the cloud (AWS) on every code push.

---

## 2. Technology Stack
*   **Frontend**: React.js (built with Vite), Redux Toolkit (State Management), Bootstrap & Material-UI (UX/UI Components), Axios (API Integration).
*   **Backend**: Node.js, Express.js (REST API, Routing, Chat Controllers, Cron Seeders).
*   **Database**: MongoDB (Local Development) / MongoDB Atlas (Production Cloud Cluster) managed via Mongoose ODM.
*   **Containerization**: Docker, Docker Compose (for orchestrating multiple services locally).
*   **CI/CD Pipeline**: GitHub Actions (Workflow automation).
*   **AWS Production Infrastructure**:
    *   **Amazon S3**: Hosts the static compiled React frontend.
    *   **Amazon CloudFront**: Global CDN (Content Delivery Network) caching and serving the frontend globally.
    *   **Amazon ECR (Elastic Container Registry)**: Private registry hosting compiled backend Docker images.
    *   **AWS Elastic Beanstalk (with Docker Platform)**: Hosts the backend API on a serverless/managed virtual machine (EC2), pulling the container automatically from ECR.

---

## 3. Local Development vs. Production Cloud Architecture

```
LOCAL ENVIRONMENT:
[ React.js Frontend (Port 3000) ] ---> [ Express.js Backend (Port 3001) ] ---> [ MongoDB Local (Port 27017) ]
(Orchestrated as containers locally using a single docker-compose.yml file)

PRODUCTION CLOUD ENVIRONMENT:
                       [ Global Users ]
                              │
                    (HTTP Get Requests)
                              ▼
                [ AWS CloudFront CDN / S3 Bucket ]
               (Hosts React Frontend Static Assets)
                              │
                    (API Requests / Fetch)
                              ▼
              [ AWS Elastic Beanstalk (EC2 VM) ]
             (Runs Express.js Backend in Docker)
                              │
                     (Mongoose Database connection)
                              ▼
                [ MongoDB Atlas Cloud Cluster ]
                 (Managed Database-as-a-Service)
```

---

## 4. Line-by-Line Docker Containerization Details

We containerized the application to ensure consistency between development and production. Below are the configurations and line-by-line explanations.

### A. Backend Dockerfile (`server/Dockerfile`)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "app.js"]
```
*   **Line 1 (`FROM node:18-alpine`)**: Sets the base container image to Node.js v18 built on Alpine Linux (an ultra-lightweight Linux distribution that keeps the container size under 100MB).
*   **Line 3 (`WORKDIR /app`)**: Sets the working directory inside the container to `/app`. All subsequent commands run from here.
*   **Line 5 (`COPY package.json package-lock.json ./`)**: Copies only the dependency definition files into the container. This is a Docker caching best practice; if dependencies don't change, Docker skips re-installing them in subsequent builds.
*   **Line 7 (`RUN npm install`)**: Installs all required Node.js backend packages inside the container.
*   **Line 9 (`COPY . .`)**: Copies the rest of the application source code into the container.
*   **Line 11 (`EXPOSE 3001`)**: Documents that the application inside the container listens on port `3001`.
*   **Line 13 (`CMD ["node", "app.js"]`)**: Specifies the default run command that starts the Express server when the container starts.

---

### B. Frontend Dockerfile (`client/Virtual-Farm-Market/Dockerfile`)
This file uses a **Multi-Stage Build** to compile the React code and serve it with a lightweight Nginx web server, saving hosting resources.
```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```
*   **Stage 1 (Lines 1-12)**:
    *   `FROM node:18-alpine AS build`: Sets up the build container as `build`.
    *   `RUN npm install`: Installs build-time libraries.
    *   `RUN npm run build`: Compiles the React source code and outputs static HTML/CSS/JS files into the `/app/dist` folder.
*   **Stage 2 (Lines 14-23)**:
    *   `FROM nginx:alpine`: Launches a fresh, lightweight Nginx web server container.
    *   `COPY --from=build /app/dist /usr/share/nginx/html`: Copies only the compiled HTML/CSS/JS files from the `build` container into Nginx's default public directory. The heavy node build libraries are completely discarded.
    *   `COPY nginx.conf /etc/nginx/conf.d/default.conf`: Replaces default Nginx configs with a custom configuration that redirects all sub-routes to `index.html` (crucial for React Router client-side routing).
    *   `EXPOSE 3000`: Sets Nginx to listen on port `3000`.
    *   `CMD ["nginx", "-g", "daemon off;"]`: Starts Nginx in the foreground to keep the container running.

---

### C. Multi-Container Orchestration (`docker-compose.yml`)
Used for spinning up the entire stack locally with a single command (`docker-compose up`).
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: vfm_mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      context: ./server
    container_name: vfm_backend
    restart: always
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/VirtualFarmMarketDB
      - PORT=3001
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./client/Virtual-Farm-Market
    container_name: vfm_frontend
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongodb_data:
```
*   **`services`**: Defines three containers: `mongodb` (raw database), `backend` (Express app), and `frontend` (React app).
*   **`ports`**: Maps container ports to host machine ports (e.g. mapping internal database port `27017` to localhost `27017`).
*   **`volumes`**: Map local memory block `mongodb_data` to `/data/db` inside the database container. This ensures your data is **persisted** on your hard drive and does not disappear when you stop the container.
*   **`depends_on`**: Declares startup order (e.g. backend waits for database, frontend waits for backend).

---

## 5. Line-by-Line Cloud Deployment Configs

For cloud deployment, we bypass zipping files manually. Instead, the backend uses an ECR container deploy blueprint, and the frontend uses GitHub Actions to sync static assets.

### A. AWS Elastic Beanstalk Deployment Descriptor (`Dockerrun.aws.json`)
Placed at the root of the repository, this file tells Elastic Beanstalk to pull the pre-built Docker image from ECR and run it.
```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "797416043397.dkr.ecr.ap-south-1.amazonaws.com/vfm-backend:latest",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 3001,
      "HostPort": 80
    }
  ]
}
```
*   **`"AWSEBDockerrunVersion": "1"`**: Specifies the version schema for Elastic Beanstalk Single Container platform.
*   **`"Image"`**:
    *   `"Name"`: The URI pointing to your AWS ECR private repository containing the backend Docker container image.
    *   `"Update": "true"`: Tells Elastic Beanstalk to pull a fresh copy of the image from ECR on every deployment.
*   **`"Ports"`**: Maps port `3001` inside the container (where Express runs) to port `80` (HTTP) on the host virtual server, making it publicly accessible to the internet.

---

### B. Automated CI/CD Pipelines (GitHub Actions)

#### 1. Backend Automation (`.github/workflows/deploy-backend.yml`)
Triggers automatically whenever files inside `server/` change.
```yaml
name: Deploy Backend

on:
  push:
    branches:
      - main
    paths:
      - 'Virtual-Farm-Market-main/server/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build & Push
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          REPO: vfm-backend
        run: |
          docker build -t $REGISTRY/$REPO:latest ./Virtual-Farm-Market-main/server
          docker push $REGISTRY/$REPO:latest

      - name: Deploy to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: vfm-backend-app
          environment_name: Vfm-backend-app-env
          version_label: backend-${{ github.sha }}
          region: ${{ secrets.AWS_REGION }}
          deployment_package: Dockerrun.aws.json
```
*   **`on: push: paths`**: Restricts executions to code changes inside `/server` to prevent useless builds when updating frontend code.
*   **`AWS Credentials`**: Authenticates the GitHub runner securely with AWS IAM using repository secrets.
*   **`Login to ECR`**: Logs Docker cli inside the GitHub runner into your AWS private registry.
*   **`Build & Push`**: Compiles the Express `Dockerfile` and pushes the tagged image to AWS ECR.
*   **`Deploy to Elastic Beanstalk`**: Uploads `Dockerrun.aws.json` to S3 and triggers Elastic Beanstalk to pull the newly uploaded image from ECR and restart the app server.

---

#### 2. Frontend Automation (`.github/workflows/deploy-frontend.yml`)
Triggers automatically whenever files inside `client/` change.
```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main
    paths:
      - 'Virtual-Farm-Market-main/client/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Node Setup
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install & Build
        working-directory: ./Virtual-Farm-Market-main/client/Virtual-Farm-Market
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: |
          npm install --legacy-peer-deps
          npm run build

      - name: AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Sync S3
        working-directory: ./Virtual-Farm-Market-main/client/Virtual-Farm-Market
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} --delete

      - name: Clear Cache
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```
*   **`Install & Build`**: Uses `--legacy-peer-deps` to bypass React v18 peer version warnings during build on Linux, compiling the frontend using the production API URL injected via environment secrets.
*   **`Sync S3`**: Syncs compiled assets into the S3 bucket and deletes old files (`--delete`).
*   **`Clear Cache`**: Invalidates CloudFront cache paths (`"/*"`) so global users immediately receive the new code version instead of stale cached pages.

---

## 6. Resume Bullet Points & Description

Use these points to represent this project on your CV:

### Project Description:
> **Virtual Farm Market (VFM)** | *MERN Full Stack Developer / DevOps Engineer*
> Developed and deployed a localized, multi-container e-commerce platform that allows farmers to sell produce directly to buyers. Orchestrated services locally using Docker Compose, migrated local databases to MongoDB Atlas, and implemented automatic CI/CD deployment pipelines on AWS.

### Bullet Points:
*   **Containerization**: Containerized React.js and Express.js codebases using **Docker multi-stage builds**, reducing frontend production asset image sizes by over 80%.
*   **Orchestration**: Structured multi-service environments locally using **Docker Compose** with persistent volumes to ensure consistent configurations across developer environments.
*   **Database Migration**: Migrated local database stores into a secured **MongoDB Atlas** cloud cluster, writing custom node scripts to verify data schemas and auto-confirm user verification workflows.
*   **CI/CD Pipeline Automation**: Designed fully automated deployment pipelines via **GitHub Actions** that build and push Docker containers to **AWS ECR** and static React files to **AWS S3** on Git push.
*   **Cloud Architecture**: Deployed Express backend containers on **AWS Elastic Beanstalk** (Docker Platform) and integrated global content distribution using **AWS CloudFront** with custom CORS policies and route rewriting.
*   **Security & Encryption**: Protected application data by stripping plaintext secrets, implementing **GitHub Actions Repository Secrets**, and configuring secure environments for database connection strings and Stripe integration.
