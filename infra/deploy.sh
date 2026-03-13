#!/bin/bash
set -euo pipefail

# Usage: ./deploy.sh <image-tag>
# Example: ./deploy.sh v1.4.2

IMAGE_TAG="${1:-latest}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
IMAGE_NAME="ingest"
FULL_IMAGE="$ECR_REPO/$IMAGE_NAME:$IMAGE_TAG"
ECS_CLUSTER="prod"
ECS_SERVICE="ingest"

echo "==> Deploying $IMAGE_NAME:$IMAGE_TAG to $ECS_CLUSTER"

# Authenticate with ECR
echo "==> Authenticating with ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REPO"

# Build and push image
echo "==> Building Docker image..."
docker build -t "$IMAGE_NAME:$IMAGE_TAG" ./src/services/ingest

echo "==> Tagging image..."
docker tag "$IMAGE_NAME:$IMAGE_TAG" "$FULL_IMAGE"

echo "==> Pushing image to ECR..."
docker push "$FULL_IMAGE"

# Update ECS service
echo "==> Updating ECS service..."
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION"

# Wait for service to stabilize
echo "==> Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster "$ECS_CLUSTER" \
  --services "$ECS_SERVICE" \
  --region "$AWS_REGION"

echo "==> Deployment complete: $FULL_IMAGE"
