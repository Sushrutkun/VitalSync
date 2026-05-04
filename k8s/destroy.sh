#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "⚠️  Removing VitalSync from Kubernetes..."
cd "$SCRIPT_DIR"

kubectl delete -f backend.yaml --ignore-not-found=true
kubectl delete -f kafka-ui.yaml --ignore-not-found=true
kubectl delete -f kafka.yaml --ignore-not-found=true
kubectl delete -f postgres.yaml --ignore-not-found=true
kubectl delete -f namespace.yaml --ignore-not-found=true

echo "✅ Cleanup complete. Namespace and all resources removed."
