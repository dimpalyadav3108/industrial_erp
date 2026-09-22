import type {
  CreateDrawingRevisionPayload,
  CreateEngineeringBomItemPayload,
  CreateEngineeringBomPayload,
  CreateEngineeringDrawingPayload,
  CreateEngineeringProjectPayload,
  EngineeringBom,
  EngineeringBomItem,
  EngineeringBomItemResponse,
  EngineeringBomListResponse,
  EngineeringBomResponse,
  EngineeringDrawing,
  EngineeringDrawingResponse,
  EngineeringProject,
  EngineeringProjectListResponse,
  EngineeringProjectResponse,
  EngineeringRevisionResponse,
  UpdateDrawingRevisionPayload,
  UpdateEngineeringBomItemPayload,
  UpdateEngineeringBomPayload,
  UpdateEngineeringProjectPayload,
} from "../types/engineering";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

const headers = (json = false) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  return {
    ...(json
      ? { "Content-Type": "application/json" }
      : {}),
    Authorization: `Bearer ${token}`,
  };
};

async function readResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const result = (await response.json()) as
    | T
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      (result as ApiErrorResponse).message ||
        fallbackMessage
    );
  }

  return result as T;
}

// ============================================================
// ENGINEERING PROJECTS
// ============================================================

export const getEngineeringProjects = async (
  search = ""
): Promise<EngineeringProject[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";

  const response = await fetch(
    `${API_URL}/engineering${query}`,
    {
      headers: headers(),
    }
  );

  const result =
    await readResponse<EngineeringProjectListResponse>(
      response,
      "Unable to load engineering projects"
    );

  return result.data;
};

export const getEngineeringProject = async (
  projectId: string
): Promise<EngineeringProject> => {
  const response = await fetch(
    `${API_URL}/engineering/${encodeURIComponent(
      projectId
    )}`,
    {
      headers: headers(),
    }
  );

  const result =
    await readResponse<EngineeringProjectResponse>(
      response,
      "Unable to load engineering project"
    );

  return result.data;
};

export const createEngineeringProject = async (
  payload: CreateEngineeringProjectPayload
): Promise<EngineeringProject> => {
  const response = await fetch(
    `${API_URL}/engineering`,
    {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringProjectResponse>(
      response,
      "Unable to create engineering project"
    );

  return result.data;
};

export const updateEngineeringProject = async (
  projectId: string,
  payload: UpdateEngineeringProjectPayload
): Promise<EngineeringProject> => {
  const response = await fetch(
    `${API_URL}/engineering/${encodeURIComponent(
      projectId
    )}`,
    {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringProjectResponse>(
      response,
      "Unable to update engineering project"
    );

  return result.data;
};

// ============================================================
// ENGINEERING DRAWINGS
// ============================================================

export const createEngineeringDrawing = async (
  payload: CreateEngineeringDrawingPayload
): Promise<EngineeringDrawing> => {
  const response = await fetch(
    `${API_URL}/engineering/drawings`,
    {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringDrawingResponse>(
      response,
      "Unable to create engineering drawing"
    );

  return result.data;
};

export const createDrawingRevision = async (
  drawingId: string,
  payload: CreateDrawingRevisionPayload
) => {
  const response = await fetch(
    `${API_URL}/engineering/drawings/${encodeURIComponent(
      drawingId
    )}/revisions`,
    {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringRevisionResponse>(
      response,
      "Unable to create drawing revision"
    );

  return result.data;
};

export const updateDrawingRevision = async (
  revisionId: string,
  payload: UpdateDrawingRevisionPayload
) => {
  const response = await fetch(
    `${API_URL}/engineering/revisions/${encodeURIComponent(
      revisionId
    )}`,
    {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringRevisionResponse>(
      response,
      "Unable to update drawing revision"
    );

  return result.data;
};

// ============================================================
// ENGINEERING BOM
// ============================================================

export const getEngineeringBoms = async (
  projectId?: string,
  search = ""
): Promise<EngineeringBom[]> => {
  const params = new URLSearchParams();

  if (projectId) {
    params.set("projectId", projectId);
  }

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/engineering/boms/list${
      query ? `?${query}` : ""
    }`,
    {
      headers: headers(),
    }
  );

  const result =
    await readResponse<EngineeringBomListResponse>(
      response,
      "Unable to load engineering BOMs"
    );

  return result.data;
};

export const getEngineeringBom = async (
  bomId: string
): Promise<EngineeringBom> => {
  const response = await fetch(
    `${API_URL}/engineering/boms/${encodeURIComponent(
      bomId
    )}`,
    {
      headers: headers(),
    }
  );

  const result =
    await readResponse<EngineeringBomResponse>(
      response,
      "Unable to load engineering BOM"
    );

  return result.data;
};

export const createEngineeringBom = async (
  payload: CreateEngineeringBomPayload
): Promise<EngineeringBom> => {
  const response = await fetch(
    `${API_URL}/engineering/boms`,
    {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringBomResponse>(
      response,
      "Unable to create engineering BOM"
    );

  return result.data;
};

export const updateEngineeringBom = async (
  bomId: string,
  payload: UpdateEngineeringBomPayload
): Promise<EngineeringBom> => {
  const response = await fetch(
    `${API_URL}/engineering/boms/${encodeURIComponent(
      bomId
    )}`,
    {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringBomResponse>(
      response,
      "Unable to update engineering BOM"
    );

  return result.data;
};

// ============================================================
// ENGINEERING BOM ITEMS
// ============================================================

export const createEngineeringBomItem = async (
  bomId: string,
  payload: CreateEngineeringBomItemPayload
): Promise<EngineeringBomItem> => {
  const response = await fetch(
    `${API_URL}/engineering/boms/${encodeURIComponent(
      bomId
    )}/items`,
    {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringBomItemResponse>(
      response,
      "Unable to add BOM item"
    );

  return result.data;
};

export const updateEngineeringBomItem = async (
  itemId: string,
  payload: UpdateEngineeringBomItemPayload
): Promise<EngineeringBomItem> => {
  const response = await fetch(
    `${API_URL}/engineering/bom-items/${encodeURIComponent(
      itemId
    )}`,
    {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );

  const result =
    await readResponse<EngineeringBomItemResponse>(
      response,
      "Unable to update BOM item"
    );

  return result.data;
};

export const deleteEngineeringBomItem = async (
  itemId: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/engineering/bom-items/${encodeURIComponent(
      itemId
    )}`,
    {
      method: "DELETE",
      headers: headers(),
    }
  );

  await readResponse<{ success: true; message: string }>(
    response,
    "Unable to delete BOM item"
  );
};