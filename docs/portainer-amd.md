# IPRISM Portainer Infrastructure Documentation for AMD Server

## Table of Contents

- [Overview](#overview)
- [Accessing Portainer](#accessing-portainer)
  - [URL](#url)
- [Infrastructure Hierarchy](#infrastructure-hierarchy)
- [Environment Structure](#environment-structure)
- [Administration](#administration)
- [Team Leaders](#team-leaders)
- [User Onboarding Process](#user-onboarding-process)
- [Environment Availability](#environment-availability)
- [Resource Management Guidelines](#resource-management-guidelines)
- [Migration from Local Environment](#migration-from-local-environment)
- [Migration Guidelines](#migration-guidelines)
- [Migration Procedure](#migration-procedure)
- [Recommended Project Structure](#recommended-project-structure)
- [Best Practices](#best-practices)
  - [Naming Conventions](#naming-conventions)
- [Security Recommendations](#security-recommendations)
- [Contact](#contact)

## Overview

The IPRISM Portainer infrastructure is designed to provide a centralized and maintainable Docker management platform for research projects, internal applications, and experimental environments.

The platform enables:

- Isolation between projects
- Controlled access management
- Better maintainability of Docker resources
- Standardized deployment through Portainer Stacks and Docker Compose
- Clear ownership and responsibility structure

---

# Accessing Portainer

## URL

```text
https://195.251.57.20:9443/
```

> [!WARNING]
> - Always use `https://`
> - Your browser will likely display a security warning because the server uses a self-signed certificate.
> - Proceed through the warning and continue to the website.

---

# Infrastructure Hierarchy

```text
IPRISM PORTAINER
│
├── Project Environments
│   ├── terra
│   ├── trace
│   ├── ellie
│   ├── escort
│   ├── iflora
│   └── research
│
├── Environment Groups
│   ├── terra-team
│   ├── trace-team
│   ├── ellie-team
│   ├── escort-team
│   ├── iflora-team
│   └── research-team
│
└── User Teams
    ├── Admins
    ├── TERRA
    ├── TRACE
    ├── ELLIE
    ├── ESCORT
    ├── IFLORA
    └── Research-Team
```

User Teams are accessible and handled by Team Leaders.
Environments and Environment Groups are accessible and handled only by admins.

---

# Environment Structure

Each project has:

- One dedicated Portainer Environment
- One dedicated Environment Group
- One dedicated User Team

This creates logical separation between projects while maintaining centralized infrastructure management.

| Project | Environment | Environment Group | User Team |
|---|---|---|---|
| TERRA | terra | terra-team | TERRA |
| TRACE | trace | trace-team | TRACE |
| ELLIE | ellie | ellie-team | ELLIE |
| ESCORT | escort | escort-team | ESCORT |
| IFLORA | iflora | iflora-team | IFLORA |
| Research | research | research-team | Research-Team |

---

# Administration

## Administrators

Administrators are responsible for:

- Global infrastructure management
- Environment creation and maintenance
- User onboarding
- Security management
- Access control
- Monitoring and troubleshooting
- Backup and recovery operations

---

# Team Leaders

Each project team has a designated team leader responsible for maintaining team membership and coordinating project infrastructure usage.

| Team | Team Leader(s) |
|---|---|
| TERRA | Dionysis Giannaropoulos |
| TRACE | Nikolas Tymplalexis |
| ELLIE | Christos Kylafas |
| ESCORT | Maria Papathanasaki |
| IFLORA | Thanasis Koukosias |
| Research-Team | Dionysis Giannaropoulos, Christos Kylafas, Thanasis Koukosias|
| Admins | Dionysis Giannaropoulos, Christos Kylafas, Thanasis Koukosias |

---

# User Onboarding Process

## Account Creation

New user accounts are created by administrators.

The onboarding process includes:

1. Creation of username
2. Assignment of temporary password
3. Initial team assignment
4. Access assignment to relevant environments

---

## First Login

After receiving credentials, the user must:

1. Login to Portainer
2. Change the temporary password immediately

Navigate to:

```text
https://195.251.57.20:9443/#!/account
```

and update the account password.

---

# Environment Availability

All environments are expected to remain operational and accessible.

If an environment appears unavailable or offline:

- Contact an administrator
- Or contact the corresponding team leader

---

# Resource Management Guidelines

## Important Principles

The infrastructure follows several important operational principles:

### 1. Prefer Portainer Stacks

All deployments should preferably be managed as:

- Portainer Stacks
- Docker Compose deployments

instead of standalone containers.

---

### 2. Avoid Manual Containers

Avoid unmanaged deployments using direct `docker run` commands unless absolutely necessary.

Infrastructure should remain reproducible and maintainable.

---

### 3. Separate Project Resources

Projects should maintain isolated:

- Networks
- Volumes
- Containers
- Compose files
- Environment variables

---

# Migration from Local Environment

## Temporary Local Environment Access

**Team leaders** currently have temporary access to the legacy local Portainer environment in order to migrate existing resources.

The goal is to move all active workloads into the appropriate project environments.

---

# Migration Guidelines

## Important Notes

Containers should **not** simply be copied or moved directly between environments.

Instead:

- Recreate services using Docker Compose
- Redeploy them as Portainer Stacks
- Restore persistent data where required

---

# Migration Procedure

## Step 1 — Identify Existing Resources

Review:

- Containers
- Stacks
- Images
- Volumes
- Networks

and determine which resources are still required.

---

## Step 2 — Export or Recreate Compose Files

Each project should have a proper:

```text
docker-compose.yml
```

definition for reproducible deployments.

---

## Step 3 — Validate Dependencies

Check:

- Images
- Ports
- Environment variables
- Mounted volumes
- Networks
- GPU requirements
- Persistent storage requirements

---

## Step 4 — Deploy in Correct Environment

Deploy the project using:

- Portainer Stacks
- Docker Compose

inside the correct project environment.

---

## Step 5 — Restore Persistent Data

If required, restore:

- Databases
- Uploaded files
- Model checkpoints
- Experiment outputs
- Shared datasets

from existing Docker volumes or backups.

---

## Step 6 — Validate Deployment

Verify that:

- Services start correctly
- APIs are reachable
- Networks function correctly
- Persistent data is accessible
- GPU workloads function correctly (if applicable)

---

## Step 7 — Inform Administrators

After migration completion:

- Inform the administrators
- Old local resources may then be safely removed

---

# Recommended Project Structure

A standardized structure is recommended for all projects.

Example:

```text
/opt/stacks/
├── project1/
│   ├── docker-compose.yml
│   ├── .env
│   └── volumes/
│
├── research/
│   ├── docker-compose.yml
│   └── configs/
│
└── project2/
    └── docker-compose.yml
```

---

# Best Practices

## Naming Conventions

Use descriptive names for:

- Containers
- Networks
- Volumes
- Stacks

Example:

```text
terra_forecast_api
terra_postgres
terra_network
terra_model_storage
```

Avoid generic names such as:

```text
app
api
db
test
container1
```

---

# Security Recommendations

- Do not share accounts between users
- Use strong passwords
- Restrict access only to required environments
- Avoid exposing unnecessary ports publicly
- Use HTTPS whenever possible

---

# Contact

## Administrators

The following users currently have administrator privileges:
- Christos Kilafas (ckylafas@uth.gr)
- Athanasios Koukosias (akoukosias@uth.gr)
- Dionysis Giannaropoulos (dgiannar@uth.gr)

For infrastructure issues, environment problems, onboarding requests, or migration support, please contact the administrators.
