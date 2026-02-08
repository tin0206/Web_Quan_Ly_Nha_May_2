import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/main_style.css";

const PLANTCODE = import.meta.env.VITE_PLANTCODE || "MIP";
const LINE = import.meta.env.VITE_LINE || "CS1";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function ProductionOrdersPage() {
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem("po_searchQuery") || "";
  });
  const [dateFrom, setDateFrom] = useState(() => {
    const saved = sessionStorage.getItem("po_dateFrom");
    if (saved !== null) return saved;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const saved = sessionStorage.getItem("po_dateTo");
    if (saved !== null) return saved;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [processAreas, setProcessAreas] = useState(() => {
    const saved = sessionStorage.getItem("po_processAreas");
    return saved ? JSON.parse(saved) : [];
  });
  const [statuses, setStatuses] = useState(() => {
    const saved = sessionStorage.getItem("po_statuses");
    return saved ? JSON.parse(saved) : [];
  });
  const [shifts, setShifts] = useState(() => {
    const saved = sessionStorage.getItem("po_shifts");
    return saved ? JSON.parse(saved) : [];
  });
  const [openProcessArea, setOpenProcessArea] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openShift, setOpenShift] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return sessionStorage.getItem("po_viewMode") || "table";
  }); // "table" or "grid"
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("po_currentPage");
    return saved ? parseInt(saved) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState(false);
  const totalRecordsRef = useRef(0);
  const [productionOrders, setProductionOrders] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats data
  const [stats, setStats] = useState({
    totalOrders: null,
    running: null,
    completed: null,
    pending: null,
  });

  // Available options
  const [processAreaOptions, setProcessAreaOptions] = useState([]);
  const [statusOptions] = useState([
    { value: "Đang chạy", label: "Đang chạy" },
    { value: "Đang chờ", label: "Đang chờ" },
  ]);
  const [shiftOptions, setShiftOptions] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const hasFilters =
        searchQuery ||
        dateFrom ||
        dateTo ||
        processAreas.length > 0 ||
        statuses.length > 0 ||
        shifts.length > 0;
      const endpoint = hasFilters
        ? "/api/production-orders/stats/search"
        : "/api/production-orders/stats";

      const params = new URLSearchParams();
      if (searchQuery) params.append("searchQuery", searchQuery);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (processAreas.length > 0)
        params.append("processAreas", processAreas.join(","));
      if (statuses.length > 0) params.append("statuses", statuses.join(","));
      if (shifts.length > 0) params.append("shifts", shifts.join(","));

      const url = `${API_BASE_URL}${endpoint}?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const statsData = data.stats;
        setStats({
          totalOrders: statsData.total,
          running: statsData.inProgress,
          completed: statsData.completed,
          pending: statsData.stopped,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery, dateFrom, dateTo, processAreas, statuses, shifts]);

  const fetchProductionOrders = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const hasFilters =
          searchQuery ||
          dateFrom ||
          dateTo ||
          processAreas.length > 0 ||
          statuses.length > 0 ||
          shifts.length > 0;
        const endpoint = hasFilters
          ? "/api/production-orders/search"
          : "/api/production-orders";

        const params = new URLSearchParams({
          page: page,
          limit: pageSize,
        });

        if (page > 1 && totalRecordsRef.current > 0) {
          params.append("total", totalRecordsRef.current);
        }

        if (hasFilters) {
          if (searchQuery) params.append("searchQuery", searchQuery);
          if (dateFrom) params.append("dateFrom", dateFrom);
          if (dateTo) params.append("dateTo", dateTo);
          if (processAreas.length > 0) {
            params.append("processAreas", processAreas.join(","));
          }
          if (statuses.length > 0) {
            params.append("statuses", statuses.join(","));
          }
          if (shifts.length > 0) {
            params.append("shifts", shifts.join(","));
          }
        }

        const url = `${API_BASE_URL}${endpoint}?${params.toString()}`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setProductionOrders(data.data);
          totalRecordsRef.current = data.total;
          setTotalPages(data.totalPages || Math.ceil(data.total / pageSize));
          setCurrentPage(data.page || page);
        } else {
          console.error("Failed to fetch production orders:", res.status);
          setProductionOrders([]);
        }
      } catch (error) {
        console.error("Error fetching production orders:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, dateFrom, dateTo, processAreas, statuses, shifts],
  );

  const fetchFilterMetadata = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/production-orders/filters`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      setProcessAreaOptions(data.processAreas);
      setShiftOptions(data.shifts);
    }
  }, []);

  // Toggle multiselect dropdown
  const toggleProcessArea = () => {
    setOpenProcessArea(!openProcessArea);
  };

  const toggleStatus = () => {
    setOpenStatus(!openStatus);
  };

  const toggleShift = () => {
    setOpenShift(!openShift);
  };

  // Handle checkbox selection
  const handleProcessAreaChange = (area) => {
    if (processAreas.includes(area)) {
      setProcessAreas(processAreas.filter((a) => a !== area));
    } else {
      setProcessAreas([...processAreas, area]);
    }
    setCurrentPage(1);
  };

  const handleStatusChange = (status) => {
    if (statuses.includes(status)) {
      setStatuses(statuses.filter((s) => s !== status));
    } else {
      setStatuses([...statuses, status]);
    }
    setCurrentPage(1);
  };

  const handleShiftChange = (shift) => {
    if (shifts.includes(shift)) {
      setShifts(shifts.filter((s) => s !== shift));
    } else {
      setShifts([...shifts, shift]);
    }
    setCurrentPage(1);
  };

  // Select all functionality
  const handleSelectAllProcessArea = (checked) => {
    if (checked) {
      setProcessAreas([...processAreaOptions]);
    } else {
      setProcessAreas([]);
    }
    setCurrentPage(1);
  };

  const handleSelectAllStatus = (checked) => {
    if (checked) {
      const allStatuses = statusOptions.map((o) => o.value);
      setStatuses(allStatuses);
    } else {
      setStatuses([]);
    }
    setCurrentPage(1);
  };

  const handleSelectAllShift = (checked) => {
    if (checked) {
      setShifts([...shiftOptions]);
    } else {
      setShifts([]);
    }
    setCurrentPage(1);
  };

  // Pagination
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  // Refresh data
  const handleRefresh = () => {
    // Clear filters
    setSearchQuery("");

    // Reset dates to defaults
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDateFrom(yesterday.toISOString().split("T")[0]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDateTo(tomorrow.toISOString().split("T")[0]);

    setProcessAreas([]);
    setStatuses([]);
    setShifts([]);
    setCurrentPage(1);

    // Clear session storage
    sessionStorage.removeItem("po_searchQuery");
    sessionStorage.removeItem("po_dateFrom");
    sessionStorage.removeItem("po_dateTo");
    sessionStorage.removeItem("po_processAreas");
    sessionStorage.removeItem("po_statuses");
    sessionStorage.removeItem("po_shifts");
    sessionStorage.removeItem("po_currentPage");

    // Trigger refresh
    setRefreshKey((prev) => prev + 1);
  };

  // Persist filters to session storage
  useEffect(() => {
    sessionStorage.setItem("po_searchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("po_dateFrom", dateFrom);
  }, [dateFrom]);

  useEffect(() => {
    sessionStorage.setItem("po_dateTo", dateTo);
  }, [dateTo]);

  useEffect(() => {
    sessionStorage.setItem("po_processAreas", JSON.stringify(processAreas));
  }, [processAreas]);

  useEffect(() => {
    sessionStorage.setItem("po_statuses", JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    sessionStorage.setItem("po_shifts", JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    sessionStorage.setItem("po_viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    sessionStorage.setItem("po_currentPage", currentPage);
  }, [currentPage]);

  // Get truncated name with ellipsis if longer than 25 chars
  function getTruncatedName(name, maxLength = 100) {
    return name.length > maxLength
      ? name.substring(0, maxLength) + "..."
      : name;
  }

  // Get progress status based on status code
  function getProgressStatus(status) {
    switch (status) {
      case 0:
        return "cancelled"; // Error/Cancelled
      case 1:
        return "running"; // Running/In Progress
      case 2:
        return "completing"; // Completed
      case -1:
        return "pending"; // Pending
      default:
        return "stop";
    }
  }

  // Render progress bar HTML based on CurrentBatch and TotalBatches
  function renderProgressBar(currentBatch, totalBatches, progressStatus) {
    // Convert to integers
    const current = parseInt(currentBatch) || 0;
    const total = parseInt(totalBatches) || 0;

    // Calculate progress percentage
    const progress = total === 0 ? 0 : Math.round((current / total) * 100);

    const progressGradient =
      progressStatus === "running"
        ? "linear-gradient(90deg, #ffa726 0%, #f57c00 100%)"
        : progressStatus === "stop"
          ? "linear-gradient(90deg, #bdbdbd 0%, #9e9e9e 100%)"
          : progressStatus === "cancelled"
            ? "linear-gradient(90deg, #389cf7 0%, #389cf9 100%)"
            : progressStatus === "completing"
              ? "linear-gradient(90deg, #26a69a 0%, #009688 100%)"
              : "linear-gradient(90deg, #bdbdbd 0%, #9e9e9e 100%)"; // pending

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "white",
            minWidth: "32px",
            background: progressGradient,
            padding: "2px 8px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          {progress}%
        </span>
        <span style={{ fontSize: "12px", color: "#666" }}>
          {current}/{total}
        </span>
      </div>
    );
  }

  function getStatusIcon(statusType) {
    switch (statusType) {
      case "pending":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="white"
            style={{ flexShrink: 0 }}
          >
            <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z" />
          </svg>
        );

      case "success":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="white"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0zm-1.2 17.2l-4-4 1.6-1.6 2.4 2.4 4.8-4.8 1.6 1.6z" />
          </svg>
        );

      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="white"
            style={{ flexShrink: 0 }}
          >
            <path d="M6 4v16l12-8z" />
          </svg>
        );
    }
  }

  // Determine status type based on status code/text
  function getStatusType(status) {
    if (!status && status !== 0) return "warning";

    // Handle numeric status codes
    if (typeof status === "number") {
      switch (status) {
        case 0:
          return "pending"; // Failed/Error
        case 1:
          return "warning"; // Running/In Progress
        case 2:
          return "success"; // Completed
        default:
          return "warning";
      }
    }

    // Handle text status
    const text = String(status).toLowerCase();
    if (text.includes("completed") || text.includes("hoàn thành"))
      return "success";
    if (
      text.includes("failed") ||
      text.includes("pending") ||
      text.includes("lỗi")
    )
      return "pending";
    return "warning";
  }

  // Get status text based on status code
  function getStatusText(status) {
    if (typeof status === "number") {
      switch (status) {
        case 1:
          return "Đang chạy";
        default:
          return "Đang chờ";
      }
    }
    return String(status);
  }

  function formatDate(dateString) {
    if (!dateString) return "";

    // Chỉ lấy phần ngày
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-");

    if (!year || !month || !day) return dateString;

    return `${day}/${month}/${year}`;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-multiselect")) {
        setOpenProcessArea(false);
        setOpenStatus(false);
        setOpenShift(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await fetchStats(); // Stats likely depend on filters, which are captured in scope of fetchStats
      await fetchFilterMetadata();
      await fetchProductionOrders(currentPage);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    fetchStats,
    fetchFilterMetadata,
    fetchProductionOrders,
    refreshKey,
    currentPage,
  ]);

  // Derive options from production orders if empty
  useEffect(() => {
    if (productionOrders.length > 0) {
      if (processAreaOptions.length === 0) {
        const processAreasSet = new Set();
        productionOrders.forEach((order) => {
          if (order.ProcessArea && order.ProcessArea.trim() !== "") {
            processAreasSet.add(order.ProcessArea);
          }
        });
        if (processAreasSet.size > 0)
          setProcessAreaOptions(Array.from(processAreasSet).sort());
      }

      if (shiftOptions.length === 0) {
        const shiftsSet = new Set();
        productionOrders.forEach((order) => {
          if (order.Shift && order.Shift.trim() !== "") {
            shiftsSet.add(order.Shift);
          }
        });
        if (shiftsSet.size > 0) setShiftOptions(Array.from(shiftsSet).sort());
      }
    }
  }, [productionOrders, processAreaOptions.length, shiftOptions.length]);

  useEffect(() => {}, [shifts, processAreas, statuses]);

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
            to="/production-orders"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Lệnh Sản xuất
          </Link>
          <span className="separator">&gt;</span>
          <span id="material-source-code">{PLANTCODE}</span>
          <span className="separator">&gt;</span>
          <span id="material-destination-code">{LINE}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="main-container">
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
                  <h1>Giám sát lệnh sản xuất</h1>
                  <p>Tổng quan thời gian thực về các đơn hàng sản xuất</p>
                </div>
              </div>
              <div className="badge-cs1">{LINE}</div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span>Tổng Lệnh SX (PO)</span>
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
              <div className="stat-number" id="kvsx-stat">
                {stats.totalOrders}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span>Đang chạy</span>
                <div className="stat-icon" id="progress-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#fe9d1e"
                  >
                    <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
                  </svg>
                </div>
              </div>
              <div className="stat-number" id="total-po-stat">
                {stats.running}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span>Hoàn thành</span>
                <div className="stat-icon" id="completed-icon">
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ color: "#47b54d" }}
                  ></i>
                </div>
              </div>
              <div className="stat-number" id="in-progress-stat">
                {stats.completed}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span>Đang chờ</span>
                <div className="stat-icon" id="stopped-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#2a5fc0"
                  >
                    <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z" />
                  </svg>
                </div>
              </div>
              <div className="stat-number" id="stopped-stat">
                {stats.pending}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-section">
          <div className="first-search-section">
            <div className="search-bar">
              <i className="fa-solid fa-search"></i>
              <input
                type="text"
                id="searchInput"
                placeholder="Tìm kiếm Lệnh SX, Mã sản phẩm..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
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
                <label style={{ fontWeight: 500, color: "#666" }}>
                  Từ ngày:
                </label>
                <input
                  type="date"
                  id="dateFrom"
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
                <label style={{ fontWeight: 500, color: "#666" }}>
                  Đến ngày:
                </label>
                <input
                  type="date"
                  id="dateTo"
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
          </div>
          <div className="second-search-section">
            <div
              style={{
                paddingLeft: "20px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              {/* Process Area Multiselect */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: 500, color: "#666" }}>
                  Process Area:
                </label>
                <div
                  className="custom-multiselect"
                  style={{ position: "relative", minWidth: "220px" }}
                >
                  <div
                    className="multiselect-input"
                    id="processAreaInput"
                    onClick={toggleProcessArea}
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
                      id="processAreaSelectedText"
                      style={{
                        color: processAreas.length > 0 ? "#333" : "#999",
                      }}
                    >
                      {processAreas.length > 0
                        ? `${processAreas.length} selected`
                        : "Select process areas..."}
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
                  {openProcessArea && (
                    <div
                      className="multiselect-dropdown"
                      id="processAreaDropdown"
                      style={{
                        display: "block",
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
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          <input
                            type="checkbox"
                            id="processAreaSelectAll"
                            checked={
                              processAreas.length === processAreaOptions.length
                            }
                            onChange={(e) =>
                              handleSelectAllProcessArea(e.target.checked)
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <span>[Select all]</span>
                        </label>
                      </div>
                      <div id="processAreaOptions" style={{ padding: "4px" }}>
                        {processAreaOptions.map((area) => (
                          <label
                            key={area}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 8px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={processAreas.includes(area)}
                              onChange={() => handleProcessAreaChange(area)}
                              style={{ cursor: "pointer" }}
                            />
                            <span>{area}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Multiselect */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: 500, color: "#666" }}>
                  Status:
                </label>
                <div
                  className="custom-multiselect"
                  style={{ position: "relative", minWidth: "220px" }}
                >
                  <div
                    className="multiselect-input"
                    id="statusInput"
                    onClick={toggleStatus}
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
                      id="statusSelectedText"
                      style={{ color: statuses.length > 0 ? "#333" : "#999" }}
                    >
                      {statuses.length > 0
                        ? `${statuses.length} selected`
                        : "Select statuses..."}
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
                  {openStatus && (
                    <div
                      className="multiselect-dropdown"
                      id="statusDropdown"
                      style={{
                        display: "block",
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
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          <input
                            type="checkbox"
                            id="statusSelectAll"
                            checked={statuses.length === statusOptions.length}
                            onChange={(e) =>
                              handleSelectAllStatus(e.target.checked)
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <span>[Select all]</span>
                        </label>
                      </div>
                      <div id="statusOptions" style={{ padding: "4px" }}>
                        {statusOptions.map((status) => (
                          <label
                            key={status.value}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 8px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={statuses.includes(status.value)}
                              onChange={() => handleStatusChange(status.value)}
                              style={{ cursor: "pointer" }}
                            />
                            <span>{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shift Multiselect */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: 500, color: "#666" }}>Shift:</label>
                <div
                  className="custom-multiselect"
                  style={{ position: "relative", minWidth: "220px" }}
                >
                  <div
                    className="multiselect-input"
                    id="shiftInput"
                    onClick={toggleShift}
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
                      id="shiftSelectedText"
                      style={{ color: shifts.length > 0 ? "#333" : "#999" }}
                    >
                      {shifts.length > 0
                        ? `${shifts.length} selected`
                        : "Select shifts..."}
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
                  {openShift && (
                    <div
                      className="multiselect-dropdown"
                      id="shiftDropdown"
                      style={{
                        display: "block",
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
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          <input
                            type="checkbox"
                            id="shiftSelectAll"
                            checked={shifts.length === shiftOptions.length}
                            onChange={(e) =>
                              handleSelectAllShift(e.target.checked)
                            }
                            style={{ cursor: "pointer" }}
                          />
                          <span>[Select all]</span>
                        </label>
                      </div>
                      <div id="shiftOptions" style={{ padding: "4px" }}>
                        {shiftOptions.map((shift) => (
                          <label
                            key={shift}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 8px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={shifts.includes(shift)}
                              onChange={() => handleShiftChange(shift)}
                              style={{ cursor: "pointer" }}
                            />
                            <span>{shift}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="view-controls">
              <button
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Danh sách"
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
                onClick={() => setViewMode("grid")}
                title="Lưới"
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
              <button className="refresh-btn" onClick={handleRefresh}>
                <i className="fa-solid fa-rotate-right"></i>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">
          {viewMode === "table" && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Lệnh SX</th>
                  <th>Sản Phẩm</th>
                  <th style={{ textAlign: "center" }}>Dây chuyền</th>
                  <th>Công thức</th>
                  <th>Lô SX</th>
                  <th>Process Area</th>
                  <th>Shift</th>
                  <th style={{ textAlign: "center" }}>
                    Ngày Bắt Đầu / Số Lượng
                  </th>
                  <th style={{ textAlign: "center" }}>Tiến độ</th>
                  <th style={{ textAlign: "center" }}>Trạng Thái</th>
                  <th style={{ textAlign: "center" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody id="orderTableBody">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="11"
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
                  productionOrders.map((order, index) => (
                    <tr key={index}>
                      <td>
                        <a
                          href={`/production-order-detail/${order.ProductionOrderId}`}
                          className="area-badge-link"
                          title="Xem chi tiết Batch"
                          // onClick="saveCurrentState()"
                        >
                          <div className="area-badge">
                            <div>{order.ProductionOrderNumber}</div>
                          </div>
                        </a>
                      </td>
                      <td>{getTruncatedName(order.ProductCode || "")}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="badge-number">
                          {order.ProductionLine}
                        </span>
                      </td>
                      <td>{order.RecipeCode}</td>
                      <td>{order.LotNumber || "N/A"}</td>
                      <td style={{ textAlign: "center" }}>
                        {order.ProcessArea || "N/A"}
                      </td>
                      <td>{order.Shift || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {formatDate(order.PlannedStart) || "N/A"}
                        </div>
                        {order.Quantity || 0} {order.UnitOfMeasurement || ""}
                      </td>
                      <td>
                        {renderProgressBar(
                          order.CurrentBatch,
                          order.TotalBatches,
                          getProgressStatus(order.Status),
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`status-badge status-${getStatusType(
                            order.Status,
                          )}`}
                        >
                          {getStatusIcon(getStatusType(order.Status))}
                          {getStatusText(order.Status)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="action-view-btn"
                            title="Xem chi tiết"
                            onClick={() => handleViewOrder(order)}
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

          {viewMode === "grid" && (
            <div className="grid-container">
              {isLoading ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  <i
                    className="fa-solid fa-spinner fa-spin"
                    style={{ fontSize: "32px", color: "#6259ee" }}
                  ></i>
                  <span style={{ fontSize: "16px", color: "#666" }}>
                    Đang tải dữ liệu...
                  </span>
                </div>
              ) : (
                productionOrders.map((order, index) => (
                  <div key={index}>
                    <div className="grid-card">
                      <div className="grid-card-top">
                        <a
                          href={`/production-order-detail/${order.ProductionOrderId}`}
                          className="area-badge-link"
                          title="Xem chi tiết Batch"
                        >
                          <h3
                            style={{ color: "#5b4ce8" }}
                            title={order.ProductionOrderNumber || ""}
                          >
                            {getTruncatedName(
                              order.ProductionOrderNumber || "",
                              30,
                            )}
                          </h3>
                        </a>
                        <span
                          className={`status-badge status-${getStatusType(
                            order.Status,
                          )}`}
                        >
                          {getStatusIcon(getStatusType(order.Status))}
                          {getStatusText(order.Status)}
                        </span>
                      </div>

                      <div className="grid-card-body">
                        <div className="grid-item">
                          <div>
                            Product Code:{" "}
                            <span className="grid-label">
                              {order.ProductCode || "N/A"}
                            </span>
                          </div>
                          <div className="grid-value">
                            {order.Quantity || 0}
                            {order.UnitOfMeasurement || ""}
                          </div>
                        </div>

                        <div className="grid-section">
                          <div className="grid-section-label">CÔNG THỨC</div>
                          <div className="grid-section-content">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="red"
                            >
                              <path d="M15 2a1 1 0 0 1 0 2v4.826l3.932 10.814l.034 .077a1.7 1.7 0 0 1 -.002 1.193l-.07 .162a1.7 1.7 0 0 1 -1.213 .911l-.181 .017h-11l-.181 -.017a1.7 1.7 0 0 1 -1.285 -2.266l.039 -.09l3.927 -10.804v-4.823a1 1 0 1 1 0 -2h6zm-2 2h-2v4h2v-4z" />
                            </svg>
                            <span className="recipe-badge">
                              {order.RecipeCode || "N/A"}
                            </span>
                            <span className="recipe-tag">
                              {order.RecipeVersion || ""}
                            </span>
                          </div>
                        </div>

                        <div className="grid-section-2">
                          <div className="grid-section-label">LÔ SX</div>
                          <div className="grid-section-value">
                            {order.LotNumber || "0 / 0"}
                          </div>
                        </div>

                        <div className="grid-section-2">
                          <div className="grid-section-label">Ca</div>
                          <div className="grid-section-value">
                            {order.Shift || "-"}
                          </div>
                        </div>

                        <div className="grid-section-2">
                          <div className="grid-section-label">Process Area</div>
                          <div className="grid-section-value">
                            {order.ProcessArea || "N/A"}
                          </div>
                        </div>

                        <div className="grid-section-2">
                          <div className="grid-section-label">
                            Batch hiện tại
                          </div>
                          <div className="grid-section-value">
                            {order.CurrentBatch !== null &&
                            order.CurrentBatch !== undefined
                              ? order.CurrentBatch
                              : "N/A"}
                          </div>
                        </div>

                        <div className="grid-section">
                          <div className="grid-section-label">LỊCH TRÌNH</div>
                          <div className="grid-schedule">
                            <span className="schedule-start">
                              {formatDate(order.PlannedStart) || "N/A"}
                            </span>
                            <span className="schedule-end">
                              Hạn: {formatDate(order.PlannedEnd) || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="grid-section">
                          <div className="grid-section-label">TIẾN ĐỘ</div>
                          <div className="grid-progress">
                            <div
                              className="progress-bar"
                              style={{
                                width: `${Math.round(
                                  ((parseInt(order.CurrentBatch) || 0) /
                                    (parseInt(order.TotalBatches) || 1)) *
                                    100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <div className="progress-text">
                            {Math.round(
                              ((parseInt(order.CurrentBatch) || 0) /
                                (parseInt(order.TotalBatches) || 1)) *
                                100,
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      <div className="grid-card-footer">
                        <button
                          className="action-btn-grid-primary"
                          onClick={() => handleViewOrder(order)}
                        >
                          Xem Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button
              id="prevPageBtn"
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
            <span id="pageInfo" className="page-info">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              id="nextPageBtn"
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

      {/* View Production Order Modal */}
      {showViewModal && (
        <div id="viewModal" className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Chi tiết Lệnh Sản Xuất</h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-field">
                  <label>Mã Lệnh SX</label>
                  <p id="viewOrderNumber">
                    {selectedOrder?.ProductionOrderNumber || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Mã Sản Phẩm</label>
                  <p id="viewProductCode">
                    {selectedOrder?.ProductCode || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Dây chuyền</label>
                  <p id="viewProductionLine">
                    {selectedOrder?.ProductionLine || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Công thức</label>
                  <p id="viewRecipeCode">{selectedOrder?.RecipeCode || "-"}</p>
                </div>
                <div className="modal-field">
                  <label>Phiên bản Công thức</label>
                  <p id="viewRecipeVersion">
                    {selectedOrder?.RecipeVersion || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Lô SX</label>
                  <p id="viewLotNumber">{selectedOrder?.LotNumber || "-"}</p>
                </div>
                <div className="modal-field">
                  <label>Số lượng</label>
                  <p id="viewQuantity">{selectedOrder?.Quantity || "-"}</p>
                </div>
                <div className="modal-field">
                  <label>Đơn vị</label>
                  <p id="viewUnitOfMeasurement">
                    {selectedOrder?.UnitOfMeasurement || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Ngày bắt đầu</label>
                  <p id="viewPlannedStart">
                    {selectedOrder?.PlannedStart || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Ngày kết thúc</label>
                  <p id="viewPlannedEnd">{selectedOrder?.PlannedEnd || "-"}</p>
                </div>
                <div className="modal-field">
                  <label>Ca làm</label>
                  <p id="viewShift">{selectedOrder?.Shift || "-"}</p>
                </div>
                <div className="modal-field">
                  <label>Batch hiện tại</label>
                  <p id="viewCurrentBatch">
                    {selectedOrder?.CurrentBatch || 0}/
                    {selectedOrder?.TotalBatches || 0}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Tiến độ</label>
                  <p id="viewProgress">
                    {Math.round(
                      ((parseInt(selectedOrder.CurrentBatch) || 0) /
                        (parseInt(selectedOrder.TotalBatches) || 1)) *
                        100,
                    )}{" "}
                    %
                  </p>
                </div>
                <div className="modal-field">
                  <label>Trạng thái</label>
                  <p id="viewStatus">
                    {getStatusText(selectedOrder?.Status) || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Plant</label>
                  <p id="viewPlant">{selectedOrder?.Plant || "-"}</p>
                </div>
                <div className="modal-field">
                  <label>Process Area</label>
                  <p id="viewProcessArea">
                    {selectedOrder?.ProcessArea || "-"}
                  </p>
                </div>
                <div className="modal-field">
                  <label>Shop Floor</label>
                  <p id="viewShopfloor">{selectedOrder?.Shopfloor || "-"}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
