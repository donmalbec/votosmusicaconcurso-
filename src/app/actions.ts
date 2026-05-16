"use server";

import { headers } from "next/headers";

/**
 * Server Action para obtener la IP real del cliente de forma segura.
 * Utiliza los headers de Next.js que son inyectados por el proxy/hosting.
 */
export async function getClientIP() {
  const headerList = await headers();
  
  // Lista de headers comunes donde los proxies guardan la IP real
  const xForwardedFor = headerList.get("x-forwarded-for");
  const realIP = headerList.get("x-real-ip");
  
  if (xForwardedFor) {
    // x-forwarded-for puede contener una lista de IPs, la primera es la del cliente
    return xForwardedFor.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }

  return "127.0.0.1"; // Fallback para desarrollo local
}

/**
 * Verifica la contraseña del administrador en el servidor.
 */
export async function verifyAdminPassword(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD || "pizzadaoconcurso2026";
  return password === correctPassword;
}
