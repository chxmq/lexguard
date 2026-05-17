#!/usr/bin/env bash
# Run once with YOUR Google account (Owner), not the service account.
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-lexguard-dev}"
SA_EMAIL="lexguard-api@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="${1:-./service-account.json}"

echo "=== LexGuard GCP setup ==="
echo "Project: $PROJECT_ID"
echo ""

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Install gcloud: brew install --cask google-cloud-sdk"
  exit 1
fi

echo "Step 1: Log in with your Google account (Owner) — browser will open"
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
  --project="$PROJECT_ID"

echo ""
echo "Step 3: Grant Vertex AI User to service account"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user" \
  --condition=None

echo ""
echo "Step 4: Verify roles on service account"
gcloud projects get-iam-policy "$PROJECT_ID" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SA_EMAIL}" \
  --format="table(bindings.role)"

echo ""
echo "Done. Restart: npm run dev"
