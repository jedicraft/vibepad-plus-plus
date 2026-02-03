terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
  }

  backend "gcs" {
    bucket = "vibepad-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GKE Cluster for test environment
resource "google_container_cluster" "vibepad_test" {
  name     = "vibepad-test-${var.environment}"
  location = var.zone

  # Remove default node pool
  remove_default_node_pool = true
  initial_node_count       = 1

  # Network configuration
  network    = google_compute_network.vibepad_network.name
  subnetwork = google_compute_subnetwork.vibepad_subnet.name

  # Enable workload identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Cluster addons
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  # Release channel for automatic upgrades
  release_channel {
    channel = "REGULAR"
  }

  deletion_protection = false
}

# Node pool for the test cluster
resource "google_container_node_pool" "vibepad_nodes" {
  name       = "vibepad-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.vibepad_test.name
  node_count = var.node_count

  node_config {
    machine_type = var.machine_type
    disk_size_gb = 50
    disk_type    = "pd-standard"

    # Google recommends custom service accounts with minimal permissions
    service_account = google_service_account.gke_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.environment
    }

    # Enable workload identity on nodes
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  autoscaling {
    min_node_count = 1
    max_node_count = 3
  }
}

# VPC Network
resource "google_compute_network" "vibepad_network" {
  name                    = "vibepad-network-${var.environment}"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "vibepad_subnet" {
  name          = "vibepad-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vibepad_network.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# Service account for GKE nodes
resource "google_service_account" "gke_sa" {
  account_id   = "vibepad-gke-sa-${var.environment}"
  display_name = "Vibepad GKE Service Account"
}

# Grant necessary permissions to the service account
resource "google_project_iam_member" "gke_sa_roles" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/monitoring.viewer",
    "roles/storage.objectViewer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
}

# Container Registry for storing Docker images
resource "google_artifact_registry_repository" "vibepad_repo" {
  location      = var.region
  repository_id = "vibepad-${var.environment}"
  description   = "Docker repository for Vibepad"
  format        = "DOCKER"
}

# Static IP for the ingress
resource "google_compute_global_address" "vibepad_ip" {
  name = "vibepad-ip-${var.environment}"
}

# Firewall rule for health checks
resource "google_compute_firewall" "allow_health_checks" {
  name    = "allow-health-checks-${var.environment}"
  network = google_compute_network.vibepad_network.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["gke-node"]
}
