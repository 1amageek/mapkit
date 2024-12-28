import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export const revalidate = 60 * 5 // キャッシュ期間を5分に設定

export async function GET(request: NextRequest) {
  const { token, expiresAt } = getToken()
  return NextResponse.json({ token, expiresAt })
}

function getToken() {
  const KEY = process.env.KEY!
  const issuer = process.env.issuer!
  const keyID = process.env.keyID!
  const expiresInSeconds = 5 * 24 * 60 * 60
  const token = jwt.sign({}, KEY, {
    algorithm: "ES256",
    expiresIn: expiresInSeconds,
    issuer: issuer,
    keyid: keyID,
    header: {
      alg: "ES256",
      kid: keyID,
    }
  })

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds

  return { token, expiresAt }
}
