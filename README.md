## Project Setup

### Prerequisites

- [Node.js](https://nodejs.org/) and npm installed
- [MySQL](https://www.mysql.com/) server running
- Database `shade_system_test` 

---

### 1. Clone the repository

```sh
git clone https://github.com/OfekYosef-D/automatic-shade-sys.git
cd automatic-shade-sys
```

---

### 2. Install and start the backend

```sh
cd server
npm install
npm start
```
- The backend server will run at [http://localhost:3000](http://localhost:3000)
- Make sure to update `server/index.js` with your MySQL credentials if needed

---

### 3. Install and start the frontend

Open a new terminal window:

```sh
cd client
npm install
npm run dev
```
- The frontend will run at [http://localhost:5173](http://localhost:5173)

---

**Both the backend and frontend servers must be
