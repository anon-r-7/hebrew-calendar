# kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml create secret docker-registry ghcr-credentials \
#   --docker-server=ghcr.io \
#   --docker-username=YOUR_USERNAME \
#   --docker-password=YOUR_PAT

# kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml create secret generic docker-credentials \
#   --from-literal=DOCKER_USERNAME=YOUR_USERNAME \
#   --from-literal=DOCKER_PAT=YOUR_PAT

# kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml create secret generic api-secrets \
#   --from-literal=OPENAPI_KEY=MY_KEY \
