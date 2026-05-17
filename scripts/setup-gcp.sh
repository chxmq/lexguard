#!/usr/bin/env bash
# Run once with YOUR Google account (Owner), not the service account.
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-lexguard-dev}"
SA_EMAIL="lexguard-api@${PROJECT_ID}.iam.gserviceaccount.com"
REGION="${VERTEX_AI_LOCATION:-asia-northeast1}"

echo "=== LexGuard GCP setup ==="
echo "Project: $PROJECT_ID"
echo ""

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Install gcloud: brew install --cask google-cloud-sdk"
  exit 1
fi

echo "Step 1: Log in with your Google account (Owner)"
gcloud auth login
gcloud config set project "$PROJECT_ID"

echo ""
echo "Step 2: Enable APIs"
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com \
  aiplatform.googleapis.com \
  documentai.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID"

echo ""
echo "Step 3: IAM for API service account (local dev + Cloud Run)"
for ROLE in \
  roles/aiplatform.user \
  roles/datastore.user \
  roles/storage.objectAdmin \
  roles/documentai.apiUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --condition=None \
    --quiet
done

echo ""
echo "Step 4: Grant Cloud Run default compute SA (if different from lexguard-api)"
PROJECT_NUM=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUN_SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"
for ROLE in roles/aiplatform.user roles/datastore.user roles/storage.objectAdmin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${RUN_SA}" \
    --role="$ROLE" \
    --condition=None \
    --quiet 2>/dev/null || true
done

echo ""
echo "Step 5: Roles on ${SA_EMAIL}"
gcloud projects get-iam-policy "$PROJECT_ID" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SA_EMAIL}" \
  --format="table(bindings.role)"

echo ""
echo "Done. Deploy: ./scripts/deploy-cloud-run.sh"
echo "Eval:      npm run eval:extract"
