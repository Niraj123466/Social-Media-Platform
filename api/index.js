import dotenv from "dotenv"
import connectDB from "../src/db/index.js"
import { app } from "../src/app.js"

dotenv.config({ path: "./.env" })

let isDatabaseConnected = false

async function ensureDbConnection() {
  if (!isDatabaseConnected) {
    await connectDB()
    isDatabaseConnected = true
  }
}

export default async function handler(req, res) {
  await ensureDbConnection()
  return app(req, res)
}


