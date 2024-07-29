# kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete deployment <name>
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete deployments --all


kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete all --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete services --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete replicasets --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete daemonsets --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete statefulsets --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete jobs --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete cronjobs --all
kubectl --kubeconfig=k8s-hebrew-feasts-kubeconfig.yaml delete pvc --all
