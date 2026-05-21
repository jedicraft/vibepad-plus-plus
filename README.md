# VibePad++

## Table of Contents

- [Overview](#overview)
- [Pipeline: Vibepad-MCP](#pipeline-vibepad-mcp)
  - [Pipeline Summary](#pipeline-summary)
  - [Architecture Diagram](#architecture-diagram)
  - [Codebase Configuration](#codebase-configuration)
  - [Stage 1: Build and Test](#stage-1-build-and-test)
  - [Stage 2: Deploy to Local-Dev](#stage-2-deploy-to-local-dev)
  - [Failure Strategies](#failure-strategies)
  - [Prerequisites](#prerequisites)
  - [Running the Pipeline](#running-the-pipeline)
  - [Troubleshooting](#troubleshooting)

---

## Overview

VibePad++ is a web application built with modern frontend tooling (Vite, TypeScript, Tailwind CSS) and deployed to a local Kubernetes cluster via Harness CI/CD. This document provides detailed documentation for the **Vibepad-MCP** pipeline.

---

## Pipeline: Vibepad-MCP

### Pipeline Summary

| Property | Value |
|----------|-------|
| **Name** | Vibepad-MCP |
| **Identifier** | `VibePadMCP` |
| **Project** | NMcCarthy_Sandbox |
| **Organization** | sandbox |
| **Storage** | Inline (stored in Harness) |
| **Modules Used** | CI, CD, CV (Continuous Verification) |
| **Harness Link** | [Open in Harness](https://app.harness.io/ng/account/EeRjnXTnS4GrLG5VNNJZUw/all/orgs/sandbox/projects/NMcCarthy_Sandbox/pipelines/VibePadMCP/pipeline-studio?storeType=INLINE) |

---

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Vibepad-MCP Pipeline                            │
├─────────────────────────────────┬───────────────────────────────────────┤
│                                 │                                       │
│   Stage 1: Build and Test (CI)  │   Stage 2: Deploy to Local-Dev (CD)  │
│                                 │                                       │
│   ┌───────────────────────┐     │     ┌─────────────────────────┐      │
│   │  Install Dependencies │     │     │   K8s Rolling Deploy    │      │
│   └──────────┬────────────┘     │     └────────────┬────────────┘      │
│              ▼                   │                  ▼                    │
│   ┌───────────────────────┐     │     ┌─────────────────────────┐      │
│   │        Lint           │     │     │  Continuous Verification │      │
│   └──────────┬────────────┘     │     │    (Prometheus + CV)     │      │
│              ▼                   │     └────────────┬────────────┘      │
│   ┌───────────────────────┐     │                  │                    │
│   │        Build          │     │          On Failure:                  │
│   └──────────┬────────────┘     │     ┌─────────────────────────┐      │
│              ▼                   │     │   K8s Rolling Rollback  │      │
│   ┌───────────────────────┐     │     └─────────────────────────┘      │
│   │ Build & Push Docker   │     │                                       │
│   │  (test_ar/vibepadpp)  │     │                                       │
│   └───────────────────────┘     │                                       │
│                                 │                                       │
└─────────────────────────────────┴───────────────────────────────────────┘
```

---

### Codebase Configuration

The pipeline is connected to a GitHub repository via the Harness connector.

| Property | Value |
|----------|-------|
| **Connector** | `jedicraftGitHub` |
| **Repository** | `vibepad-plus-plus` |
| **Build Trigger** | Runtime input (`<+input>`) — branch/tag/PR specified at execution time |

---

### Stage 1: Build and Test

**Type:** CI (Continuous Integration)

**Platform:**
- OS: Linux
- Architecture: Amd64
- Runtime: Harness Cloud

**Features Enabled:**
- Caching: Yes (speeds up dependency resolution across runs)
- Build Intelligence: Yes (smart test selection and step optimization)

#### Steps

##### 1. Install Dependencies

| Property | Value |
|----------|-------|
| **Type** | Run |
| **Image** | `node:20-alpine` |
| **Shell** | Sh |
| **Registry** | DockerHub (account-level connector) |

**Commands:**
```sh
node --version
npm --version
npm install
```

Installs all project dependencies from `package.json`. The version logging helps with debugging build issues.

---

##### 2. Lint

| Property | Value |
|----------|-------|
| **Type** | Run |
| **Image** | `node:20-alpine` |
| **Shell** | Sh |

**Commands:**
```sh
npm run lint
```

Runs ESLint against the codebase to enforce code quality standards. The pipeline will fail if linting errors are detected.

---

##### 3. Build

| Property | Value |
|----------|-------|
| **Type** | Run |
| **Image** | `node:20-alpine` |
| **Shell** | Sh |

**Commands:**
```sh
npm run build
echo "=== Build Output ==="
ls -la dist/
```

Compiles the TypeScript/Vite application into production-ready static assets in the `dist/` directory. The output listing confirms the build artifacts were created successfully.

---

##### 4. Build and Push Docker Image

| Property | Value |
|----------|-------|
| **Type** | BuildAndPushDockerRegistry |
| **Registry** | `test_ar` |
| **Repository** | `vibepadpp` |
| **Dockerfile** | `./Dockerfile` |
| **Context** | `.` (project root) |
| **Caching** | Enabled |

**Tags Applied:**
| Tag | Description |
|-----|-------------|
| `<+pipeline.sequenceId>` | Unique incremental pipeline execution number |
| `latest` | Floating tag pointing to most recent build |

This step builds the Docker image using the project's `Dockerfile` and pushes it to the configured artifact registry.

---

### Stage 2: Deploy to Local-Dev

**Type:** Deployment (Kubernetes)

**Condition:** Only runs when Stage 1 succeeds (`pipelineStatus: Success`)

#### Deployment Configuration

| Property | Value |
|----------|-------|
| **Deployment Type** | Kubernetes |
| **Service** | `vibepadlocal` |
| **Environment** | `nmccarthylocal` |
| **Infrastructure** | `nmccarthylaptopinfra` |
| **Delegate** | `nmccarthy-laptop-delegate` |

The deployment uses the artifact produced in Stage 1 (primary artifact reference from the service definition).

#### Steps

##### 1. Rollout Deployment

| Property | Value |
|----------|-------|
| **Type** | K8sRollingDeploy |
| **Timeout** | 10 minutes |
| **Skip Dry Run** | No |
| **Pruning** | Disabled |

Performs a Kubernetes rolling deployment, gradually replacing old pods with new ones to ensure zero-downtime deployment.

---

##### 2. Verify (Continuous Verification)

| Property | Value |
|----------|-------|
| **Type** | Verify |
| **Verification Type** | Rolling |
| **Timeout** | 2 hours |
| **Duration** | 2 minutes |
| **Sensitivity** | HIGH |
| **Fail on No Analysis** | Yes |

**Health Source:**

| Property | Value |
|----------|-------|
| **Identifier** | `prometheusnmccarthylocal` |
| **Type** | Prometheus |
| **Deployment Tag** | `<+serviceConfig.artifacts.primary.tag>` |

Continuous Verification monitors the deployed application using Prometheus metrics. With HIGH sensitivity, even small deviations from baseline metrics will trigger a failure. The 2-minute analysis window collects metrics from the new deployment and compares them against historical baselines.

If no analysis data is available (e.g., Prometheus is unreachable), the step will **fail** rather than pass silently.

---

### Failure Strategies

Both stages implement the same failure strategy:

| Trigger | Action |
|---------|--------|
| All Errors | Stage Rollback |

**Stage 1 (CI):** On failure, the stage is rolled back (build artifacts are not pushed).

**Stage 2 (CD):** On failure, the rollback steps execute:

| Step | Type | Timeout |
|------|------|---------|
| Rollback Rollout Deployment | K8sRollingRollback | 10 minutes |

This reverts the Kubernetes deployment to the previous stable version.

---

### Prerequisites

To run this pipeline successfully, the following must be configured:

| Requirement | Details |
|-------------|---------|
| **GitHub Connector** | `jedicraftGitHub` — access to `vibepad-plus-plus` repo |
| **Docker Registry** | `test_ar` — push access for built images |
| **DockerHub Connector** | Account-level `DockerHub` — pull access for `node:20-alpine` |
| **Harness Delegate** | `nmccarthy-laptop-delegate` — running on local K8s cluster |
| **Kubernetes Cluster** | Local cluster accessible by the delegate |
| **Prometheus** | Running and configured as a health source for CV |
| **Service Definition** | `vibepadlocal` — with K8s manifests and artifact configuration |
| **Environment** | `nmccarthylocal` — mapped to the local infrastructure |

---

### Running the Pipeline

1. Navigate to the [pipeline in Harness](https://app.harness.io/ng/account/EeRjnXTnS4GrLG5VNNJZUw/all/orgs/sandbox/projects/NMcCarthy_Sandbox/pipelines/VibePadMCP/pipeline-studio?storeType=INLINE)
2. Click **Run**
3. Provide the required runtime input:
   - **Build type**: Select branch, tag, or PR
   - **Branch/Tag name**: e.g., `main`
4. Click **Run Pipeline**

The pipeline will:
1. Clone the repository
2. Install dependencies, lint, and build the application
3. Build and push a Docker image to the artifact registry
4. Deploy the image to the local Kubernetes cluster
5. Verify the deployment health using Prometheus metrics
6. Automatically rollback if verification fails

---

### Troubleshooting

| Issue | Possible Cause | Resolution |
|-------|---------------|------------|
| Install Dependencies fails | Network issues or corrupted cache | Clear pipeline cache and retry |
| Lint step fails | Code quality violations | Run `npm run lint` locally and fix errors |
| Build step fails | TypeScript compilation errors | Run `npm run build` locally to identify issues |
| Docker push fails | Registry authentication or connectivity | Verify `test_ar` connector credentials |
| Deploy times out | Delegate offline or K8s cluster unreachable | Check delegate status in Harness UI |
| Verification fails | Metrics deviation or Prometheus down | Check Prometheus dashboard; review CV analysis in Harness |
| Rollback fails | K8s cluster state inconsistency | Manually check pod status with `kubectl get pods` |
