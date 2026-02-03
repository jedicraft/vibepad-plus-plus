output "cluster_name" {
  description = "The name of the GKE cluster"
  value       = google_container_cluster.vibepad_test.name
}

output "cluster_endpoint" {
  description = "The endpoint of the GKE cluster"
  value       = google_container_cluster.vibepad_test.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "The CA certificate of the GKE cluster"
  value       = google_container_cluster.vibepad_test.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "artifact_registry_url" {
  description = "The URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.vibepad_repo.repository_id}"
}

output "static_ip" {
  description = "The static IP address for the ingress"
  value       = google_compute_global_address.vibepad_ip.address
}

output "network_name" {
  description = "The name of the VPC network"
  value       = google_compute_network.vibepad_network.name
}

output "subnet_name" {
  description = "The name of the subnet"
  value       = google_compute_subnetwork.vibepad_subnet.name
}

output "service_account_email" {
  description = "The email of the GKE service account"
  value       = google_service_account.gke_sa.email
}

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.vibepad_test.name} --zone ${var.zone} --project ${var.project_id}"
}
