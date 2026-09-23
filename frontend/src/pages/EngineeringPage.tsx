import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  DraftingCompass,
  FileText,
  Loader2,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  createDrawingRevision,
  createEngineeringBom,
  createEngineeringBomItem,
  createEngineeringDrawing,
  createEngineeringProject,
  deleteEngineeringBomItem,
  getEngineeringProjects,
  updateDrawingRevision,
  updateEngineeringBom,
} from "../services/engineering.service";

import { getQuotations } from "../services/quotation.service";

import type {
  CreateEngineeringBomItemPayload,
  CreateEngineeringBomPayload,
  CreateEngineeringDrawingPayload,
  CreateEngineeringProjectPayload,
  DrawingCategory,
  DrawingRevisionStatus,
  EngineeringBom,
  EngineeringDrawing,
  EngineeringProject,
} from "../types/engineering";

import type { Quotation } from "../types/quotation";

import "./EngineeringPage.css";

// ============================================================
// HELPERS
// ============================================================

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function getCustomerName(quotation: Quotation) {
  return (
    quotation.estimate?.lead?.customer?.companyName ||
    "Customer not available"
  );
}

function getQuotationTitle(quotation: Quotation) {
  return (
    quotation.estimate?.lead?.title ||
    quotation.quotationNumber
  );
}

// ============================================================
// INITIAL FORM
// ============================================================

interface ProjectFormState {
  quotationId: string;
  title: string;
  productFamily: string;
  productModel: string;
  plannedStartDate: string;
  plannedReleaseDate: string;
  notes: string;
}

const initialProjectForm: ProjectFormState = {
  quotationId: "",
  title: "",
  productFamily: "",
  productModel: "",
  plannedStartDate: "",
  plannedReleaseDate: "",
  notes: "",
};

interface DrawingFormState {
  drawingNumber: string;
  title: string;
  category: DrawingCategory;
  description: string;
  documentName: string;
  documentUrl: string;
  changeReason: string;
}

const initialDrawingForm: DrawingFormState = {
  drawingNumber: "",
  title: "",
  category: "GENERAL_ARRANGEMENT",
  description: "",
  documentName: "",
  documentUrl: "",
  changeReason: "Initial issue",
};

interface BomFormState {
  bomNumber: string;
  name: string;
  revision: string;
  description: string;
}

const initialBomForm: BomFormState = {
  bomNumber: "",
  name: "",
  revision: "0",
  description: "",
};

interface BomItemFormState {
  parentItemId: string;
  itemNumber: string;
  name: string;
  quantity: string;
  unit: string;
  source: "MAKE" | "BUY";
  materialSpec: string;
  drawingNumber: string;
  remarks: string;
}

const initialBomItemForm: BomItemFormState = {
  parentItemId: "",
  itemNumber: "1",
  name: "",
  quantity: "1",
  unit: "Nos",
  source: "BUY",
  materialSpec: "",
  drawingNumber: "",
  remarks: "",
};

// ============================================================
// PAGE
// ============================================================

export default function EngineeringPage() {
  const [projects, setProjects] = useState<
    EngineeringProject[]
  >([]);

  const [quotations, setQuotations] = useState<
    Quotation[]
  >([]);

  const [selectedProjectId, setSelectedProjectId] =
    useState<string>("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateProject, setShowCreateProject] =
    useState(false);

  const [creatingProject, setCreatingProject] =
    useState(false);

  const [projectForm, setProjectForm] =
    useState<ProjectFormState>(initialProjectForm);

  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawingForm, setDrawingForm] = useState<DrawingFormState>(initialDrawingForm);
  const [savingDrawing, setSavingDrawing] = useState(false);

  const [showBomModal, setShowBomModal] = useState(false);
  const [bomForm, setBomForm] = useState<BomFormState>(initialBomForm);
  const [savingBom, setSavingBom] = useState(false);

  const [selectedBomId, setSelectedBomId] = useState("");
  const [showBomItemModal, setShowBomItemModal] = useState(false);
  const [bomItemForm, setBomItemForm] = useState<BomItemFormState>(initialBomItemForm);
  const [savingBomItem, setSavingBomItem] = useState(false);

  const [revisionDrawing, setRevisionDrawing] = useState<EngineeringDrawing | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionDocumentName, setRevisionDocumentName] = useState("");
  const [revisionDocumentUrl, setRevisionDocumentUrl] = useState("");
  const [savingRevision, setSavingRevision] = useState(false);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          engineeringProjects,
          quotationRecords,
        ] = await Promise.all([
          getEngineeringProjects(),
          getQuotations(),
        ]);

        setProjects(engineeringProjects);
        setQuotations(quotationRecords);

        setSelectedProjectId((current) => {
          if (
            current &&
            engineeringProjects.some(
              (project) => project.id === current
            )
          ) {
            return current;
          }

          return engineeringProjects[0]?.id || "";
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load engineering data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ==========================================================
  // AVAILABLE QUOTATIONS
  // ==========================================================

  const availableQuotations = useMemo(() => {
    const usedQuotationIds = new Set(
      projects.map((project) => project.quotationId)
    );

    return quotations.filter(
      (quotation) =>
        (quotation.status === "ACCEPTED" ||
          quotation.status === "CONVERTED") &&
        !usedQuotationIds.has(quotation.id)
    );
  }, [projects, quotations]);

  // ==========================================================
  // SEARCHED PROJECTS
  // ==========================================================

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const customer =
        project.quotation?.estimate?.lead?.customer
          ?.companyName || "";

      return [
        project.engineeringNumber,
        project.title,
        project.productFamily || "",
        project.productModel || "",
        project.status,
        project.quotation?.quotationNumber || "",
        customer,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => project.id === selectedProjectId
      ) || null,
    [projects, selectedProjectId]
  );

  // ==========================================================
  // DASHBOARD COUNTS
  // ==========================================================

  const activeProjectCount = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status !== "RELEASED" &&
          project.status !== "CANCELLED"
      ).length,
    [projects]
  );

  const totalDrawings = useMemo(
    () =>
      projects.reduce(
        (total, project) =>
          total + (project.drawings?.length || 0),
        0
      ),
    [projects]
  );

  const totalBoms = useMemo(
    () =>
      projects.reduce(
        (total, project) =>
          total + (project.boms?.length || 0),
        0
      ),
    [projects]
  );

  // ==========================================================
  // CREATE PROJECT MODAL
  // ==========================================================

  function openCreateProject() {
    setError("");
    setSuccess("");

    const firstQuotation =
      availableQuotations[0];

    setProjectForm({
      ...initialProjectForm,
      quotationId: firstQuotation?.id || "",
      title: firstQuotation
        ? getQuotationTitle(firstQuotation)
        : "",
    });

    setShowCreateProject(true);
  }

  function closeCreateProject() {
    if (creatingProject) {
      return;
    }

    setShowCreateProject(false);
    setProjectForm(initialProjectForm);
  }

  function handleQuotationChange(
    quotationId: string
  ) {
    const quotation = availableQuotations.find(
      (item) => item.id === quotationId
    );

    setProjectForm((current) => ({
      ...current,
      quotationId,
      title: quotation
        ? getQuotationTitle(quotation)
        : current.title,
    }));
  }

  async function handleCreateProject(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!projectForm.quotationId) {
      setError(
        "Please select an accepted quotation."
      );
      return;
    }

    if (!projectForm.title.trim()) {
      setError(
        "Engineering project title is required."
      );
      return;
    }

    try {
      setCreatingProject(true);
      setError("");
      setSuccess("");

      const payload: CreateEngineeringProjectPayload =
        {
          quotationId: projectForm.quotationId,
          title: projectForm.title.trim(),
        };

      if (projectForm.productFamily.trim()) {
        payload.productFamily =
          projectForm.productFamily.trim();
      }

      if (projectForm.productModel.trim()) {
        payload.productModel =
          projectForm.productModel.trim();
      }

      if (projectForm.plannedStartDate) {
        payload.plannedStartDate =
          projectForm.plannedStartDate;
      }

      if (projectForm.plannedReleaseDate) {
        payload.plannedReleaseDate =
          projectForm.plannedReleaseDate;
      }

      if (projectForm.notes.trim()) {
        payload.notes = projectForm.notes.trim();
      }

      const createdProject =
        await createEngineeringProject(payload);

      setProjects((current) => [
        createdProject,
        ...current.filter(
          (project) =>
            project.id !== createdProject.id
        ),
      ]);

      setSelectedProjectId(createdProject.id);

      setSuccess(
        `${createdProject.engineeringNumber} created successfully.`
      );

      setShowCreateProject(false);
      setProjectForm(initialProjectForm);

      // Reload so all quotation/project relations
      // reflect the latest backend state.
      await loadData(true);

      setSelectedProjectId(createdProject.id);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create engineering project."
      );
    } finally {
      setCreatingProject(false);
    }
  }


  function refreshSelectedProject(projectId: string) {
    return loadData(true).then(() => setSelectedProjectId(projectId));
  }

  async function handleCreateDrawing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      setSavingDrawing(true); setError(""); setSuccess("");
      const payload: CreateEngineeringDrawingPayload = {
        projectId: selectedProject.id,
        drawingNumber: drawingForm.drawingNumber.trim(),
        title: drawingForm.title.trim(),
        category: drawingForm.category,
        changeReason: drawingForm.changeReason.trim(),
      };
      if (drawingForm.description.trim()) payload.description = drawingForm.description.trim();
      if (drawingForm.documentName.trim()) payload.documentName = drawingForm.documentName.trim();
      if (drawingForm.documentUrl.trim()) payload.documentUrl = drawingForm.documentUrl.trim();
      const created = await createEngineeringDrawing(payload);
      setSuccess(`${created.drawingNumber} created successfully.`);
      setShowDrawingModal(false); setDrawingForm(initialDrawingForm);
      await refreshSelectedProject(selectedProject.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create drawing."); }
    finally { setSavingDrawing(false); }
  }

  async function handleCreateBom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      setSavingBom(true); setError(""); setSuccess("");
      const payload: CreateEngineeringBomPayload = {
        projectId: selectedProject.id,
        bomNumber: bomForm.bomNumber.trim(),
        name: bomForm.name.trim(),
        revision: Number(bomForm.revision || 0),
      };
      if (bomForm.description.trim()) payload.description = bomForm.description.trim();
      const created = await createEngineeringBom(payload);
      setSelectedBomId(created.id);
      setSuccess(`${created.bomNumber} created successfully.`);
      setShowBomModal(false); setBomForm(initialBomForm);
      await refreshSelectedProject(selectedProject.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create BOM."); }
    finally { setSavingBom(false); }
  }

  async function handleCreateBomItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !selectedBomId) return;
    try {
      setSavingBomItem(true); setError(""); setSuccess("");
      const payload: CreateEngineeringBomItemPayload = {
        itemNumber: Number(bomItemForm.itemNumber),
        name: bomItemForm.name.trim(),
        quantity: Number(bomItemForm.quantity),
        unit: bomItemForm.unit.trim(),
        source: bomItemForm.source,
      };
      if (bomItemForm.parentItemId) payload.parentItemId = bomItemForm.parentItemId;
      if (bomItemForm.materialSpec.trim()) payload.materialSpec = bomItemForm.materialSpec.trim();
      if (bomItemForm.drawingNumber.trim()) payload.drawingNumber = bomItemForm.drawingNumber.trim();
      if (bomItemForm.remarks.trim()) payload.remarks = bomItemForm.remarks.trim();
      await createEngineeringBomItem(selectedBomId, payload);
      setSuccess("BOM item added successfully.");
      setShowBomItemModal(false); setBomItemForm(initialBomItemForm);
      await refreshSelectedProject(selectedProject.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to add BOM item."); }
    finally { setSavingBomItem(false); }
  }

  async function handleDeleteBomItem(itemId: string) {
    if (!selectedProject || !window.confirm("Delete this BOM item?")) return;
    try {
      setError(""); await deleteEngineeringBomItem(itemId);
      setSuccess("BOM item deleted.");
      await refreshSelectedProject(selectedProject.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete BOM item."); }
  }

  async function handleBomStatus(bom: EngineeringBom, status: "IN_REVIEW" | "APPROVED" | "RELEASED") {
    if (!selectedProject) return;
    try {
      setError(""); await updateEngineeringBom(bom.id, { status });
      setSuccess(`${bom.bomNumber} moved to ${formatStatus(status)}.`);
      await refreshSelectedProject(selectedProject.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update BOM."); }
  }

  async function handleRevisionStatus(drawing: EngineeringDrawing, status: DrawingRevisionStatus, customerApproved?: boolean) {
    if (!selectedProject) return;
    const revision = drawing.revisions?.find(r => r.revisionNumber === drawing.currentRevision) || drawing.revisions?.[0];
    if (!revision) return;
    try {
      setError(""); await updateDrawingRevision(revision.id, customerApproved === undefined ? { status } : { status, customerApproved });
      setSuccess(`${drawing.drawingNumber} updated.`);
      await refreshSelectedProject(selectedProject.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update revision."); }
  }

  async function handleCreateRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !revisionDrawing) return;
    try {
      setSavingRevision(true); setError("");
      await createDrawingRevision(revisionDrawing.id, {
        changeReason: revisionReason.trim(),
        ...(revisionDocumentName.trim() ? { documentName: revisionDocumentName.trim() } : {}),
        ...(revisionDocumentUrl.trim() ? { documentUrl: revisionDocumentUrl.trim() } : {}),
      });
      setSuccess(`New revision added to ${revisionDrawing.drawingNumber}.`);
      setRevisionDrawing(null); setRevisionReason(""); setRevisionDocumentName(""); setRevisionDocumentUrl("");
      await refreshSelectedProject(selectedProject.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create revision."); }
    finally { setSavingRevision(false); }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="page-content">
        <div
          style={{
            minHeight: "420px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <Loader2
            size={22}
            className="spin"
          />

          <span>
            Loading engineering workspace...
          </span>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="page-content engineering-page">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="page-header engineering-header">
        <div>
          <span className="eyebrow engineering-eyebrow">
            ENGINEERING CONTROL
          </span>

          <h1>Engineering</h1>

          <p>
            Manage engineering projects, drawings,
            revisions and bills of materials.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "spin" : undefined
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openCreateProject}
          >
            <Plus size={18} />
            New Engineering Project
          </button>
        </div>
      </div>

      {/* ====================================================
          MESSAGES
      ==================================================== */}

      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#fff1f2",
            color: "#be123c",
            display: "flex",
            gap: "9px",
            alignItems: "center",
          }}
        >
          <AlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#ecfdf5",
            color: "#047857",
            display: "flex",
            gap: "9px",
            alignItems: "center",
          }}
        >
          <CheckCircle2 size={18} />

          <span>{success}</span>
        </div>
      )}

      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <SummaryCard
          icon={<DraftingCompass size={21} />}
          label="Engineering Projects"
          value={projects.length}
        />

        <SummaryCard
          icon={<ClipboardList size={21} />}
          label="Active Projects"
          value={activeProjectCount}
        />

        <SummaryCard
          icon={<FileText size={21} />}
          label="Drawings"
          value={totalDrawings}
        />

        <SummaryCard
          icon={<PackageOpen size={21} />}
          label="BOMs"
          value={totalBoms}
        />
      </div>

      {/* ====================================================
          MAIN WORKSPACE
      ==================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(300px, 0.8fr) minmax(0, 1.7fr)",
          gap: "18px",
          alignItems: "start",
        }}
      >
        {/* PROJECT LIST */}

        <section className="card">
          <div
            style={{
              padding: "18px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div>
                <strong>Engineering Projects</strong>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  {filteredProjects.length} project
                  {filteredProjects.length === 1
                    ? ""
                    : "s"}
                </div>
              </div>
            </div>

            <div
              className="search-box"
              style={{
                width: "100%",
              }}
            >
              <Search size={17} />

              <input
                value={search}
                placeholder="Search engineering..."
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          <div>
            {filteredProjects.length === 0 ? (
              <div
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <DraftingCompass
                  size={32}
                  style={{
                    marginBottom: "10px",
                  }}
                />

                <div>
                  <strong>
                    No engineering projects
                  </strong>
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    marginTop: "6px",
                  }}
                >
                  Create a project from an accepted
                  quotation.
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const customer =
                  project.quotation?.estimate?.lead
                    ?.customer?.companyName ||
                  "Customer not available";

                const selected =
                  selectedProjectId === project.id;

                return (
                  <button
                    type="button"
                    key={project.id}
                    onClick={() =>
                      setSelectedProjectId(
                        project.id
                      )
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      borderBottom:
                        "1px solid #e5e7eb",
                      padding: "16px 18px",
                      background: selected
                        ? "#f0f7ff"
                        : "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "10px",
                      }}
                    >
                      <strong>
                        {project.engineeringNumber}
                      </strong>

                      <StatusBadge
                        status={project.status}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: "7px",
                        fontWeight: 600,
                      }}
                    >
                      {project.title}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      {customer}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* PROJECT DETAILS */}

        <section className="card">
          {!selectedProject ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <DraftingCompass
                size={42}
                style={{
                  marginBottom: "12px",
                }}
              />

              <h3>
                Select an engineering project
              </h3>

              <p>
                Project details, drawings and BOMs
                will appear here.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "20px",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                        marginBottom: "5px",
                      }}
                    >
                      {
                        selectedProject.engineeringNumber
                      }
                    </div>

                    <h2
                      style={{
                        margin: 0,
                      }}
                    >
                      {selectedProject.title}
                    </h2>
                  </div>

                  <StatusBadge
                    status={selectedProject.status}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <Detail
                    label="Customer"
                    value={
                      selectedProject.quotation
                        ?.estimate?.lead?.customer
                        ?.companyName || "—"
                    }
                  />

                  <Detail
                    label="Quotation"
                    value={
                      selectedProject.quotation
                        ?.quotationNumber || "—"
                    }
                  />

                  <Detail
                    label="Product Family"
                    value={
                      selectedProject.productFamily ||
                      "—"
                    }
                  />

                  <Detail
                    label="Product Model"
                    value={
                      selectedProject.productModel ||
                      "—"
                    }
                  />

                  <Detail
                    label="Planned Start"
                    value={formatDate(
                      selectedProject.plannedStartDate
                    )}
                  />

                  <Detail
                    label="Planned Release"
                    value={formatDate(
                      selectedProject.plannedReleaseDate
                    )}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                    marginTop: "24px",
                  }}
                >
                  <MiniModule
                    icon={<FileText size={20} />}
                    title="Drawings"
                    value={selectedProject.drawings?.length || 0}
                    description="Engineering drawings and revisions"
                  />
                  <MiniModule
                    icon={<PackageOpen size={20} />}
                    title="BOM"
                    value={selectedProject.boms?.length || 0}
                    description="Bills of materials"
                  />
                </div>

                <div style={{marginTop:"24px",border:"1px solid #e5e7eb",borderRadius:"12px",overflow:"hidden"}}>
                  <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #e5e7eb"}}>
                    <div><strong>Engineering Drawings</strong><div style={{fontSize:"12px",color:"#64748b",marginTop:"3px"}}>GA, P&ID, fabrication and revision control</div></div>
                    <button className="primary-button" type="button" onClick={()=>setShowDrawingModal(true)}><Plus size={16}/> Add Drawing</button>
                  </div>
                  {(selectedProject.drawings?.length || 0)===0 ? <div style={{padding:"22px",color:"#64748b"}}>No drawings yet.</div> :
                    selectedProject.drawings.map(d=><div key={d.id} style={{padding:"14px 16px",borderBottom:"1px solid #eef2f7"}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:"12px",alignItems:"center"}}>
                        <div><strong>{d.drawingNumber} — {d.title}</strong><div style={{fontSize:"12px",color:"#64748b",marginTop:"4px"}}>{formatStatus(d.category)} · Revision {d.currentRevision} · {formatStatus(d.status)}</div></div>
                        <div style={{display:"flex",gap:"7px",flexWrap:"wrap",justifyContent:"flex-end"}}>
                          <button className="secondary-button" type="button" onClick={()=>{setRevisionDrawing(d);setRevisionReason("");}}>+ Revision</button>
                          {d.status==="DRAFT" && <button className="secondary-button" type="button" onClick={()=>void handleRevisionStatus(d,"INTERNAL_REVIEW")}>Internal Review</button>}
                          {d.status==="INTERNAL_REVIEW" && <button className="secondary-button" type="button" onClick={()=>void handleRevisionStatus(d,"CUSTOMER_REVIEW")}>Customer Review</button>}
                          {d.status==="CUSTOMER_REVIEW" && <button className="primary-button" type="button" onClick={()=>void handleRevisionStatus(d,"APPROVED",true)}>Approve</button>}
                        </div>
                      </div>
                      {(d.revisions?.length||0)>0 && (
                        <div className="drawing-revision-history">
                          {[...d.revisions]
                            .sort((a,b)=>b.revisionNumber-a.revisionNumber)
                            .map(r=>(
                              <div className="drawing-revision-row" key={r.id}>
                                <strong>Rev {r.revisionNumber}</strong>
                                <span>{formatStatus(r.status)}</span>
                                <span>{r.changeReason}</span>
                                <span>{r.customerApproved ? "Customer approved" : "Customer approval pending"}</span>
                                {r.documentUrl ? <a href={r.documentUrl} target="_blank" rel="noreferrer">{r.documentName || "Open document"}</a> : <span>{r.documentName || "No document"}</span>}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>)}
                </div>

                <div style={{marginTop:"18px",border:"1px solid #e5e7eb",borderRadius:"12px",overflow:"hidden"}}>
                  <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #e5e7eb"}}>
                    <div><strong>Bill of Materials</strong><div style={{fontSize:"12px",color:"#64748b",marginTop:"3px"}}>Multi-level material structure and release workflow</div></div>
                    <button className="primary-button" type="button" onClick={()=>setShowBomModal(true)}><Plus size={16}/> Create BOM</button>
                  </div>
                  {(selectedProject.boms?.length || 0)===0 ? <div style={{padding:"22px",color:"#64748b"}}>No BOMs yet.</div> :
                    selectedProject.boms.map(b=><div key={b.id} style={{padding:"14px 16px",borderBottom:"1px solid #eef2f7"}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:"12px",alignItems:"center"}}>
                        <button type="button" onClick={()=>setSelectedBomId(b.id)} style={{border:0,background:"transparent",padding:0,textAlign:"left",cursor:"pointer"}}>
                          <strong>{b.bomNumber} — {b.name}</strong><div style={{fontSize:"12px",color:"#64748b",marginTop:"4px"}}>Rev {b.revision} · {formatStatus(b.status)} · {b.items?.length || 0} items</div>
                        </button>
                        <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                          <button className="secondary-button" type="button" onClick={()=>{setSelectedBomId(b.id);setBomItemForm({...initialBomItemForm,itemNumber:String((b.items?.length||0)+1)});setShowBomItemModal(true)}}>+ Item</button>
                          {b.status==="DRAFT" && <button className="secondary-button" type="button" onClick={()=>void handleBomStatus(b,"IN_REVIEW")}>Review</button>}
                          {b.status==="IN_REVIEW" && <button className="secondary-button" type="button" onClick={()=>void handleBomStatus(b,"APPROVED")}>Approve</button>}
                          {b.status==="APPROVED" && <button className="primary-button" type="button" onClick={()=>void handleBomStatus(b,"RELEASED")}>Release</button>}
                        </div>
                      </div>
                      {(b.items?.length||0)>0 && (
                        <div className="bom-tree-wrap">
                          <div className="bom-tree-head">
                            <span>Item</span><span>Assembly / Component</span><span>Qty</span><span>Source</span><span>Material / Drawing</span><span></span>
                          </div>
                          <BomTree
                            items={b.items}
                            onDelete={(itemId)=>void handleDeleteBomItem(itemId)}
                            onAddChild={(parent)=>{
                              setSelectedBomId(b.id);
                              setBomItemForm({
                                ...initialBomItemForm,
                                parentItemId: parent.id,
                                itemNumber: String((b.items?.length||0)+1),
                              });
                              setShowBomItemModal(true);
                            }}
                          />
                        </div>
                      )}
                    </div>)}
                </div>

                {selectedProject.notes && (
                  <div
                    style={{
                      marginTop: "22px",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Notes
                    </div>

                    <div>
                      {selectedProject.notes}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>


      {showDrawingModal && selectedProject && (
        <SimpleModal title="Add Engineering Drawing" subtitle={selectedProject.engineeringNumber} onClose={()=>!savingDrawing&&setShowDrawingModal(false)}>
          <form onSubmit={handleCreateDrawing} className="engineering-simple-form">
            <div className="engineering-form-grid">
              <label><span>Drawing Number *</span><input required value={drawingForm.drawingNumber} onChange={e=>setDrawingForm(c=>({...c,drawingNumber:e.target.value}))} placeholder="GA-001"/></label>
              <label><span>Category *</span><select value={drawingForm.category} onChange={e=>setDrawingForm(c=>({...c,category:e.target.value as DrawingCategory}))}><option value="GENERAL_ARRANGEMENT">General Arrangement</option><option value="PID">P&ID</option><option value="FABRICATION">Fabrication</option><option value="TUBE_LAYOUT">Tube Layout</option><option value="ELECTRICAL">Electrical</option><option value="INSTRUMENTATION">Instrumentation</option><option value="FOUNDATION">Foundation</option><option value="OTHER">Other</option></select></label>
            </div>
            <label><span>Title *</span><input required value={drawingForm.title} onChange={e=>setDrawingForm(c=>({...c,title:e.target.value}))} placeholder="Boiler General Arrangement"/></label>
            <label><span>Description</span><textarea rows={3} value={drawingForm.description} onChange={e=>setDrawingForm(c=>({...c,description:e.target.value}))}/></label>
            <div className="engineering-form-grid"><label><span>Document Name</span><input value={drawingForm.documentName} onChange={e=>setDrawingForm(c=>({...c,documentName:e.target.value}))} placeholder="GA-001.pdf"/></label><label><span>Document URL</span><input value={drawingForm.documentUrl} onChange={e=>setDrawingForm(c=>({...c,documentUrl:e.target.value}))} placeholder="https://..."/></label></div>
            <label><span>Change Reason *</span><input required value={drawingForm.changeReason} onChange={e=>setDrawingForm(c=>({...c,changeReason:e.target.value}))}/></label>
            <ModalActions busy={savingDrawing} busyText="Creating..." submitText="Create Drawing" onCancel={()=>setShowDrawingModal(false)}/>
          </form>
        </SimpleModal>
      )}

      {showBomModal && selectedProject && (
        <SimpleModal title="Create Bill of Materials" subtitle={selectedProject.engineeringNumber} onClose={()=>!savingBom&&setShowBomModal(false)}>
          <form onSubmit={handleCreateBom} className="engineering-simple-form">
            <div className="engineering-form-grid"><label><span>BOM Number *</span><input required value={bomForm.bomNumber} onChange={e=>setBomForm(c=>({...c,bomNumber:e.target.value}))} placeholder="BOM-IB-500-001"/></label><label><span>Revision</span><input type="number" min="0" value={bomForm.revision} onChange={e=>setBomForm(c=>({...c,revision:e.target.value}))}/></label></div>
            <label><span>BOM Name *</span><input required value={bomForm.name} onChange={e=>setBomForm(c=>({...c,name:e.target.value}))} placeholder="Industrial Boiler Main BOM"/></label>
            <label><span>Description</span><textarea rows={4} value={bomForm.description} onChange={e=>setBomForm(c=>({...c,description:e.target.value}))}/></label>
            <ModalActions busy={savingBom} busyText="Creating..." submitText="Create BOM" onCancel={()=>setShowBomModal(false)}/>
          </form>
        </SimpleModal>
      )}

      {showBomItemModal && selectedProject && selectedBomId && (
        <SimpleModal title="Add BOM Item" subtitle="Add material, assembly or purchased component" onClose={()=>!savingBomItem&&setShowBomItemModal(false)}>
          <form onSubmit={handleCreateBomItem} className="engineering-simple-form">
            <div className="engineering-form-grid"><label><span>Item No. *</span><input required type="number" min="1" value={bomItemForm.itemNumber} onChange={e=>setBomItemForm(c=>({...c,itemNumber:e.target.value}))}/></label><label><span>Source</span><select value={bomItemForm.source} onChange={e=>setBomItemForm(c=>({...c,source:e.target.value as "MAKE"|"BUY"}))}><option value="BUY">Buy</option><option value="MAKE">Make</option></select></label></div>
            <label><span>Item Name *</span><input required value={bomItemForm.name} onChange={e=>setBomItemForm(c=>({...c,name:e.target.value}))} placeholder="Boiler shell plate"/></label>
            <div className="engineering-form-grid"><label><span>Quantity *</span><input required type="number" min="0.0001" step="any" value={bomItemForm.quantity} onChange={e=>setBomItemForm(c=>({...c,quantity:e.target.value}))}/></label><label><span>Unit *</span><input required value={bomItemForm.unit} onChange={e=>setBomItemForm(c=>({...c,unit:e.target.value}))}/></label></div>
            <label><span>Parent Item</span><select value={bomItemForm.parentItemId} onChange={e=>setBomItemForm(c=>({...c,parentItemId:e.target.value}))}><option value="">Top level</option>{selectedProject.boms.find(b=>b.id===selectedBomId)?.items.map(i=><option key={i.id} value={i.id}>#{i.itemNumber} {i.name}</option>)}</select></label>
            <div className="engineering-form-grid"><label><span>Material Spec</span><input value={bomItemForm.materialSpec} onChange={e=>setBomItemForm(c=>({...c,materialSpec:e.target.value}))} placeholder="IS 2062 E250"/></label><label><span>Drawing Number</span><input value={bomItemForm.drawingNumber} onChange={e=>setBomItemForm(c=>({...c,drawingNumber:e.target.value}))}/></label></div>
            <label><span>Remarks</span><textarea rows={3} value={bomItemForm.remarks} onChange={e=>setBomItemForm(c=>({...c,remarks:e.target.value}))}/></label>
            <ModalActions busy={savingBomItem} busyText="Adding..." submitText="Add Item" onCancel={()=>setShowBomItemModal(false)}/>
          </form>
        </SimpleModal>
      )}

      {revisionDrawing && (
        <SimpleModal title={`New Revision — ${revisionDrawing.drawingNumber}`} subtitle={`Current revision: ${revisionDrawing.currentRevision}`} onClose={()=>!savingRevision&&setRevisionDrawing(null)}>
          <form onSubmit={handleCreateRevision} className="engineering-simple-form">
            <label><span>Change Reason *</span><textarea required rows={4} value={revisionReason} onChange={e=>setRevisionReason(e.target.value)} placeholder="Describe what changed in this revision"/></label>
            <div className="engineering-form-grid"><label><span>Document Name</span><input value={revisionDocumentName} onChange={e=>setRevisionDocumentName(e.target.value)}/></label><label><span>Document URL</span><input value={revisionDocumentUrl} onChange={e=>setRevisionDocumentUrl(e.target.value)}/></label></div>
            <ModalActions busy={savingRevision} busyText="Creating..." submitText="Create Revision" onCancel={()=>setRevisionDrawing(null)}/>
          </form>
        </SimpleModal>
      )}

      {/* ====================================================
          CREATE PROJECT MODAL
      ==================================================== */}

      {showCreateProject && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "white",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  New Engineering Project
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Create engineering work from an
                  accepted quotation.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeCreateProject}
                disabled={creatingProject}
              >
                <X size={20} />
              </button>
            </div>

            {availableQuotations.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                }}
              >
                <AlertCircle
                  size={36}
                  style={{
                    marginBottom: "10px",
                  }}
                />

                <h3>
                  No quotations available
                </h3>

                <p
                  style={{
                    color: "#64748b",
                  }}
                >
                  You need an ACCEPTED or CONVERTED
                  quotation that does not already
                  have an engineering project.
                </p>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCreateProject}
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleCreateProject}
                style={{
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gap: "16px",
                  }}
                >
                  <label>
                    <span>
                      Accepted Quotation *
                    </span>

                    <select
                      value={
                        projectForm.quotationId
                      }
                      onChange={(event) =>
                        handleQuotationChange(
                          event.target.value
                        )
                      }
                      required
                    >
                      {availableQuotations.map(
                        (quotation) => (
                          <option
                            key={quotation.id}
                            value={quotation.id}
                          >
                            {
                              quotation.quotationNumber
                            }{" "}
                            —{" "}
                            {getCustomerName(
                              quotation
                            )}{" "}
                            —{" "}
                            {formatMoney(
                              quotation.totalAmount
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    <span>
                      Project Title *
                    </span>

                    <input
                      value={projectForm.title}
                      onChange={(event) =>
                        setProjectForm(
                          (current) => ({
                            ...current,
                            title:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Example: Industrial Boiler Package"
                      required
                    />
                  </label>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "14px",
                    }}
                  >
                    <label>
                      <span>
                        Product Family
                      </span>

                      <input
                        value={
                          projectForm.productFamily
                        }
                        onChange={(event) =>
                          setProjectForm(
                            (current) => ({
                              ...current,
                              productFamily:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Example: Boiler"
                      />
                    </label>

                    <label>
                      <span>
                        Product Model
                      </span>

                      <input
                        value={
                          projectForm.productModel
                        }
                        onChange={(event) =>
                          setProjectForm(
                            (current) => ({
                              ...current,
                              productModel:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Example: IB-500"
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "14px",
                    }}
                  >
                    <label>
                      <span>
                        Planned Start Date
                      </span>

                      <input
                        type="date"
                        value={
                          projectForm.plannedStartDate
                        }
                        onChange={(event) =>
                          setProjectForm(
                            (current) => ({
                              ...current,
                              plannedStartDate:
                                event.target.value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        Planned Release Date
                      </span>

                      <input
                        type="date"
                        value={
                          projectForm.plannedReleaseDate
                        }
                        onChange={(event) =>
                          setProjectForm(
                            (current) => ({
                              ...current,
                              plannedReleaseDate:
                                event.target.value,
                            })
                          )
                        }
                      />
                    </label>
                  </div>

                  <label>
                    <span>Notes</span>

                    <textarea
                      value={projectForm.notes}
                      onChange={(event) =>
                        setProjectForm(
                          (current) => ({
                            ...current,
                            notes:
                              event.target.value,
                          })
                        )
                      }
                      rows={4}
                      placeholder="Engineering requirements, customer specifications, special instructions..."
                    />
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "22px",
                  }}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeCreateProject}
                    disabled={creatingProject}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={creatingProject}
                  >
                    {creatingProject ? (
                      <>
                        <Loader2
                          size={17}
                          className="spin"
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={17} />
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "#64748b",
              fontSize: "13px",
              marginBottom: "7px",
            }}
          >
            {label}
          </div>

          <strong
            style={{
              fontSize: "26px",
            }}
          >
            {value}
          </strong>
        </div>

        <div>{icon}</div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 9px",
        borderRadius: "999px",
        background: "#eef2ff",
        color: "#4338ca",
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {formatStatus(status)}
    </span>
  );
}

function MiniModule({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {icon}

        <strong
          style={{
            fontSize: "22px",
          }}
        >
          {value}
        </strong>
      </div>

      <div
        style={{
          marginTop: "12px",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "4px",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        {description}
      </div>
    </div>
  );
}


function BomTree({
  items,
  onDelete,
  onAddChild,
}: {
  items: EngineeringBom["items"];
  onDelete: (itemId: string) => void;
  onAddChild: (item: EngineeringBom["items"][number]) => void;
}) {
  const childrenByParent = new Map<string | null, EngineeringBom["items"]>();

  for (const item of items) {
    const parent = item.parentItemId || null;
    const list = childrenByParent.get(parent) || [];
    list.push(item);
    childrenByParent.set(parent, list);
  }

  for (const list of childrenByParent.values()) {
    list.sort((a, b) => (a.sortOrder - b.sortOrder) || (a.itemNumber - b.itemNumber));
  }

  const renderLevel = (parentId: string | null, depth: number): React.ReactNode =>
    (childrenByParent.get(parentId) || []).map((item) => {
      const children = childrenByParent.get(item.id) || [];
      return (
        <div key={item.id}>
          <div className="bom-tree-row">
            <span>#{item.itemNumber}</span>
            <span className="bom-tree-name" style={{ paddingLeft: `${depth * 22}px` }}>
              {depth > 0 && <span className="bom-branch">↳</span>}
              <span>
                <strong>{item.name}</strong>
                <small>{children.length > 0 ? `${children.length} child item${children.length === 1 ? "" : "s"}` : "Component"}</small>
              </span>
            </span>
            <span>{item.quantity} {item.unit}</span>
            <span><span className={`bom-source ${item.source.toLowerCase()}`}>{item.source}</span></span>
            <span className="bom-material">
              <strong>{item.materialSpec || "—"}</strong>
              <small>{item.drawingNumber ? `Drawing ${item.drawingNumber}` : item.inventoryItem?.itemCode || "No linked drawing"}</small>
            </span>
            <span className="bom-row-actions">
              <button type="button" className="icon-button" onClick={()=>onAddChild(item)} title="Add child item"><Plus size={15}/></button>
              <button type="button" className="icon-button" onClick={()=>onDelete(item.id)} title="Delete item"><X size={15}/></button>
            </span>
          </div>
          {renderLevel(item.id, depth + 1)}
        </div>
      );
    });

  return <div className="bom-tree-body">{renderLevel(null, 0)}</div>;
}

function SimpleModal({title,subtitle,onClose,children}:{title:string;subtitle:string;onClose:()=>void;children:React.ReactNode}) {
  return <div className="engineering-modal-backdrop"><div className="card engineering-modal-card"><div className="engineering-modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button type="button" className="icon-button" onClick={onClose}><X size={20}/></button></div>{children}</div></div>;
}

function ModalActions({busy,busyText,submitText,onCancel}:{busy:boolean;busyText:string;submitText:string;onCancel:()=>void}) {
  return <div className="engineering-modal-actions"><button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy?<><Loader2 size={16} className="spin"/>{busyText}</>:<><Plus size={16}/>{submitText}</>}</button></div>;
}
