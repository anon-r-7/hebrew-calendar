# Install nginx and cert manager
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml

# Check nginx and cert manager
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get pods --namespace ingress-nginx
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get pods --namespace cert-manager

# Investigate nginx controller
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml describe pod ingress-nginx-controller-7dcdbcff84-9zb2r --namespace ingress-nginx

# Install cert manager cluster
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f config/letsencrypt-clusterissuer.yaml

# Apply secrets, should look like this except change the values

# Github authentication
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml create secret docker-registry ghcr-credentials \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<pat> \
  --docker-email=<email>

# Create secret for db password
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml create secret generic db-secret --from-literal=POSTGRES_PASSWORD='<pass>'

# Install all resources
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f config

# Check status of all pods
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get pods 

# Restart certain pods
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml rollout restart deployment/ui
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml rollout restart deployment/api

# Update resources triggering rebuild
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f config
