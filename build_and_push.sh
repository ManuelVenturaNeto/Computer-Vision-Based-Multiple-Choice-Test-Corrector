#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PROJECT_ID="corretor-de-provas-493220"
REGION="southamerica-east1"
REPOSITORY="corretor-de-provas"
SERVICE="corretor-de-provas-test"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}:latest"
SERVICE_ACCOUNT_KEY="./corretor-de-provas-493220-92993b40dca3.json"
GCLOUD_IMAGE="gcr.io/google.com/cloudsdktool/google-cloud-cli:slim"
GCLOUD_CONFIG_DIR="${HOME}/.config/gcloud"

# Carrega .env
set -a
source ./.env
set +a
: "${OPENAI_API_KEY:?OPENAI_API_KEY ausente no .env}"
OPENAI_MODEL="${OPENAI_MODEL:-gpt-4.1-mini}"

# Função para rodar gcloud via Docker
gc() {
  docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "${PWD}:/workspace" \
    -w /workspace \
    -v "${GCLOUD_CONFIG_DIR}:/tmp/gcloud" \
    -e CLOUDSDK_CONFIG=/tmp/gcloud \
    "${GCLOUD_IMAGE}" \
    gcloud "$@"
}

# Login no Docker Registry (já funciona direto com docker)
docker login -u _json_key --password-stdin "https://${REGION}-docker.pkg.dev" < "${SERVICE_ACCOUNT_KEY}"

# Autenticar a service account no gcloud (via Docker)
gc auth activate-service-account --key-file="${SERVICE_ACCOUNT_KEY}"

# Build e push da imagem (docker já está disponível)
docker build --no-cache -t "${IMAGE}"  .
docker push "${IMAGE}"

# Deploy no Cloud Run (usando gcloud via Docker)
gc run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --quiet \
  --set-env-vars "NODE_ENV=production,OPENAI_API_KEY=${OPENAI_API_KEY},OPENAI_MODEL=${OPENAI_MODEL}"

# Tornar público (invoker allUsers)
gc run services add-iam-policy-binding "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --member="allUsers" \
  --quiet \
  --max-instances=1 \
  --concurrency=15 \
  --role="roles/run.invoker"
