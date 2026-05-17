#!/usr/bin/env bash
# Deploy LexGuard to Cloud Run (run from repo root with your user gcloud login).
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-lexguard-dev}"
REGION="${VERTEX_AI_LOCATION:-asia-northeast1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-lexguard-api}"

echo "Project: $PROJECT | Region: $REGION | Service: $SERVICE_NAME"

gcloud config set project "$PROJECT"

echo "Enabling required APIs (first time only)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  --project="$PROJECT"

ENV_VARS="GOOGLE_CLOUD_PROJECT=${PROJECT}"
ENV_VARS+=",VERTEX_AI_LOCATION=${REGION}"
ENV_VARS+=",NODE_ENV=production"
ENV_VARS+=",LEXGUARD_DEMO_MODE=false"
ENV_VARS+=",LEXGUARD_RAG_MODE=category-first"
ENV_VARS+=",LEXGUARD_RUNTIME_EMBEDDINGS=local"
ENV_VARS+=",LEXGUARD_CROSS_CLAUSE_AI=false"
ENV_VARS+=",VERTEX_MAX_CONCURRENT=1"
ENV_VARS+=",VERTEX_MIN_INTERVAL_MS=3000"
ENV_VARS+=",GEMINI_CLAUSE_GAP_MS=2000"
ENV_VARS+=",GEMINI_JSON_PARSE_RETRIES=1"
ENV_VARS+=",GEMINI_FAST_MODEL=gemini-2.5-flash"
ENV_VARS+=",GEMINI_MODEL=gemini-2.5-pro"
ENV_VARS+=",FIRESTORE_COLLECTION=sessions"
ENV_VARS+=",GCS_BUCKET=${GCS_BUCKET:-lexguard-docs-champ}"
ENV_VARS+=",DOCUMENT_AI_PROCESSOR_ID=${DOCUMENT_AI_PROCESSOR_ID:-}"
ENV_VARS+=",DOCUMENT_AI_LOCATION=${DOCUMENT_AI_LOCATION:-asia-southeast1}"
ENV_VARS+=",LEXGUARD_IMAGE_OCR=gemini-vision"
ENV_VARS+=",LEXGUARD_PDF_OCR=gemini-vision"
ENV_VARS+=",URL_READER_FALLBACK=true"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 900 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "$ENV_VARS"

URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')
echo ""
echo "Deployed: $URL"
echo "Health:   ${URL}/api/health"
echo ""
echo "Grant the Cloud Run service account Vertex AI + Firestore + Storage if analysis fails:"
echo "  gcloud run services describe $SERVICE_NAME --region $REGION --format='value(spec.template.spec.serviceAccountName)'"
