const TOKEN_KEY = "auth_token";

let memoryToken: string | null = null;

export async function saveToken(token: string) {
  memoryToken = token;
}

export async function getToken() {
  return memoryToken;
}

export async function clearToken() {
  memoryToken = null;
}
