import { useEffect } from "react";

export default function RecipesPage() {
  useEffect(() => {}, []);

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
      <div className="main-container">
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

              <div className="badge-cs1">{import.meta.env.VITE_LINE}</div>
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
              <div className="stat-number" id="totalRecipes">
                2
              </div>
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
              <div className="stat-number" id="activeRecipes">
                2
              </div>
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
              <div className="stat-number" id="totalVersions">
                2
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-section">
          <div className="search-bar">
            <i className="fa-solid fa-search"></i>
            <input
              type="text"
              id="searchInput"
              placeholder="Tìm kiếm Mã công thức, Tên sản phẩm..."
            />
          </div>

          <div className="view-controls">
            <button className="view-btn" id="tableViewBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#6259ee">
                <rect x="3" y="4" width="18" height="3" rx="1.5" />
                <rect x="3" y="10.5" width="18" height="3" rx="1.5" />
                <rect x="3" y="17" width="18" height="3" rx="1.5" />
              </svg>
            </button>

            <button className="view-btn active" id="gridViewBtn">
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
            >
              <div
                id="statusInput"
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
              >
                <span id="statusSelectedText" style={{ color: "#999" }}>
                  Select statuses...
                </span>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ color: "#666" }}
                ></i>
              </div>

              <div
                id="statusDropdown"
                className="multiselect-dropdown"
                style={{
                  position: "absolute",
                  top: "105%",
                  left: 0,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  padding: "8px",
                  width: "220px",
                  display: "none",
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
                  <input type="checkbox" id="statusSelectAll" />
                  <span style={{ fontWeight: 600 }}>[Select all]</span>
                </label>

                <div id="statusOptions"></div>
              </div>
            </div>

            <button className="refresh-btn">
              <i className="fa-solid fa-rotate-right"></i>
              Làm mới
            </button>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid-view" id="gridView"></div>

        {/* Table View */}
        <div
          className="table-section"
          id="tableView"
          style={{ display: "none" }}
        >
          <table className="data-table">
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
            <tbody id="recipeTableBody"></tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-section">
          <div className="pagination-controls">
            <button id="prevPageBtn" className="pagination-btn">
              ‹
            </button>
            <span id="pageInfo" className="page-info">
              Trang 1 / 1
            </span>
            <button id="nextPageBtn" className="pagination-btn">
              ›
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
