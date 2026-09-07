import type {
  ApiErrorResponse,
  LoginResponse,
  User,
} from "../types/auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = (await response.json()) as
    | LoginResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Login failed");
  }

  const loginResult = result as LoginResponse;

  sessionStorage.setItem(
    "accessToken",
    loginResult.data.accessToken
  );
  sessionStorage.setItem(
    "refreshToken",
    loginResult.data.refreshToken
  );
  sessionStorage.setItem(
    "user",
    JSON.stringify(loginResult.data.user)
  );

  return loginResult;
}

export function getStoredUser(): User | null {
  const storedUser = sessionStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    sessionStorage.removeItem("user");
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");
}