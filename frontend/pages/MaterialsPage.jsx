import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "../styles/main_style.css";

const LINE = import.meta.env.VITE_LINE;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PAGE_SIZE = 20;
const STORAGE_FILTERS_KEY = "materialsFilters";
const STORAGE_PAGE_KEY = "materialsPage";

export default function MaterialsPage() {
  // Saved session state
  const savedFilters = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_FILTERS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const savedPageView = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_PAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Filters state
  const [selectedPOs, setSelectedPOs] = useState(() => savedFilters?.pos || []);
  const [selectedBatches, setSelectedBatches] = useState(
    () => savedFilters?.batches || [],
  );
  const [selectedIngredients, setSelectedIngredients] = useState(
    () => savedFilters?.ingredients || [],
  );
  const [selectedResults, setSelectedResults] = useState(
    () => savedFilters?.results || [],
  );

  // Dropdown toggles
  const [openPO, setOpenPO] = useState(false);
  const [openBatch, setOpenBatch] = useState(false);
  const [openIngredient, setOpenIngredient] = useState(false);
  const [openResult, setOpenResult] = useState(false);

  // Date filters (default today if not in session)
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, []);
  const [dateFrom, setDateFrom] = useState(() =>
    savedFilters?.fromDate !== undefined ? savedFilters.fromDate : todayStr,
  );
  const [dateTo, setDateTo] = useState(() =>
    savedFilters?.toDate !== undefined ? savedFilters.toDate : todayStr,
  );

  // View + pagination
  const [viewMode, setViewMode] = useState(
    () => savedPageView?.view || "table",
  );
  const [currentPage, setCurrentPage] = useState(
    () => savedPageView?.page || 1,
  );
  const [totalPages, setTotalPages] = useState(1);

  // Options
  const [poOptions, setPoOptions] = useState([]); // strings
  const [batchOptions, setBatchOptions] = useState([]); // strings
  const [ingredientOptions, setIngredientOptions] = useState([]); // strings
  const resultOptions = useMemo(() => ["Success", "Failed"], []);

  // Data + stats
  const [materials, setMaterials] = useState([]);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [materialsModalOpen, setMaterialsModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // Helpers to build params
  const getFiltersParams = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedPOs.length)
      params.set("productionOrderNumber", selectedPOs.join(","));
    if (selectedBatches.length)
      params.set("batchCode", selectedBatches.join(","));
    if (selectedIngredients.length)
      params.set("ingredientCode", selectedIngredients.join(","));
    if (selectedResults.length)
      params.set("respone", selectedResults.join(","));
    if (dateFrom) params.set("fromDate", dateFrom);
    if (dateTo) params.set("toDate", dateTo);
    return params;
  }, [
    selectedPOs,
    selectedBatches,
    selectedIngredients,
    selectedResults,
    dateFrom,
    dateTo,
  ]);

  const fetchJSON = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  }, []);

  const loadPOs = useCallback(async () => {
    const data = await fetchJSON(
      `${API_BASE_URL}/api/production-materials/production-orders`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    const items = (data.data || []).map((r) =>
      r.productionOrderNumber === ""
        ? "NULL"
        : (r.productionOrderNumber ?? "NULL"),
    );
    setPoOptions(items);
  }, [fetchJSON]);

  const loadBatches = useCallback(async () => {
    let items = [];
    if (selectedPOs.length === 0) {
      const data = await fetchJSON(
        `${API_BASE_URL}/api/production-materials/batch-codes`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      items = data.data || [];
    } else {
      const seen = new Set();
      for (const po of selectedPOs) {
        try {
          const data = await fetchJSON(
            `${API_BASE_URL}/api/production-materials/batch-codes?productionOrderNumber=${encodeURIComponent(po)}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            },
          );
          for (const r of data.data || []) {
            const v = r.batchCode ?? "NULL";
            if (!seen.has(v)) {
              seen.add(v);
              items.push({ batchCode: v });
            }
          }
        } catch (e) {
          console.warn("loadBatches: batch-codes by PO fetch failed", e);
        }
      }
      items.sort((a, b) =>
        String(a.batchCode).localeCompare(String(b.batchCode)),
      );
    }
    setBatchOptions(items.map((r) => r.batchCode ?? "NULL"));
  }, [fetchJSON, selectedPOs]);

  const loadIngredients = useCallback(async () => {
    let items = [];
    if (selectedPOs.length === 0 && selectedBatches.length === 0) {
      const data = await fetchJSON(
        `${API_BASE_URL}/api/production-materials/ingredients`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      items = data.data || [];
    } else {
      const seen = new Set();
      const targets = selectedPOs.length > 0 ? selectedPOs : [undefined];
      const batchTargets =
        selectedBatches.length > 0 ? selectedBatches : [undefined];
      for (const po of targets) {
        for (const bc of batchTargets) {
          const qs = [];
          if (po) qs.push(`productionOrderNumber=${encodeURIComponent(po)}`);
          if (bc) qs.push(`batchCode=${encodeURIComponent(bc)}`);
          const url = `${API_BASE_URL}/api/production-materials/ingredients${qs.length ? `?${qs.join("&")}` : ""}`;
          try {
            const data = await fetchJSON(url, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            for (const r of data.data || []) {
              const v = r.ingredientCode ?? "NULL";
              if (!seen.has(v)) {
                seen.add(v);
                items.push({ ingredientCode: v });
              }
            }
          } catch (e) {
            console.warn("loadIngredients: ingredients fetch failed", e);
          }
        }
      }
      items.sort((a, b) =>
        String(a.ingredientCode).localeCompare(String(b.ingredientCode)),
      );
    }
    setIngredientOptions(items.map((r) => r.ingredientCode ?? "NULL"));
  }, [fetchJSON, selectedPOs, selectedBatches]);

  const normalizeStatus = (respone) =>
    String(respone).toLowerCase() === "success" ? "Success" : "Failed";

  const renderStatusBadge = (respone) => {
    const ok = String(respone).toLowerCase() === "success";
    const cls = ok
      ? "status-badge status-success"
      : "status-badge status-inactive";
    const text = normalizeStatus(respone);
    return (
      <span className={cls}>
        {viewMode !== "table" &&
          (text === "Success" ? (
            <i className="fa-solid fa-check-circle"></i>
          ) : (
            <i className="fa-solid fa-xmark-circle"></i>
          ))}
        {text}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const [datePart, timePart] = String(dateString).split("T");
    if (!datePart || !timePart) return String(dateString);
    const [year, month, day] = datePart.split("-");
    const [hours, minutes, seconds] = timePart.replace("Z", "").split(":");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Items fetch + stats
  const fetchItems = useCallback(
    async (page) => {
      const params = getFiltersParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const url = `${API_BASE_URL}/api/production-materials/search?${params.toString()}`;
      const data = await fetchJSON(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return data.data || [];
    },
    [getFiltersParams, fetchJSON],
  );

  const fetchTotal = useCallback(async () => {
    const params = getFiltersParams();
    const hasFilters =
      params.has("productionOrderNumber") ||
      params.has("batchCode") ||
      params.has("ingredientCode") ||
      params.has("respone") ||
      params.has("fromDate") ||
      params.has("toDate");
    const base = hasFilters
      ? `${API_BASE_URL}/api/production-materials/stats/search`
      : `${API_BASE_URL}/api/production-materials/stats`;
    const url = hasFilters ? `${base}?${params.toString()}` : base;
    const data = await fetchJSON(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return Number(data?.data?.total || 0);
  }, [getFiltersParams, fetchJSON]);

  const queryAndRender = useCallback(
    async (page) => {
      setIsLoading(true);
      try {
        const [total, items] = await Promise.all([
          fetchTotal(),
          fetchItems(page),
        ]);
        setMaterials(items);
        setTotalMaterials(total);
        setCurrentPage(page);
        setTotalPages(Math.max(Math.ceil(total / PAGE_SIZE), 1));
      } catch (err) {
        console.error("Materials query error:", err);
        setMaterials([]);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTotal, fetchItems],
  );

  // Initialize
  useEffect(() => {
    // Close dropdowns on outside click
    const handleClickOutside = (e) => {
      if (!e.target.closest || !e.target.closest(".custom-multiselect")) {
        setOpenPO(false);
        setOpenBatch(false);
        setOpenIngredient(false);
        setOpenResult(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      await loadPOs();
      await loadBatches();
      await loadIngredients();
      await queryAndRender(currentPage);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters
  useEffect(() => {
    try {
      const payload = {
        pos: selectedPOs,
        batches: selectedBatches,
        ingredients: selectedIngredients,
        results: selectedResults,
        fromDate: dateFrom,
        toDate: dateTo,
      };
      sessionStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Persist filters failed", e);
    }
  }, [
    selectedPOs,
    selectedBatches,
    selectedIngredients,
    selectedResults,
    dateFrom,
    dateTo,
  ]);

  // Persist page + view
  useEffect(() => {
    try {
      const payload = { page: currentPage, view: viewMode };
      sessionStorage.setItem(STORAGE_PAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Persist page/view failed", e);
    }
  }, [currentPage, viewMode]);

  // When parent filters change, reload cascades and go to page 1
  useEffect(() => {
    (async () => {
      await loadBatches();
      await loadIngredients();
      await queryAndRender(1);
    })();
  }, [selectedPOs, loadBatches, loadIngredients, queryAndRender]);

  useEffect(() => {
    (async () => {
      await loadIngredients();
      await queryAndRender(1);
    })();
  }, [selectedBatches, loadIngredients, queryAndRender]);

  useEffect(() => {
    (async () => {
      await queryAndRender(1);
    })();
  }, [selectedIngredients, selectedResults, dateFrom, dateTo, queryAndRender]);

  const handleSelectToggle = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
    setCurrentPage(1);
  };

  const handleSelectAll = (options, setList, checked) => {
    setList(checked ? [...options] : []);
    setCurrentPage(1);
  };

  const refreshAll = () => {
    setSelectedPOs([]);
    setSelectedBatches([]);
    setSelectedIngredients([]);
    setSelectedResults([]);
    setDateFrom(todayStr);
    setDateTo(todayStr);
    setCurrentPage(1);
    queryAndRender(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) queryAndRender(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) queryAndRender(currentPage + 1);
  };

  const selectedText = (values) => `${values?.length || 0} selected`;

  const selectedLabel = (values, threshold) => {
    const count = values?.length || 0;
    if (count === 0) return "";
    return count > threshold ? `${count} selected` : values.join(", ");
  };

  // Close modal helper
  const closeModal = () => {
    setMaterialsModalOpen(false);
    setModalItem(null);
  };

  // Open modal helper
  useEffect(() => {
    setMaterialsModalOpen(!!modalItem);
  }, [modalItem]);

  return (
    <>
      <div className="topBar">
        <Link to="/" className="nav-left">
          <i className="fa-solid fa-home"></i>
          <span>DashBoard</span>
        </Link>
        <div className="nav-breadcrumb">
          <Link
            to="/materials"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Nguyên vật liệu
          </Link>
        </div>
      </div>

      <div className="main-container">
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
                  <h1>Quản lý Nguyên vật liệu</h1>
                  <p>Tổng quan kho và sử dụng vật liệu</p>
                </div>
              </div>
              <div className="badge-cs1">{LINE}</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span>Tổng vật liệu</span>
                <div className="stat-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="#2a5fc0"
                  >
                    <path d="M11.132 2.504l-4 7a1 1 0 0 0 .868 1.496h8a1 1 0 0 0 .868 -1.496l-4 -7a1 1 0 0 0 -1.736 0z" />
                    <path d="M17 13a4 4 0 1 1 -3.995 4.2l-.005 -.2l.005 -.2a4 4 0 0 1 3.995 -3.8z" />
                    <path d="M9 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" />
                  </svg>
                </div>
              </div>
              <div className="stat-number" id="materials-total-stat">
                {totalMaterials}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div className="first-search-section">
            <div
              style={{
                paddingLeft: "20px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <label style={{ fontWeight: "500", color: "#666" }}>
                Lệnh SX (PO):
              </label>
              <div
                className="custom-multiselect"
                style={{ position: "relative", minWidth: "300px" }}
              >
                <div
                  className="multiselect-input"
                  id="poInput"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: "38px",
                  }}
                >
                  <span
                    id="poSelectedText"
                    className="selected-text"
                    style={{ color: selectedPOs.length ? "#333" : "#999" }}
                    onClick={() => setOpenPO((o) => !o)}
                  >
                    {selectedLabel(selectedPOs, 1)}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                <div
                  className="multiselect-dropdown"
                  id="poDropdown"
                  style={{
                    display: openPO ? "block" : "none",
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    marginTop: "4px",
                    maxHeight: "250px",
                    overflowY: "auto",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="poSelectAll"
                        checked={
                          selectedPOs.length === poOptions.length &&
                          poOptions.length > 0
                        }
                        onChange={(e) =>
                          handleSelectAll(
                            poOptions,
                            setSelectedPOs,
                            e.target.checked,
                          )
                        }
                        style={{ cursor: "pointer" }}
                      />
                      <span>[Select all]</span>
                    </label>
                  </div>
                  <div id="poOptions" style={{ padding: "4px" }}>
                    {poOptions.map((po) => (
                      <label
                        key={po}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "6px 8px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPOs.includes(po)}
                          onChange={() =>
                            handleSelectToggle(selectedPOs, setSelectedPOs, po)
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <span>{po}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: "500", color: "#666" }}>
                  Batch:
                </label>
                <div
                  className="custom-multiselect"
                  style={{ position: "relative", minWidth: "220px" }}
                >
                  <div
                    className="multiselect-input"
                    id="batchInput"
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "38px",
                    }}
                  >
                    <span
                      id="batchSelectedText"
                      className="selected-text"
                      style={{
                        color: selectedBatches.length ? "#333" : "#999",
                      }}
                      onClick={() => setOpenBatch((o) => !o)}
                    >
                      {selectedLabel(selectedBatches, 4)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <div
                    className="multiselect-dropdown"
                    id="batchDropdown"
                    style={{
                      display: openBatch ? "block" : "none",
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      marginTop: "4px",
                      maxHeight: "250px",
                      overflowY: "auto",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      zIndex: 1000,
                    }}
                  >
                    <div
                      style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        <input
                          type="checkbox"
                          id="batchSelectAll"
                          checked={
                            selectedBatches.length === batchOptions.length &&
                            batchOptions.length > 0
                          }
                          onChange={(e) =>
                            handleSelectAll(
                              batchOptions,
                              setSelectedBatches,
                              e.target.checked,
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <span>[Select all]</span>
                      </label>
                    </div>
                    <div id="batchOptions" style={{ padding: "4px" }}>
                      {batchOptions.map((bc) => (
                        <label
                          key={bc}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "6px 8px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBatches.includes(bc)}
                            onChange={() =>
                              handleSelectToggle(
                                selectedBatches,
                                setSelectedBatches,
                                bc,
                              )
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <span>{bc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: "500", color: "#666" }}>
                  Ingredient Code:
                </label>
                <div
                  className="custom-multiselect"
                  style={{ position: "relative", minWidth: "220px" }}
                >
                  <div
                    className="multiselect-input"
                    id="ingredientInput"
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "38px",
                    }}
                  >
                    <span
                      id="ingredientSelectedText"
                      className="selected-text"
                      style={{
                        color: selectedIngredients.length ? "#333" : "#999",
                      }}
                      onClick={() => setOpenIngredient((o) => !o)}
                    >
                      {selectedLabel(selectedIngredients, 1)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <div
                    className="multiselect-dropdown"
                    id="ingredientDropdown"
                    style={{
                      display: openIngredient ? "block" : "none",
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      marginTop: "4px",
                      maxHeight: "250px",
                      overflowY: "auto",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      zIndex: 1000,
                    }}
                  >
                    <div
                      style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        <input
                          type="checkbox"
                          id="ingredientSelectAll"
                          checked={
                            selectedIngredients.length ===
                              ingredientOptions.length &&
                            ingredientOptions.length > 0
                          }
                          onChange={(e) =>
                            handleSelectAll(
                              ingredientOptions,
                              setSelectedIngredients,
                              e.target.checked,
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <span>[Select all]</span>
                      </label>
                    </div>
                    <div id="ingredientOptions" style={{ padding: "4px" }}>
                      {ingredientOptions.map((ing) => (
                        <label
                          key={ing}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "6px 8px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIngredients.includes(ing)}
                            onChange={() =>
                              handleSelectToggle(
                                selectedIngredients,
                                setSelectedIngredients,
                                ing,
                              )
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <span>{ing}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: "500", color: "#666" }}>
                  Result:
                </label>
                <div
                  className="custom-multiselect"
                  style={{ position: "relative", minWidth: "220px" }}
                >
                  <div
                    className="multiselect-input"
                    id="resultInput"
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: "38px",
                    }}
                  >
                    <span
                      id="resultSelectedText"
                      className="selected-text"
                      style={{
                        color: selectedResults.length ? "#333" : "#999",
                      }}
                      onClick={() => setOpenResult((o) => !o)}
                    >
                      {selectedText(selectedResults)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <div
                    className="multiselect-dropdown"
                    id="resultDropdown"
                    style={{
                      display: openResult ? "block" : "none",
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      marginTop: 4,
                      maxHeight: 250,
                      overflowY: "auto",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      zIndex: 1000,
                    }}
                  >
                    <div
                      style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        <input
                          type="checkbox"
                          id="resultSelectAll"
                          checked={
                            selectedResults.length === resultOptions.length
                          }
                          onChange={(e) =>
                            handleSelectAll(
                              resultOptions,
                              setSelectedResults,
                              e.target.checked,
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <span>[Select all]</span>
                      </label>
                    </div>
                    <div id="resultOptions" style={{ padding: "4px" }}>
                      {resultOptions.map((r) => (
                        <label
                          key={r}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "6px 8px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedResults.includes(r)}
                            onChange={() =>
                              handleSelectToggle(
                                selectedResults,
                                setSelectedResults,
                                r,
                              )
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <span>{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="second-search-section"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div
              style={{
                paddingLeft: "20px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <label style={{ fontWeight: "500", color: "#666" }}>
                  Từ ngày:
                </label>
                <input
                  type="date"
                  id="materialsDateFrom"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <label style={{ fontWeight: "500", color: "#666" }}>
                  Đến ngày:
                </label>
                <input
                  type="date"
                  id="materialsDateTo"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
            <div className="view-controls" style={{ paddingRight: "40px" }}>
              <button
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                data-view="table"
                title="Danh sách"
                onClick={() => setViewMode("table")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6l16 0" />
                  <path d="M4 12l16 0" />
                  <path d="M4 18l16 0" />
                </svg>
              </button>
              <button
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                data-view="grid"
                title="Lưới"
                onClick={() => setViewMode("grid")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 3a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
                  <path d="M19 3a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
                  <path d="M9 13a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
                  <path d="M19 13a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
                </svg>
              </button>
              <hr style={{ height: "30px", width: "2px" }} />
              <button className="refresh-btn" onClick={refreshAll}>
                <i className="fa-solid fa-rotate-right"></i>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        <div className="table-section" style={{ overflowX: "auto" }}>
          {/* Grid */}
          {viewMode === "grid" && (
            <div
              style={{
                padding: "16px 16px 0 16px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  <i
                    className="fa-solid fa-spinner fa-spin"
                    style={{ fontSize: "32px", color: "#6259ee" }}
                  ></i>
                </div>
              ) : (
                materials.map((r, idx) => {
                  const qty = `${r.quantity ?? "-"} ${r.unitOfMeasurement ?? ""}`;
                  return (
                    <div
                      key={idx}
                      className="card"
                      style={{
                        border: "1px solid #e8e7f0",
                        borderRadius: "10px",
                        padding: "12px",
                        background: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#333" }}>
                          ID: {r.id ?? "-"}
                        </div>
                        <div>{renderStatusBadge(r.respone)}</div>
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: "6px",
                        }}
                      >
                        <div>
                          <b>PO:</b> {r.productionOrderNumber ?? "-"}
                        </div>
                        <div>
                          <b>Batch:</b> {r.batchCode ?? "-"}
                        </div>
                        <div>
                          <b>Ingredient Code:</b> {r.ingredientCode ?? "-"}
                        </div>
                        <div>
                          <b>Lot:</b> {r.lot || "-"}
                        </div>
                        <div>
                          <b>Qty:</b> {qty}
                        </div>
                        <div>
                          <b>Operator:</b> {r.operator_ID ?? "-"}
                        </div>
                        <div>
                          <b>Time:</b> {formatDateTime(r.timestamp) ?? "-"}
                        </div>
                      </div>
                      <div className="recipe-actions">
                        <button
                          className="detail-btn"
                          onClick={() => setModalItem(r)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Table */}
          {viewMode === "table" && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ProductionOrderNumber</th>
                  <th style={{ textAlign: "center" }}>Batch Code</th>
                  <th>Quantity</th>
                  <th>IngredientCode</th>
                  <th style={{ textAlign: "center" }}>Lot</th>
                  <th>Operator_ID</th>
                  <th style={{ textAlign: "center" }}>Result</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="materialsTableBody">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="10"
                      style={{ textAlign: "center", padding: "30px" }}
                    >
                      <i
                        className="fa-solid fa-spinner fa-spin"
                        style={{
                          fontSize: "24px",
                          color: "#6259ee",
                          marginRight: "10px",
                        }}
                      ></i>
                      <span style={{ fontSize: "16px", color: "#666" }}>
                        Đang tải dữ liệu...
                      </span>
                    </td>
                  </tr>
                ) : (
                  materials.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.id ?? "-"}</td>
                      <td>{r.productionOrderNumber ?? "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        {r.batchCode ?? "-"}
                      </td>
                      <td>
                        {r.quantity ?? "-"} {r.unitOfMeasurement ?? ""}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {r.ingredientCode ?? "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>{r.lot || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        {r.operator_ID ?? "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {renderStatusBadge(r.respone)}
                      </td>
                      <td>{formatDateTime(r.timestamp) ?? "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="action-view-btn"
                            title="Xem chi tiết"
                            onClick={() => setModalItem(r)}
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          <div className="pagination-controls">
            <button
              id="materialsPrevPageBtn"
              className="pagination-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
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
            <span id="materialsPageInfo" className="page-info">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              id="materialsNextPageBtn"
              className="pagination-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
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
      </div>

      {/* Modal */}
      <div
        id="materialModal"
        style={{
          display: materialsModalOpen ? "block" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={closeModal}
      >
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "30px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              borderBottom: "2px solid #ddd",
              paddingBottom: "15px",
            }}
          >
            <h2 style={{ margin: 0, color: "#333" }}>
              Chi Tiết Vật Liệu Tiêu Thụ
            </h2>
            <button
              id="closeModalBtn"
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
              }}
              onClick={closeModal}
            >
              &times;
            </button>
          </div>
          <div
            id="modalContent"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                ID
              </label>
              <p
                id="modalId"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.id ?? "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Production Order Number
              </label>
              <p
                id="modalProductionOrderNumber"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.ProductionOrderNumber ||
                  modalItem?.productionOrderNumber ||
                  "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Batch Code
              </label>
              <p
                id="modalBatchCode"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.batchCode || "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Ingredient Code
              </label>
              <p
                id="modalIngredientCode"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.ingredientCode ?? "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Lot
              </label>
              <p
                id="modalLot"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.lot || "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Actual Quantity
              </label>
              <p
                id="modalQuantity"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {!modalItem?.quantity || modalItem?.quantity === 0
                  ? `N/A ${modalItem?.unitOfMeasurement || ""}`
                  : `${modalItem?.quantity} ${modalItem?.unitOfMeasurement || ""}`}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Consumption Date
              </label>
              <p
                id="modalDateTime"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.datetime
                  ? new Date(modalItem?.datetime).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Status
              </label>
              <p
                id="modalStatusDisplay"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.respone
                  ? modalItem?.respone === "Success"
                    ? "Success"
                    : "Failed"
                  : "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Count
              </label>
              <p
                id="modalCount"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.count ?? "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Operator ID
              </label>
              <p
                id="modalOperatorId"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.operator_ID ?? "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Supply Machine
              </label>
              <p
                id="modalSupplyMachine"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {modalItem?.supplyMachine ?? "-"}
              </p>
            </div>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Timestamp
              </label>
              <p
                id="modalTimestamp"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                {formatDateTime(modalItem?.timestamp) ?? "-"}
              </p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Request
              </label>
              <pre
                id="modalRequest"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                  overflowX: "auto",
                  fontSize: "16px",
                  maxHeight: "500px",
                }}
              >
                {modalItem?.request ?? "-"}
              </pre>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Response
              </label>
              <pre
                id="modalResponse"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                  overflowX: "auto",
                  fontSize: "16px",
                  maxHeight: "150px",
                }}
              >
                {modalItem?.respone ?? "-"}
              </pre>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  fontWeight: "bold",
                  color: "#666",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                Status
              </label>
              <pre
                id="modalStatus"
                style={{
                  margin: 0,
                  padding: "8px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                  overflowX: "auto",
                  maxHeight: "200px",
                  fontSize: "16px",
                }}
              >
                {modalItem?.status1 ?? "-"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
