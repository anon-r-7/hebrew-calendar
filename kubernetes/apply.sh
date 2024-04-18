# Install nginx and cert manager
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml

# Check nginx and cert manager
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get pods --namespace ingress-nginx
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get pods --namespace cert-manager

# Investigate nginx controller
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml describe pod ingress-nginx-controller-7dcdbcff84-gqcp9 --namespace ingress-nginx

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

# Get IP Addresses of load balancers
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get svc

# Cp postgres dump for docker locally
docker cp 849df1474008:/tmp/hebrew_feasts_dump.sql ./dump.sql

# SSH into pod
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml exec -it db-64cdfb6b58-j744m -- /bin/bash

# Cp file to db
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml cp dump.sql db-64cdfb6b58-j744m  :/tmp/dump_file.sql

# Import SQL 
psql -U postgres -d hebrew_calendar -f /tmp/dump_file.sql

# Verify sql import
psql -U postgres -d hebrew_calendar -c "SELECT * FROM hebrew_events LIMIT 5;"

# Stop deployments (scale to 0)
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml scale deployment/ui --replicas=0
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml scale deployment/api --replicas=0
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml scale deployment/db --replicas=0

# Debugging once ssh'd into a node
sudo journalctl -u kubelet
dmesg | grep -i error
sudo systemctl restart kubelet

# Drain a node
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml drain hebrewfeast-pool-jgeg7 --ignore-daemonsets --delete-local-data
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml drain hebrewfeast-pool-jgeg7 --ignore-daemonsets --delete-local-data --force



kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get pods -n cert-manager
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml logs -n cert-manager cert-manager-67c98b89c8-rkkkv     | grep 'challenge'
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete challenge,order --all-namespaces --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml get ingress --all-namespaces -o yaml
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml scale rs acme-challenge-responder-879d44594 --replicas=0

kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml apply -f config/tmp-config-map.yaml


kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml logs -n default -l app=acme-challenge-responder
