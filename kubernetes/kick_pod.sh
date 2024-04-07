# kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml rollout restart deployment/db && \
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml rollout restart deployment/api && \
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml rollout restart deployment/ui
