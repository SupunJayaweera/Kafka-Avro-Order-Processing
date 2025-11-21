# Kafka-Avro-Order-Processing

A production-ready Kafka-based order processing system with Avro serialization, real-time aggregation, retry logic, and Dead Letter Queue (DLQ) support. Built with Node.js and TypeScript.

## 🚀 Features

- **Avro Serialization**: Messages are serialized using Apache Avro schema for efficient data transfer
- **Real-time Aggregation**: Calculates running average of order prices in real-time
- **Retry Logic**: Automatic retry mechanism for temporary failures (up to 3 attempts with 2s delay)
- **Dead Letter Queue (DLQ)**: Failed messages after max retries are preserved in DLQ for investigation
- **Schema Registry**: Integration with Confluent Schema Registry for schema management
- **Monitoring**: Kafka UI dashboard for visual monitoring and debugging

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker Desktop** (v20.10 or higher)
  - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
  - Mac: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)
- **Docker Compose** (usually included with Docker Desktop)
- **Node.js** (v16 or higher) - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

## 📦 Installation & Setup

Follow these steps to set up the project on your local machine:

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/SupunJayaweera/Kafka-Avro-Order-Processing.git

# Navigate to the project directory
cd Kafka-Avro-Order-Processing
```

### Install Node.js Dependencies

```bash
# Install all required npm packages
npm install
```

This will install:

- `kafkajs` - Kafka client for Node.js
- `@kafkajs/confluent-schema-registry` - Schema Registry client
- `avsc` - Avro serialization library
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution engine
- And other development dependencies

### Verify Docker Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 20.10.x or higher

# Check Docker Compose version
docker-compose --version
# Expected: Docker Compose version 2.x or higher
```

If Docker is not installed, please install Docker Desktop from the prerequisites section.

### Start Kafka Infrastructure

````bash
# Start all services in detached mode
docker-compose up -d


### Step 5: Verify Services are Running

```bash
# Check status of all services
docker-compose ps
````

### Verify Kafka UI Access

Open the web browser and navigate to:

```
http://localhost:8080
```
