export default function MaterialsPage() {
  const LINE = import.meta.env.LINE || "CS1";

  return (
    <>
      <div className="topBar">
        <a href="/" className="nav-left">
          <i className="fa-solid fa-home"></i>
          <span>DashBoard</span>
        </a>
        <div className="nav-breadcrumb">
          <a
            href="/materials"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Nguyên vật liệu
          </a>
        </div>
      </div>

      <div className="main-container">
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
                0
              </div>
            </div>
          </div>
        </div>

        <div className="search-section">
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
                    style={{ color: "#999" }}
                  >
                    Select production orders...
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
                    display: "none",
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
                        style={{ cursor: "pointer" }}
                      />
                      <span>[Select all]</span>
                    </label>
                  </div>
                  <div id="poOptions" style={{ padding: "4px" }}></div>
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
                      style={{ color: "#999" }}
                    >
                      Select batches...
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
                      display: "none",
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
                          style={{ cursor: "pointer" }}
                        />
                        <span>[Select all]</span>
                      </label>
                    </div>
                    <div id="batchOptions" style={{ padding: "4px" }}></div>
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
                      style={{ color: "#999" }}
                    >
                      Select ingredients...
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
                      display: "none",
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
                          style={{ cursor: "pointer" }}
                        />
                        <span>[Select all]</span>
                      </label>
                    </div>
                    <div
                      id="ingredientOptions"
                      style={{ padding: "4px" }}
                    ></div>
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
                      style={{ color: "#999" }}
                    >
                      Select results...
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
                      display: "none",
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
                          style={{ cursor: "pointer" }}
                        />
                        <span>[Select all]</span>
                      </label>
                    </div>
                    <div id="resultOptions" style={{ padding: "4px" }}></div>
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
                className="view-btn active"
                data-view="table"
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
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 6l16 0" />
                  <path d="M4 12l16 0" />
                  <path d="M4 18l16 0" />
                </svg>
              </button>
              <button className="view-btn" data-view="grid" title="Lưới">
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
              <button className="refresh-btn">
                <i className="fa-solid fa-rotate-right"></i>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        <div className="table-section">
          <div
            id="materialsGrid"
            style={{ display: "none", padding: "16px 16px 0 16px" }}
          ></div>

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
            <tbody id="materialsTableBody"></tbody>
          </table>

          <div className="pagination-controls">
            <button
              id="materialsPrevPageBtn"
              className="pagination-btn"
              onclick="materialsPrevPage()"
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
              Trang 1 / 1
            </span>
            <button
              id="materialsNextPageBtn"
              className="pagination-btn"
              onclick="materialsNextPage()"
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

      <div
        id="materialModal"
        style={{
          display: "none",
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
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
                -
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
