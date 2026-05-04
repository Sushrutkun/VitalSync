# Kubernetes Deployment

VitalSync backend and infrastructure can be deployed to Kubernetes using the manifests in this directory.

## Quick Start

### Prerequisites

- Kubernetes cluster (local: minikube, kind, Docker Desktop; cloud: EKS, GKE, AKS)
- `kubectl` configured to access your cluster
- Docker for building images (local deployments)
- Maven 3.9+ for building the backend

### Deployment

```bash
# Deploy to K8s (builds backend image, creates namespace, applies manifests)
./deploy.sh
```

This script:
1. Builds the backend JAR and Docker image
2. Loads image into minikube/kind if using local cluster
3. Creates `vitalsync` namespace
4. Deploys Postgres, Kafka, and backend services

### Port Forward to Local Machine

```bash
# Backend API (8080)
kubectl port-forward -n vitalsync svc/vitalsync-backend 8080:8080

# Postgres (5432)
kubectl port-forward -n vitalsync svc/postgres 5432:5432

# Kafka (9092)
kubectl port-forward -n vitalsync svc/kafka 9092:9092

# Kafka UI (9021)
kubectl port-forward -n vitalsync svc/kafka-ui 9021:9021
```

Then access:
- API: `http://localhost:8080/actuator/health`
- Kafka UI: `http://localhost:9021`

### Monitoring

```bash
# List pods
kubectl get pods -n vitalsync

# View logs
kubectl logs -n vitalsync -l app=vitalsync-backend -f

# Describe deployment
kubectl describe deployment -n vitalsync vitalsync-backend

# Watch status
kubectl get pods -n vitalsync --watch
```

### Cleanup

```bash
# Remove all resources
./destroy.sh
```

## Manifest Files

- **namespace.yaml** - `vitalsync` namespace and shared resources
- **postgres.yaml** - PostgreSQL Deployment + Service + Secret
- **kafka.yaml** - Kafka + Zookeeper Deployment + Services
- **kafka-ui.yaml** - Kafka UI for cluster management
- **backend.yaml** - Backend app Deployment + Service + JWT Secret

## Configuration

### Database Credentials

Edit `postgres.yaml` before deployment:

```yaml
stringData:
  POSTGRES_USER: vitalsync
  POSTGRES_PASSWORD: change-me-in-prod  # ← Change this
  POSTGRES_DB: vitalsync
```

### JWT Secret

Edit `backend.yaml` before deployment:

```yaml
stringData:
  JWT_SECRET: "..."  # ← Generate with: openssl rand -hex 32
```

### Backend Configuration

Environment variables passed via Kubernetes Secrets and ConfigMaps:

```yaml
env:
  - name: DB_URL
    value: "jdbc:postgresql://postgres.vitalsync.svc.cluster.local:5432/vitalsync"
  - name: KAFKA_BOOTSTRAP_SERVERS
    value: "kafka.vitalsync.svc.cluster.local:9092"
```

Modify in `backend.yaml` if needed.

## Storage

**Note:** Postgres uses `emptyDir` (in-memory) by default. This is demo-grade and data is lost on pod restart.

For production, replace `volumes` in `postgres.yaml`:

```yaml
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: postgres-pvc
```

And create a PersistentVolumeClaim:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: vitalsync
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## Resource Limits

Backend deployment requests/limits (configurable in `backend.yaml`):

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

Adjust based on your cluster capacity and traffic.

## Scaling

Scale backend replicas:

```bash
kubectl scale deployment vitalsync-backend -n vitalsync --replicas=3
```

## Troubleshooting

### Pod stuck in Pending

```bash
kubectl describe pod -n vitalsync <pod-name>
```

Check for resource constraints or node issues.

### CrashLoopBackOff

```bash
kubectl logs -n vitalsync <pod-name>
```

View logs to see startup errors.

### Image Pull Errors (local K8s)

Ensure image is loaded:
- Minikube: `minikube image load vitalsync-backend:latest`
- Kind: `kind load docker-image vitalsync-backend:latest`

### Database Connection Timeout

```bash
# Test connectivity from backend pod
kubectl exec -it -n vitalsync <backend-pod> -- bash
curl postgres.vitalsync.svc.cluster.local:5432
```

### Kafka Not Available

```bash
# Check Kafka logs
kubectl logs -n vitalsync -l app=kafka

# Verify Kafka service DNS
kubectl exec -it -n vitalsync <backend-pod> -- nslookup kafka.vitalsync.svc.cluster.local
```

## References

- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Spring Boot on Kubernetes](https://spring.io/guides/gs/spring-boot-kubernetes/)
- [Postgres Operator](https://github.com/zalando/postgres-operator)
