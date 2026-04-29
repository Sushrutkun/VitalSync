#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🔨 Building backend image..."
cd "$BACKEND_DIR"
mvn clean package -DskipTests -q
docker build -t vitalsync-backend:latest .

# Load image into local K8s if using minikube/kind
KUBECONFIG_INFO=$(kubectl config current-context 2>/dev/null || echo "")
if [[ "$KUBECONFIG_INFO" == *"minikube"* ]]; then
    echo "📦 Loading image into minikube..."
    minikube image load vitalsync-backend:latest
elif [[ "$KUBECONFIG_INFO" == *"kind"* ]]; then
    echo "📦 Loading image into kind cluster..."
    kind load docker-image vitalsync-backend:latest
fi

echo "🚀 Creating namespace and applying manifests..."
cd "$SCRIPT_DIR"
kubectl apply -f namespace.yaml
kubectl apply -f postgres.yaml
kubectl apply -f kafka.yaml
kubectl apply -f kafka-ui.yaml
kubectl apply -f backend.yaml

echo "✅ Deployment complete!"
echo ""
echo "📊 Check pod status:"
echo "  kubectl get pods -n vitalsync"
echo ""
echo "🔍 View logs:"
echo "  kubectl logs -n vitalsync -l app=vitalsync-backend -f"
echo ""
echo "🌐 Access services:"
echo "  Backend: kubectl port-forward -n vitalsync svc/vitalsync-backend 8080:8080"
echo "  Postgres: kubectl port-forward -n vitalsync svc/postgres 5432:5432"
echo "  Kafka: kubectl port-forward -n vitalsync svc/kafka 9092:9092"
