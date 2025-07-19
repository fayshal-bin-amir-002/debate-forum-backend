# Debate Forum — Backend

This is the backend for the **Debate Forum** — a platform where users can participate in structured debates and discussions. The backend is built using **Node.js**, **Express**, **TypeScript**, and **Prisma ORM** with **PostgreSQL**.

> 🌐 Live Link: [https://debate-forum-bay.vercel.app/](https://debate-forum-bay.vercel.app/)

---

## 🚀 Features

- 🔐 JWT-based authentication
- 👤 User registration and login
- 🗣️ Debate and argument management
- 🧾 Zod-based request validation
- 🌐 CORS and cookie support
- 📦 PostgreSQL database via Prisma ORM
- 📁 Modular folder structure (e.g., routes, controllers, services)

---

## ⚙️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JSON Web Tokens (JWT)
- **Validation**: Zod
- **Security**: bcrypt, cookie-parser
- **Environment Management**: dotenv

---

## 📁 Project Structure

```txt
.
├── src/
│   ├── app/             # Main route handlers
│   ├── config/          # Environment and DB configs
│   ├── middlewares/     # Global error and auth middlewares
│   ├── modules/         # Features like user, debate, auth
│   ├── shared/          # Utilities and constants
│   └── server.ts        # Entry point
├── prisma/
│   └── schema.prisma    # Prisma schema
├── dist/                # Production build output
├── .env                 # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```
