# setup k8s api access


# setup ghcr.io image pull secret


# Setup Observability 

## Add helm repo
helm repo add grafana https://grafana.github.io/helm-charts
https://prometheus-community.github.io/helm-charts

## Install Grafana (G)
helm install grafana grafana/grafana –set persistence.enabled=true  –set adminPassword=12345

## Install Prometheus (P)
helm install prometheus prometheus-community/prometheus

## Install Loki and Promtail (L)
helm install loki grafana/loki-stack

## Install Grafana Tempo (T)
helm install observe-tempo grafana/tempo





