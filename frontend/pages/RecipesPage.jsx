import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/po_recipes_style.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LINE = import.meta.env.VITE_LINE;
const STATE_KEY = "recipesListState";

export default function RecipesPage() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalVersions: 0,
  });
  // Group modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalCode, setGroupModalCode] = useState("");
  const [groupModalItems, setGroupModalItems] = useState([]);
  const getStoredState = () => {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const storedState = getStoredState();
  const [recipes, setRecipes] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState(storedState?.filterSearch ?? "");
  const [selectedStatuses, setSelectedStatuses] = useState(
    Array.isArray(storedState?.selectedStatuses)
      ? storedState.selectedStatuses
      : [],
  );

  const [currentPage, setCurrentPage] = useState(
    Math.max(1, parseInt(storedState?.currentPage) || 1),
  );
  const [totalPages, setTotalPages] = useState(1);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const pageSize = 20;

  // Refs
  const statusDropdownRef = useRef(null);

  // --- Helpers ---
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return dateString;
    const [year, month, day] = datePart.split("-");
    const [hours, minutes, seconds] = timePart.replace("Z", "").split(":");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    try {
      const state = {
        filterSearch: search,
        selectedStatuses,
        currentPage,
      };
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Error saving state", e);
    }
  }, [search, selectedStatuses, currentPage]);

  // --- API Calls ---
  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatuses.length > 0)
        params.append("statuses", selectedStatuses.join(","));
      if (search) params.append("search", search);

      let endpoint = `${API_BASE_URL}/api/production-recipes/stats`;
      if (selectedStatuses.length > 0 || search) {
        endpoint = `${API_BASE_URL}/api/production-recipes/stats/search?${params.toString()}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success && data.stats) {
        setStats({
          total: data.stats.total || 0,
          active: data.stats.active || 0,
          totalVersions: data.stats.totalVersions || 0,
        });
      }
    } catch (err) {
      console.error("Lỗi khi lấy thống kê recipes:", err);
    }
  }, [search, selectedStatuses]);

  const fetchRecipes = useCallback(async () => {
    try {
      let url = `${API_BASE_URL}/api/production-recipes/search?page=${currentPage}&limit=${pageSize}`;
      if (selectedStatuses.length > 0)
        url += `&statuses=${encodeURIComponent(selectedStatuses.join(","))}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.data || []);
        const total = data.total || 0;
        setTotalPages(Math.ceil(total / pageSize) || 1);
      } else {
        setRecipes([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Lỗi khi lấy RecipeDetails:", err);
      setRecipes([]);
      setTotalPages(1);
    }
  }, [currentPage, search, selectedStatuses]);

  // --- Effects ---
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await fetchStats();
      await fetchRecipes();
    };
    run();
  }, [fetchStats, fetchRecipes]);

  // Outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Handlers ---
  const handleRefresh = () => {
    setSearch("");
    setSelectedStatuses([]);
    setCurrentPage(1);
    try {
      sessionStorage.removeItem(STATE_KEY);
    } catch (error) {
      console.error("Error clearing state from sessionStorage", error);
    }
  };

  const handleStatusSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStatuses(["active", "inactive"]);
    } else {
      setSelectedStatuses([]);
    }
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(value)) {
        return prev.filter((s) => s !== value);
      } else {
        return [...prev, value];
      }
    });
    setCurrentPage(1);
  };

  const getStatusText = () => {
    if (selectedStatuses.length === 0) return "Select statuses...";
    if (
      selectedStatuses.length === 2 &&
      selectedStatuses.includes("active") &&
      selectedStatuses.includes("inactive")
    )
      return "All statuses selected";
    const labelMap = {
      active: "Hoạt động",
      inactive: "Ngừng hoạt động",
    };
    if (selectedStatuses.length <= 2) {
      return selectedStatuses.map((s) => labelMap[s] || s).join(", ");
    }
    return `${selectedStatuses.length} selected`;
  };

  // --- Render ---
  return (
    <>
      {/* Top Navigation Bar */}
      <div className="topBar">
        <a href="/" className="nav-left">
          <i className="fa-solid fa-home"></i>
          <span>DashBoard</span>
        </a>
        <div className="nav-breadcrumb">
          <a
            href="/recipes"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Công Thức
          </a>
        </div>
      </div>

      {/* Main Container */}
      <div
        className="main-container"
        style={{
          minHeight: "calc(100vh - 70px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header Section */}
        <div className="header-section">
          <div className="header-top">
            <a className="back-btn" href="/">
              <i className="fa-solid fa-arrow-left"></i>
            </a>
            <div className="header-title">
              <div className="header-top-left">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="#6259ee"
                >
                  <path d="M15 2a1 1 0 0 1 0 2v4.826l3.932 10.814l.034 .077a1.7 1.7 0 0 1 -.002 1.193l-.07 .162a1.7 1.7 0 0 1 -1.213 .911l-.181 .017h-11l-.181 -.017a1.7 1.7 0 0 1 -1.285 -2.266l.039 -.09l3.927 -10.804v-4.823a1 1 0 1 1 0 -2h6zm-2 2h-2v4h2v-4z" />
                </svg>
                <div className="header-text">
                  <h1>Công thức</h1>
                  <p>Quản lý dữ liệu chính công thức</p>
                </div>
              </div>
              <div className="badge-cs1">{LINE}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span>Tổng số Công thức</span>
                <div className="stat-icon" id="total-icon">
                  <i
                    className="fa-solid fa-flask"
                    style={{ color: "#4e4ad4" }}
                  ></i>
                </div>
              </div>
              <div className="stat-number">{stats.total}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Công thức đang Hoạt động</span>
                <div className="stat-icon" id="active-icon">
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ color: "#47b54d" }}
                  ></i>
                </div>
              </div>
              <div className="stat-number">{stats.active}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Tổng Phiên bản</span>
                <div className="stat-icon" id="version-icon">
                  <i
                    className="fa-solid fa-clock"
                    style={{ color: "#1c96ff" }}
                  ></i>
                </div>
              </div>
              <div className="stat-number">{stats.totalVersions}</div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-section">
          <div className="search-bar">
            <i className="fa-solid fa-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm Mã công thức, Tên sản phẩm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#6259ee">
                <rect x="3" y="4" width="18" height="3" rx="1.5" />
                <rect x="3" y="10.5" width="18" height="3" rx="1.5" />
                <rect x="3" y="17" width="18" height="3" rx="1.5" />
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#6259ee">
                <rect x="3" y="4" width="7" height="7" rx="2" />
                <rect x="14" y="4" width="7" height="7" rx="2" />
                <rect x="14" y="13" width="7" height="7" rx="2" />
                <rect x="3" y="13" width="7" height="7" rx="2" />
              </svg>
            </button>

            <div
              className="custom-multiselect"
              style={{ position: "relative", minWidth: "220px" }}
              ref={statusDropdownRef}
            >
              <div
                className="multiselect-input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "#fff",
                  minWidth: "220px",
                }}
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              >
                <span
                  style={{ color: selectedStatuses.length ? "#333" : "#999" }}
                >
                  {getStatusText()}
                </span>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ color: "#666" }}
                ></i>
              </div>

              {isStatusDropdownOpen && (
                <div
                  className="multiselect-dropdown"
                  style={{
                    display: "block",
                    position: "absolute",
                    top: "105%",
                    left: 0,
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    padding: "8px",
                    width: "220px",
                    zIndex: 50,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedStatuses.includes("active") &&
                        selectedStatuses.includes("inactive")
                      }
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedStatuses.length > 0 &&
                            selectedStatuses.length < 2;
                        }
                      }}
                      onChange={handleStatusSelectAll}
                    />
                    <span style={{ fontWeight: 600 }}>[Select all]</span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes("active")}
                      onChange={() => handleStatusChange("active")}
                    />
                    <span>Hoạt động</span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes("inactive")}
                      onChange={() => handleStatusChange("inactive")}
                    />
                    <span>Ngừng hoạt động</span>
                  </label>
                </div>
              )}
            </div>

            <button className="refresh-btn" onClick={handleRefresh}>
              <i className="fa-solid fa-rotate-right"></i>
              Làm mới
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Grid View */}
          {viewMode === "grid" ? (
            <div className="grid-view">
              {recipes.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#888",
                    width: "100%",
                    gridColumn: "1 / -1",
                  }}
                >
                  Không có công thức nào
                </div>
              ) : (
                recipes.map((recipe, idx) => (
                  <div key={idx} className="recipe-card">
                    <div className="recipe-card-header">
                      <div className="recipe-title-section">
                        <h3 className="recipe-code">
                          {recipe.RecipeCode || ""}
                        </h3>
                        <h4 className="recipe-name">
                          {recipe.RecipeName || ""}
                        </h4>
                        <span className="version-badge">
                          <i className="fa-solid fa-code-branch"></i>
                          Phiên bản: {recipe.Version || ""}
                        </span>
                      </div>
                      <p
                        className={`status-badge status-${
                          recipe.RecipeStatus === "Active"
                            ? "success"
                            : "inactive"
                        }`}
                      >
                        {recipe.RecipeStatus === "Active" ? (
                          <i className="fa-solid fa-check-circle"></i>
                        ) : (
                          <i className="fa-solid fa-xmark-circle"></i>
                        )}
                        {recipe.RecipeStatus === "Active"
                          ? " Active"
                          : " Inactive"}
                      </p>
                    </div>
                    <div className="recipe-product">
                      <div className="product-label">SẢN PHẨM</div>
                      <div className="product-info">
                        <i className="fa-solid fa-box"></i>
                        <div className="product-details">
                          <div className="product-code">
                            {recipe.ProductCode || ""}
                          </div>
                          <div className="product-name">
                            {recipe.ProductName || ""}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="recipe-footer">
                      <div className="recipe-meta">
                        <div className="meta-item">
                          <div className="meta-label">
                            <i className="fa-solid fa-layer-group"></i>
                            Phiên bản mới nhất:
                          </div>
                          <strong>
                            {recipe.LatestVersion || recipe.Version || "N/A"}
                          </strong>
                        </div>
                        <div className="meta-item">
                          <div className="meta-label">
                            <i className="fa-regular fa-clock"></i>
                            Cập nhật:
                          </div>
                          <strong>
                            {recipe.timestamp
                              ? formatDateTime(recipe.timestamp)
                              : ""}
                          </strong>
                        </div>
                      </div>
                      <div className="recipe-actions">
                        <Link
                          to={`/recipe-detail/${recipe.RecipeDetailsId}`}
                          className="detail-btn"
                          style={{
                            textDecoration: "none",
                            display: "inline-block",
                            textAlign: "center",
                          }}
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {/* Table View */}
          {viewMode === "table" ? (
            <div className="table-section">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mã Sản Phẩm</th>
                    <th>Tên Sản Phẩm</th>
                    <th>Mã Công Thức</th>
                    <th>Tên Công Thức</th>
                    <th>Phiên Bản</th>
                    <th style={{ textAlign: "center" }}>Trạng Thái</th>
                    <th>Cập Nhật</th>
                    <th style={{ textAlign: "center" }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (recipes.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan="9"
                            style={{
                              textAlign: "center",
                              color: "#888",
                              padding: "20px",
                            }}
                          >
                            Không có công thức nào
                          </td>
                        </tr>
                      );
                    }

                    // Group by RecipeCode
                    const groups = new Map();
                    for (const r of recipes) {
                      const key = r.RecipeCode || "";
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key).push(r);
                    }

                    // Sort each group by Version desc (numeric) then timestamp desc
                    const parseVer = (v) => {
                      const n = parseInt(v, 10);
                      return isNaN(n) ? -Infinity : n;
                    };

                    const rows = [];
                    [...groups.entries()].forEach(([code, items], gi) => {
                      const sorted = [...items].sort((a, b) => {
                        const va = parseVer(a.Version);
                        const vb = parseVer(b.Version);
                        if (vb !== va) return vb - va;
                        const ta = a.timestamp
                          ? new Date(a.timestamp).getTime()
                          : 0;
                        const tb = b.timestamp
                          ? new Date(b.timestamp).getTime()
                          : 0;
                        return tb - ta;
                      });

                      if (sorted.length <= 1) {
                        // Render single item as normal row
                        const r = sorted[0];
                        rows.push(
                          <tr key={`single-${gi}`}>
                            <td>{r?.RecipeDetailsId || ""}</td>
                            <td>{r?.ProductCode || ""}</td>
                            <td>{r?.ProductName || ""}</td>
                            <td style={{ maxWidth: "300px" }}>
                              {r?.RecipeCode || ""}
                            </td>
                            <td style={{ maxWidth: "300px" }}>
                              {r?.RecipeName || ""}
                            </td>
                            <td>{r?.Version || ""}</td>
                            <td style={{ textAlign: "center" }}>
                              <span
                                className={`status-badge status-${
                                  r?.RecipeStatus === "Active"
                                    ? "success"
                                    : "inactive"
                                }`}
                              >
                                {r?.RecipeStatus === "Active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td>
                              {r?.timestamp ? formatDateTime(r.timestamp) : ""}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <Link
                                to={`/recipe-detail/${r?.RecipeDetailsId}`}
                                className="detail-btn"
                                title="Xem chi tiết"
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  color: "#6259ee",
                                  fontSize: "18px",
                                  display: "inline-block",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
                                </svg>
                              </Link>
                            </td>
                          </tr>,
                        );
                      } else {
                        // Render grouped summary row
                        const latest = sorted[0];
                        const openGroup = () => {
                          setGroupModalCode(code);
                          setGroupModalItems(sorted);
                          setIsGroupModalOpen(true);
                        };

                        rows.push(
                          <tr key={`group-${gi}`}>
                            <td>{`${sorted.length} items`}</td>
                            <td>{latest?.ProductCode || ""}</td>
                            <td>{latest?.ProductName || ""}</td>
                            <td style={{ maxWidth: "300px" }}>
                              {(latest?.RecipeCode || "") +
                                " - " +
                                (latest?.RecipeName || "")}
                            </td>
                            <td>{`${sorted.length} versions`}</td>
                            <td style={{ textAlign: "center" }}>
                              <span
                                className={`status-badge status-${
                                  latest?.RecipeStatus === "Active"
                                    ? "success"
                                    : "inactive"
                                }`}
                              >
                                {latest?.RecipeStatus === "Active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td>
                              {latest?.timestamp
                                ? formatDateTime(latest.timestamp)
                                : ""}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="detail-btn"
                                title="Xem các phiên bản"
                                onClick={openGroup}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  color: "#6259ee",
                                  fontSize: "18px",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
                                </svg>
                              </button>
                            </td>
                          </tr>,
                        );
                      }
                    });

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        {/* Pagination Controls */}
        <div className="pagination-section">
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="page-info">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Group Versions Modal */}
      {isGroupModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsGroupModalOpen(false);
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "#fff",
              borderRadius: "10px",
              maxWidth: "1100px",
              width: "95%",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid #eee",
                background: "#f9fafb",
              }}
            >
              <h3 style={{ margin: 0 }}>
                Danh sách phiên bản theo RecipeCode:{" "}
                <span style={{ color: "#6259ee" }}>{groupModalCode}</span>
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  color: "#555",
                }}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ color: "#666" }}>
                Tổng: <strong>{groupModalItems.length}</strong> phiên bản
              </span>
            </div>

            <div style={{ padding: "0 18px 18px", overflow: "auto" }}>
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mã Sản Phẩm</th>
                    <th>Tên Sản Phẩm</th>
                    <th>Mã Công Thức</th>
                    <th>Phiên Bản</th>
                    <th style={{ textAlign: "center" }}>Trạng Thái</th>
                    <th>Cập Nhật</th>
                    <th style={{ textAlign: "center" }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {groupModalItems.map((r, i) => (
                    <tr key={i}>
                      <td>{r?.RecipeDetailsId || ""}</td>
                      <td>{r?.ProductCode || ""}</td>
                      <td>{r?.ProductName || ""}</td>
                      <td style={{ maxWidth: "300px" }}>
                        {(r?.RecipeCode || "") + " - " + (r?.RecipeName || "")}
                      </td>
                      <td>{r?.Version || ""}</td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`status-badge status-${
                            r?.RecipeStatus === "Active"
                              ? "success"
                              : "inactive"
                          }`}
                        >
                          {r?.RecipeStatus === "Active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{r?.timestamp ? formatDateTime(r.timestamp) : ""}</td>
                      <td style={{ textAlign: "center" }}>
                        <Link
                          to={`/recipe-detail/${r?.RecipeDetailsId}`}
                          className="detail-btn"
                          title="Xem chi tiết"
                          onClick={() => setIsGroupModalOpen(false)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: "#6259ee",
                            fontSize: "18px",
                            display: "inline-block",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
