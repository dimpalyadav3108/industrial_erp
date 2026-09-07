import type { ApiErrorResponse } from "../types/auth";
import type {
  CreateCustomerInput,
  CustomerListResponse,
  CustomerResponse,
} from "../types/customer";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthorizationHeader(): Record<string, string> {
  const accessToken = sessionStorage.getItem("accessToken");

  if (!accessToken) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getCustomers(
  search = ""
): Promise<CustomerListResponse> {
  const query = search
    ? `?search=${encodeURIComponent(search)}`
    : "";

  const response = await fetch(`${API_URL}/customers${query}`, {
    headers: getAuthorizationHeader(),
  });

  const result = (await response.json()) as
    | CustomerListResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
  "message" in result
    ? result.message
    : "Unable to load customers"
);
  }

  return result as CustomerListResponse;
}

export async function createCustomer(
  input: CreateCustomerInput
): Promise<CustomerResponse> {
  const response = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: {
      ...getAuthorizationHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = (await response.json()) as
    | CustomerResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to create customer");
  }

  return result as CustomerResponse;
}