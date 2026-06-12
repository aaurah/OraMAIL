import * as postmark from "postmark";

const token = process.env["ORAMAIL_API_TOKEN"];

let client: postmark.ServerClient | null = null;

export function getEmailClient(): postmark.ServerClient {
  if (!token) {
    throw new Error("ORAMAIL_API_TOKEN is not set");
  }
  if (!client) {
    client = new postmark.ServerClient(token);
  }
  return client;
}

export function isEmailConfigured(): boolean {
  return !!token;
}
