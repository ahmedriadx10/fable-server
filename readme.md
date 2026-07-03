# Fable Server

A secure, high-performance REST API powering the Fable eBook sharing platform.

## Description

Fable Server is a backend API built with Node.js and Express that manages user roles, eBook publishing, bookmarks, and purchases. It solves digital rights management by restricting eBook content access to verified buyers and authors. The server supports the frontend client by delivering secure user endpoints, search-and-filter catalogs, and aggregated dashboard analytics.

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit-brightgreen)](https://fable-client-sepia.vercel.app)
[![GitHub stars](https://img.shields.io/github/stars/ahmedriadx10/fable-server)](https://github.com/ahmedriadx10/fable-server)

</div>

## ✨ Features

- **JWKS Authentication** – Verifies user sessions statelessly by validating tokens against key sets fetched from the client auth endpoint.
- **Role-Based Authorization** – Restricts API access across Admin, Writer, and Reader roles using custom validation middleware.
- **Owner-Validated Access Control** – Ensures users can only access or modify their own bookmarks, transaction records, and dashboard stats.
- **EBook Content Protection** – Redacts the full eBook contents from public API views, releasing it only to verified purchasers and the author.
- **Catalog Queries & Pagination** – Supports text search, price limit parameters, genre filters, sorting, and pagination logic on eBook queries.
- **MongoDB Aggregations** – Uses database pipelines to compute top writer metrics, monthly sales histories, and genre distributions.
- **Safe Purchases** – Validates payment records to prevent readers from purchasing the same eBook multiple times.

## 🛠 Tech Stack

### Runtime
- Node.js (v18+)

### Framework
- Express.js (v5.x)

### Database
- MongoDB (via Native Node.js Driver v7.x)

### Authentication
- JWT & JWKS (via `jose-cjs` library)

### Tools
- `dotenv` (Environment Config)
- `cors` (Cross-Origin Policy)

## 🚀 Getting Started

### Clone Repository
```bash
git clone <repository-url>
cd fable-server
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
```

### Run Development Server
```bash
node index.js
```
