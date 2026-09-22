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
  createEngineeringProject,
  getEngineeringProjects,
} from "../services/engineering.service";

import { getQuotations } from "../services/quotation.service";

import type {
  CreateEngineeringProjectPayload,
  EngineeringProject,
} from "../types/engineering";

import type { Quotation } from "../types/quotation";

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
    <div className="page-content">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="page-header">
        <div>
          <span className="eyebrow">
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
                    icon={
                      <FileText size={20} />
                    }
                    title="Drawings"
                    value={
                      selectedProject.drawings
                        ?.length || 0
                    }
                    description="Engineering drawings and revisions"
                  />

                  <MiniModule
                    icon={
                      <PackageOpen size={20} />
                    }
                    title="BOM"
                    value={
                      selectedProject.boms?.length ||
                      0
                    }
                    description="Bills of materials"
                  />
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