import { useEffect } from "react";

export default function ProductsPage() {
  useEffect(() => {
    // Logic JS cũ (production_products.js) sẽ migrate sau
  }, []);

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
            href="/products"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Sản Phẩm
          </a>
        </div>
      </div>

      {/* Main Container */}
      <div className="main-container-product">
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
                  <path d="M11.132 2.504l-4 7a1 1 0 0 0 .868 1.496h8a1 1 0 0 0 .868 -1.496l-4 -7a1 1 0 0 0 -1.736 0z" />
                  <path d="M17 13a4 4 0 1 1 -3.995 4.2l-.005 -.2l.005 -.2a4 4 0 0 1 3.995 -3.8z" />
                  <path d="M9 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z" />
                </svg>

                <div className="header-text">
                  <h1>Danh Mục Sản Phẩm</h1>
                  <p>Quản lý dữ liệu chính sản phẩm và quy đổi đơn vị</p>
                </div>
              </div>

              <div className="badge-cs1">{import.meta.env.VITE_LINE}</div>
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
              <div className="stat-number" id="totalProducts">
                2
              </div>
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
              <div className="stat-number" id="activeProducts">
                2
              </div>
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
              <div className="stat-number" id="totalTypes&Categories">
                2 / 3
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
              <div className="stat-number" id="totalGroups">
                0
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="search-section-product">
          <div className="search-bar">
            <i className="fa-solid fa-search"></i>
            <input
              type="text"
              id="searchInput"
              placeholder="Tìm theo mã, tên, nhóm..."
            />
          </div>

          <div className="view-controls-product">
            <button className="view-btn-product active" id="tableViewBtn">
              ≡
            </button>
            <button className="view-btn-product" id="gridViewBtn">
              ▦
            </button>

            <button className="refresh-btn">
              <i className="fa-solid fa-rotate-right"></i>
              Làm mới
            </button>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid-view" id="gridView"></div>

        {/* Table View */}
        <div className="table-section" id="tableView">
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
            <tbody id="productTableBody"></tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-section">
          <div className="pagination-controls">
            <button className="pagination-btn">‹</button>
            <span className="page-info">Trang 1 / 1</span>
            <button className="pagination-btn">›</button>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <div
        id="productDetailModal"
        style={{
          display: "none",
          position: "fixed",
          zIndex: 9999,
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          id="productDetailBody"
          style={{
            background: "#fff",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90vw",
            margin: "40px auto",
            padding: "32px 24px",
            boxShadow: "0 2px 24px #0002",
            position: "relative",
          }}
        ></div>
      </div>
    </>
  );
}
