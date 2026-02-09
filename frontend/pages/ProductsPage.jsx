import { useCallback } from "react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LINE = import.meta.env.VITE_LINE;
const STATE_KEY = "products_filters_state_v1";
const PAGE_SIZE = 20;

export default function ProductsPage() {
  const getSavedState = () => {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to parse saved products state", error);
    }
    return null;
  };
  const savedState = getSavedState();

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalTypes: 0,
    totalCategories: 0,
    totalGroups: 0,
  });
  const [availableTypes, setAvailableTypes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(savedState?.viewMode || "table");
  const [filters, setFilters] = useState(
    savedState?.filters || {
      search: "",
      statuses: [],
      types: [],
    },
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(savedState?.currentPage || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState({
    isOpen: false,
    product: null,
  });
  const statusDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);

  const buildSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("pageSize", PAGE_SIZE);

    if (filters.search) params.append("q", filters.search);

    if (filters.statuses.length === 1) {
      params.append(
        "status",
        filters.statuses[0] === "active" ? "ACTIVE" : "INACTIVE",
      );
    } else if (filters.statuses.length > 1) {
      const mapped = filters.statuses.map((s) =>
        s === "active" ? "ACTIVE" : "INACTIVE",
      );
      params.append("statuses", mapped.join(","));
    }

    if (filters.types.length === 1) {
      params.append("type", filters.types[0]);
    } else if (filters.types.length > 1) {
      params.append("types", filters.types.join(","));
    }

    return params;
  }, [filters, currentPage]);

  const updateStats = useCallback(async () => {
    const params = buildSearchParams();
    const res = await fetch(
      `${API_BASE_URL}/api/production-products/stats/search?${params.toString()}`,
    );
    if (!res.ok) throw new Error("Không lấy được thống kê");
    const data = await res.json();
    setStats(data);
  }, [buildSearchParams]);

  const loadProducts = useCallback(async () => {
    const params = buildSearchParams();
    const res = await fetch(
      `${API_BASE_URL}/api/production-products/search?${params.toString()}`,
    );
    if (!res.ok) throw new Error("Không lấy được kết quả tìm kiếm");
    const data = await res.json();

    setProducts(data.items || []);
    const calcTotalPages = Math.max(Math.ceil(data.total / data.pageSize), 1);
    setTotalPages(calcTotalPages);
    if (data.page > calcTotalPages) setCurrentPage(calcTotalPages);
  }, [buildSearchParams]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([updateStats(), loadProducts()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [updateStats, loadProducts]);

  const fetchTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/production-products/types`);
      if (!res.ok) throw new Error("Không lấy được danh sách loại");
      const types = await res.json();
      const uniqueTypes = [
        ...new Set(types.filter((t) => t && t.trim())),
      ].sort();
      setAvailableTypes(uniqueTypes);
    } catch (e) {
      console.warn("Failed to fetch types", e);
    }
  };

  const saveProductsState = useCallback(() => {
    try {
      const state = {
        filters,
        currentPage,
        viewMode,
      };
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save products state", error);
    }
  }, [filters, currentPage, viewMode]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setFilters((prev) => ({ ...prev, search: val }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshData();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search, refreshData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleReset = async () => {
    setFilters({ search: "", statuses: [], types: [] });
    setCurrentPage(1);
    sessionStorage.removeItem(STATE_KEY);
  };

  const handleStatusToggle = (value) => {
    setFilters((prev) => {
      const exists = prev.statuses.includes(value);
      let newStatuses;
      if (exists) newStatuses = prev.statuses.filter((s) => s !== value);
      else newStatuses = [...prev.statuses, value];
      return { ...prev, statuses: newStatuses };
    });
    setCurrentPage(1);
  };

  const handleStatusSelectAll = (checked) => {
    if (checked) {
      // Assuming 'active' and 'inactive' are the only statuses for now
      setFilters((prev) => ({ ...prev, statuses: ["active", "inactive"] }));
    } else {
      setFilters((prev) => ({ ...prev, statuses: [] }));
    }
    setCurrentPage(1);
  };

  const handleTypeToggle = (value) => {
    setFilters((prev) => {
      const exists = prev.types.includes(value);
      let newTypes;
      if (exists) newTypes = prev.types.filter((t) => t !== value);
      else newTypes = [...prev.types, value];
      return { ...prev, types: newTypes };
    });
    setCurrentPage(1);
  };

  const handleTypeSelectAll = (checked) => {
    if (checked) {
      setFilters((prev) => ({ ...prev, types: [...availableTypes] }));
    } else {
      setFilters((prev) => ({ ...prev, types: [] }));
    }
    setCurrentPage(1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return dateString;
    const [year, month, day] = datePart.split("-");
    const [hours, minutes, seconds] = timePart.replace("Z", "").split(":");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const getStatusText = () => {
    if (filters.statuses.length === 0) return "Select statuses...";
    if (filters.statuses.length > 2)
      return `${filters.statuses.length} selected`;
    const labelMap = { active: "Hoạt động", inactive: "Ngừng hoạt động" };
    return filters.statuses.map((s) => labelMap[s] || s).join(", ");
  };

  const getTypeText = () => {
    if (filters.types.length === 0) return "Select types...";
    if (filters.types.length > 2) return `${filters.types.length} selected`;
    return filters.types.join(", ");
  };

  useEffect(() => {
    document.title = "Quản Lý Sản Phẩm - Factory Management";
    fetchTypes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshData();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    filters.search,
    filters.statuses,
    filters.types,
    currentPage,
    refreshData,
  ]);

  useEffect(() => {
    saveProductsState();
  }, [saveProductsState]);

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="topBar">
        <Link to="/" className="nav-left">
          <i className="fa-solid fa-home"></i>
          <span>DashBoard</span>
        </Link>
        <div className="nav-breadcrumb">
          <Link
            to="/products"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Sản Phẩm
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="main-container-product">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-top">
            <Link className="back-btn" to="/">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>

            <div className="header-title">
              <div className="header-top-left">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="#6259ee"
                >
                  <path d="M11.132 2.504l-4 7a1 1 0 0 0 .868 1.496h8a1 1 0 0 0 .868 -1.496l-4 -7a1 1 0 0 0 -1.736 0z" />
                  <path d="M17 13a4 4 0 1 1 -3.995 4.2l-.005 -.2l.005 -.2a4 4 0 0 1 3.995 -3.8z" />
                  <path d="M9 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" />
                </svg>

                <div className="header-text">
                  <h1>Danh Mục Sản Phẩm</h1>
                  <p>Quản lý dữ liệu chính sản phẩm và quy đổi đơn vị</p>
                </div>
              </div>
              <div className="badge-cs1">{LINE}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span>Tổng Sản Phẩm</span>
                <div className="stat-icon" id="total-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="#2a65b9"
                  >
                    <path d="M11.132 2.504l-4 7a1 1 0 0 0 .868 1.496h8a1 1 0 0 0 .868 -1.496l-4 -7a1 1 0 0 0 -1.736 0z" />
                    <path d="M17 13a4 4 0 1 1 -3.995 4.2l-.005 -.2l.005 -.2a4 4 0 0 1 3.995 -3.8z" />
                    <path d="M9 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" />
                  </svg>
                </div>
              </div>
              <div className="stat-number">{stats.totalProducts}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Sản Phẩm Hoạt động</span>
                <div className="stat-icon" id="active-icon">
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ color: "#47b54d" }}
                  ></i>
                </div>
              </div>
              <div className="stat-number">{stats.activeProducts}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Type / Category</span>
                <div className="stat-icon" id="type-category-icon">
                  <i
                    className="fa-solid fa-box-archive"
                    style={{ color: "#1c96ff" }}
                  ></i>
                </div>
              </div>
              <div className="stat-number">
                {stats.totalTypes} / {stats.totalCategories}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Group</span>
                <div className="stat-icon" id="group-icon">
                  <i
                    className="fa-solid fa-layer-group"
                    style={{ color: "#1c96ff" }}
                  ></i>
                </div>
              </div>
              <div className="stat-number">{stats.totalGroups}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="search-section-product">
          <div className="search-bar">
            <i className="fa-solid fa-search"></i>
            <input
              type="text"
              placeholder="Tìm theo mã, tên, nhóm..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="view-controls-product">
            <button
              className={`view-btn-product ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="4" width="18" height="3" rx="1.5" />
                <rect x="3" y="10.5" width="18" height="3" rx="1.5" />
                <rect x="3" y="17" width="18" height="3" rx="1.5" />
              </svg>
            </button>
            <button
              className={`view-btn-product ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="4" width="7" height="7" rx="2" />
                <rect x="14" y="4" width="7" height="7" rx="2" />
                <rect x="14" y="13" width="7" height="7" rx="2" />
                <rect x="3" y="13" width="7" height="7" rx="2" />
              </svg>
            </button>

            {/* Status Multiselect */}
            <div
              className="custom-multiselect"
              ref={statusDropdownRef}
              style={{ position: "relative", minWidth: "220px" }}
            >
              <div
                className="multiselect-input"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    color: filters.statuses.length === 0 ? "#999" : "#333",
                  }}
                >
                  {getStatusText()}
                </span>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ color: "#666" }}
                ></i>
              </div>
              {showStatusDropdown && (
                <div
                  className="multiselect-dropdown"
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #eee",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    padding: "8px",
                    zIndex: 1000,
                    display: "block",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderBottom: "1px dashed #eee",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => handleStatusSelectAll(e.target.checked)}
                      checked={filters.statuses.length === 2} // Naive check for select all
                    />
                    <strong>Select all</strong>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      paddingTop: "4px",
                    }}
                  >
                    {[
                      { value: "active", label: "Hoạt động" },
                      { value: "inactive", label: "Ngừng hoạt động" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
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
                          checked={filters.statuses.includes(opt.value)}
                          onChange={() => handleStatusToggle(opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Type Multiselect */}
            <div
              className="custom-multiselect"
              ref={typeDropdownRef}
              style={{ position: "relative", minWidth: "220px" }}
            >
              <div
                className="multiselect-input"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    color: filters.types.length === 0 ? "#999" : "#333",
                  }}
                >
                  {getTypeText()}
                </span>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ color: "#666" }}
                ></i>
              </div>
              {showTypeDropdown && (
                <div
                  className="multiselect-dropdown"
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #eee",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    padding: "8px",
                    zIndex: 1000,
                    maxHeight: "300px",
                    overflowY: "auto",
                    display: "block",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderBottom: "1px dashed #eee",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => handleTypeSelectAll(e.target.checked)}
                      checked={
                        availableTypes.length > 0 &&
                        filters.types.length === availableTypes.length
                      }
                    />
                    <strong>Select all</strong>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      paddingTop: "4px",
                    }}
                  >
                    {availableTypes.map((t) => (
                      <label
                        key={t}
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
                          checked={filters.types.includes(t)}
                          onChange={() => handleTypeToggle(t)}
                        />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="refresh-btn" onClick={handleReset}>
              <i className="fa-solid fa-rotate-right"></i>
              Làm mới
            </button>
          </div>
        </div>

        {/* LOADING / ERROR */}
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            Error: {error}
          </div>
        )}

        {/* Content Views */}
        {!loading && !error && (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div
                className="grid-view"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(370px, 1fr))",
                  gap: "24px",
                }}
              >
                {products.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#888",
                      gridColumn: "1/-1",
                    }}
                  >
                    Không có sản phẩm nào
                  </div>
                ) : (
                  products.map((p, idx) => (
                    <div
                      key={idx}
                      className="product-card"
                      style={{
                        background: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                        padding: "20px 18px 18px 18px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        border: "1px solid #eee",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#222",
                          }}
                        >
                          {p.ItemCode || "-"}
                        </div>
                        <p
                          className={`status-badge ${p.Item_Status === "ACTIVE" ? "status-success" : "status-inactive"}`}
                        >
                          {p.Item_Status === "ACTIVE" ? (
                            <i className="fa-solid fa-check-circle"></i>
                          ) : (
                            <i className="fa-solid fa-xmark-circle"></i>
                          )}
                          {p.Item_Status === "ACTIVE" ? " Active" : " Inactive"}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "500",
                          margin: "6px 0 2px 0",
                          lineHeight: "1.4",
                        }}
                      >
                        {p.ItemName || "-"}
                      </div>
                      <div
                        style={{
                          background: "#f6f6ff",
                          borderRadius: "8px",
                          padding: "10px 12px 8px 12px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            marginBottom: "2px",
                            color: "#888",
                          }}
                        >
                          SẢN PHẨM
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "15px",
                          }}
                        >
                          <i
                            className="fa-solid fa-box"
                            style={{ color: "#bdbdbd" }}
                          ></i>
                          <span style={{ fontWeight: "600" }}>
                            {p.ItemCode || "-"}
                          </span>
                          <span style={{ color: "#888" }}>
                            {p.ItemName || "-"}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          fontSize: "13px",
                          color: "#888",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          Group: <b>{p.Group || "-"}</b>
                        </div>
                        <div>
                          Category: <b>{p.Category || "-"}</b>
                        </div>
                        <div>
                          Brand: <b>{p.Brand || "-"}</b>
                        </div>
                        <div>
                          Base Unit: <b>{p.BaseUnit || "-"}</b>
                        </div>
                        <div>
                          <i className="fa-regular fa-clock"></i> Cập nhật:{" "}
                          <b>
                            {p.timestamp ? formatDateTime(p.timestamp) : "-"}
                          </b>
                        </div>
                      </div>
                      <button
                        onClick={() => setModal({ isOpen: true, product: p })}
                        className="detail-btn"
                        style={{
                          marginTop: "10px",
                          background: "#6259ee",
                          color: "#fff",
                          border: "none",
                          padding: "10px 0",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "15px",
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="table-section">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã SP</th>
                      <th>Tên Sản Phẩm</th>
                      <th style={{ textAlign: "center" }}>Loại</th>
                      <th style={{ textAlign: "center" }}>Nhóm</th>
                      <th style={{ textAlign: "center" }}>ĐV Cơ Sở</th>
                      <th style={{ textAlign: "center" }}>Trạng Thái</th>
                      <th>Cập Nhật</th>
                      <th style={{ textAlign: "center" }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            textAlign: "center",
                            color: "#888",
                            padding: "16px",
                          }}
                        >
                          Không có dữ liệu phù hợp
                        </td>
                      </tr>
                    ) : (
                      products.map((p, idx) => (
                        <tr key={idx}>
                          <td>{p.ItemCode || "-"}</td>
                          <td>{p.ItemName || "-"}</td>
                          <td style={{ textAlign: "center" }}>
                            {p.Item_Type || "-"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {p.Group || "-"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {p.BaseUnit || "-"}
                          </td>
                          <td className="td-center">
                            {p.Item_Status === "ACTIVE" ? (
                              <span className="status-badge status-success">
                                Active
                              </span>
                            ) : (
                              <span className="status-badge status-inactive">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td>
                            {p.timestamp ? formatDateTime(p.timestamp) : ""}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <button
                              onClick={() =>
                                setModal({ isOpen: true, product: p })
                              }
                              className="detail-btn"
                              title="Xem chi tiết"
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
                                <path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992.992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="pagination-section">
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
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
            </div>
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {modal.isOpen && modal.product && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            zIndex: 9999,
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.25)",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setModal({ isOpen: false, product: null })}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "90%",
              margin: "40px auto",
              padding: "32px 24px",
              boxShadow: "0 2px 24px #0002",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "16px", color: "#6259ee" }}>
              Chi tiết sản phẩm
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["ProductMasterId", modal.product.ProductMasterId],
                  ["Mã SP", modal.product.ItemCode],
                  ["Tên SP", modal.product.ItemName],
                  ["Loại", modal.product.Item_Type],
                  ["Nhóm", modal.product.Group],
                  ["Category", modal.product.Category],
                  ["Brand", modal.product.Brand],
                  ["Đơn vị cơ sở", modal.product.BaseUnit],
                  ["Đơn vị tồn kho", modal.product.InventoryUnit],
                  ["Trạng thái", modal.product.Item_Status],
                  [
                    "Ngày cập nhật",
                    modal.product.timestamp
                      ? formatDateTime(modal.product.timestamp)
                      : "-",
                  ],
                ].map(([label, val], i) => (
                  <tr key={i}>
                    <td
                      style={{
                        fontWeight: "600",
                        padding: "6px 0",
                        paddingRight: "12px",
                        width: "160px",
                      }}
                    >
                      {label}
                    </td>
                    <td>{val || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ margin: "18px 0 8px 0", color: "#1c96ff" }}>
              MHUTypes
            </h3>
            {modal.product.MhuTypes && modal.product.MhuTypes.length > 0 ? (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  maxHeight: "300px",
                  overflowY: "auto",
                  display: "block",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        width: "140px",
                        textAlign: "center",
                        padding: "6px 0",
                      }}
                    >
                      MHUTypeId
                    </th>
                    <th
                      style={{
                        width: "140px",
                        textAlign: "center",
                        padding: "6px 0",
                      }}
                    >
                      FromUnit
                    </th>
                    <th
                      style={{
                        width: "140px",
                        textAlign: "center",
                        padding: "6px 0",
                      }}
                    >
                      ToUnit
                    </th>
                    <th
                      style={{
                        width: "140px",
                        textAlign: "center",
                        padding: "6px 0",
                      }}
                    >
                      Conversion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modal.product.MhuTypes.map((m, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "center", padding: "6px 0" }}>
                        {m.MHUTypeId ?? "-"}
                      </td>
                      <td style={{ textAlign: "center", padding: "6px 0" }}>
                        {m.FromUnit ?? "-"}
                      </td>
                      <td style={{ textAlign: "center", padding: "6px 0" }}>
                        {m.ToUnit ?? "-"}
                      </td>
                      <td style={{ textAlign: "center", padding: "6px 0" }}>
                        {m.Conversion ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: "#888" }}>
                Không có quy đổi đơn vị (MHU) cho sản phẩm này
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
