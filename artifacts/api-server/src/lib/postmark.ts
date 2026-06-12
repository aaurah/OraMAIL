import * as postmark from "postmark";

const token = process.env["POSTMARK_SERVER_TOKEN"];

let client: postmark.ServerClient | null = null;

export function getPostmarkClient(): postmark.ServerClient {
  if (!token) {
    throw new Error("POSTMARK_SERVER_TOKEN is not set");
  }
  if (!client) {
    client = new postmark.ServerClient(token);
  }
  return client;
}

export function isPostmarkConfigured(): boolean {
  return !!token;
}
