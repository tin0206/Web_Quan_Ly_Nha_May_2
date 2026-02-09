import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function RecipeDetailPage() {
  const { recipeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    recipe: {},
    processes: [],
    ingredients: [],
    products: [],
    byProducts: [],
    parameters: [],
  });

  const [viewMode, setViewMode] = useState("all");
  const [selectedFilterIds, setSelectedFilterIds] = useState([]);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    loading: false,
    error: null,
    productData: null,
  });

  const fetchRecipeDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/production-recipe-detail/${recipeId}`,
      );
      if (!res.ok) throw new Error("Không tìm thấy công thức");
      const jsonData = await res.json();
      setData({
        recipe: jsonData.recipe || {},
        processes: jsonData.processes || [],
        ingredients: jsonData.ingredients || [],
        products: jsonData.products || [],
        byProducts: jsonData.byProducts || [],
        parameters: jsonData.parameters || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  const fetchProductDetail = async (productCode) => {
    try {
      setModal((prev) => ({
        ...prev,
        isOpen: true,
        loading: true,
        error: null,
        productData: null,
      }));
      const res = await fetch(
        `${API_BASE_URL}/api/production-products/${productCode}`,
      );
      if (!res.ok) throw new Error("Không lấy được thông tin sản phẩm");
      const product = await res.json();
      setModal((prev) => ({ ...prev, loading: false, productData: product }));
    } catch (err) {
      setModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Lỗi khi mở chi tiết sản phẩm",
      }));
    }
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return dateString;
    const [year, month, day] = datePart.split("-");
    const [hours, minutes, seconds] = timePart.replace("Z", "").split(":");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleProcessBtnClick = (processId) => {
    setViewMode(processId || "all");
    setActiveTab("ingredients");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleFilterSelect = (procId) => {
    const strId = String(procId);
    setSelectedFilterIds((prev) => {
      if (prev.includes(strId)) {
        return prev.filter((id) => id !== strId);
      } else {
        return [...prev, strId];
      }
    });
  };

  const handleFilterSelectAll = () => {
    setSelectedFilterIds([]);
  };

  // --- Helpers ---

  const getFilteredProcessesWithIndex = () => {
    const all = data.processes.map((p, idx) => ({ p, idx }));
    if (viewMode === "all") {
      if (selectedFilterIds.length === 0) return all;
      return all.filter(({ p }) =>
        selectedFilterIds.includes(String(p.ProcessId)),
      );
    } else {
      return all.filter(({ p }) => String(p.ProcessId) === viewMode);
    }
  };

  const getFilteredItems = (collection, processKey = "ProcessId") => {
    if (viewMode !== "all") {
      return collection.filter((item) => String(item[processKey]) === viewMode);
    }
    if (selectedFilterIds.length === 0) return collection;
    return collection.filter((item) =>
      selectedFilterIds.includes(String(item[processKey])),
    );
  };

  useEffect(() => {
    document.title = `Chi tiết Công thức #${recipeId}`;

    // Click outside listener for dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    fetchRecipeDetail();

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [recipeId, fetchRecipeDetail]);

  if (loading)
    return (
      <div className="main-container" style={{ padding: "20px" }}>
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="main-container" style={{ padding: "20px", color: "red" }}>
        Error: {error}
      </div>
    );

  return (
    <div className="main-container">
      {/* Header */}
      <div className="header-container">
        <Link className="back-btn" to="/recipes">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div className="header-text">
          <h1>Recipe Detail</h1>
          <p>
            ID: <strong>{recipeId}</strong>
          </p>
        </div>
      </div>

      {/* Recipe Details Card */}
      <div
        id="recipeDetails"
        style={{ display: "block", marginBottom: "30px" }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "20px",
              textAlign: "left",
            }}
          >
            <DetailItem label="Mã Công Thức" value={data.recipe.RecipeCode} />
            <DetailItem label="Tên Công Thức" value={data.recipe.RecipeName} />
            <DetailItem label="Phiên Bản" value={data.recipe.Version} />
            <DetailItem label="Trạng Thái" value={data.recipe.RecipeStatus} />
            <DetailItem
              label="Cập Nhật"
              value={formatDateTime(data.recipe.timestamp)}
            />
            <DetailItem label="Mã Sản Phẩm" value={data.recipe.ProductCode} />
            <DetailItem label="Tên Sản Phẩm" value={data.recipe.ProductName} />
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div id="RecipeProcesses" style={{ width: "100%" }}>
        <h2 style={{ marginBottom: "16px" }}>Processes:</h2>
        <div
          style={{ display: "flex", flexWrap: "wrap", marginBottom: "12px" }}
        >
          <button
            onClick={() => handleProcessBtnClick("all")}
            className={`process-btn ${viewMode === "all" ? "active" : ""}`}
            style={{
              margin: "0 8px 8px 0",
              padding: "8px 18px",
              borderRadius: "6px",
              border: "1px solid #6259ee",
              background: viewMode === "all" ? "#d1d1ff" : "#f6f6ff",
              color: "#6259ee",
              cursor: "pointer",
            }}
          >
            Tất cả
          </button>
          {data.processes.map((p, idx) => (
            <button
              key={p.ProcessId || idx}
              onClick={() => handleProcessBtnClick(String(p.ProcessId))}
              className={`process-btn ${viewMode === String(p.ProcessId) ? "active" : ""}`}
              style={{
                margin: "0 8px 8px 0",
                padding: "8px 18px",
                borderRadius: "6px",
                border: "1px solid #6259ee",
                background:
                  viewMode === String(p.ProcessId) ? "#d1d1ff" : "#f6f6ff",
                color: "#6259ee",
                cursor: "pointer",
              }}
            >
              {p.ProcessId}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top: Process Info Cards */}
          <div style={{ flex: "0 0 auto", minHeight: "220px" }}>
            {viewMode === "all" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  gap: "12px",
                  overflowX: "auto",
                  overflowY: "hidden",
                  paddingBottom: "8px",
                }}
              >
                {getFilteredProcessesWithIndex().map(({ p: process, idx }) => {
                  const product = data.products[idx];
                  return (
                    <div
                      key={process.ProcessId}
                      style={{
                        flex: "0 0 auto",
                        minWidth: "320px",
                        margin: "0 0 8px 0",
                        padding: "16px 24px",
                        background: "#fff",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        minHeight: "180px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <h3 style={{ marginBottom: "10px" }}>
                        Process:{" "}
                        <span style={{ color: "#6259ee" }}>
                          {process.ProcessId}
                        </span>
                      </h3>
                      <div>
                        <b>Process Code:</b> {process.ProcessCode || "-"}
                      </div>
                      <div>
                        <b>Process Name:</b> {process.ProcessName || "-"}
                      </div>
                      <div>
                        <b>Duration:</b> {process.Duration ?? "-"}
                      </div>
                      <div>
                        <b>Duration UoM:</b> {process.DurationUoM || "N/A"}
                      </div>

                      <div style={{ marginTop: "12px" }}>
                        <b>Product ID:</b> {product?.ProductId || "-"}
                      </div>
                      <div>
                        <b>Product Code:</b> {product?.ProductCode || "-"}
                      </div>
                      <div>
                        <b>Product Name:</b> {product?.ItemName || "-"}
                      </div>
                      <div>
                        <b>Plan Quantity:</b> {product?.PlanQuantity || "-"}{" "}
                        {product?.UnitOfMeasurement || ""}
                      </div>
                      {product?.ProductId && (
                        <div style={{ marginTop: "8px" }}>
                          <button
                            onClick={() =>
                              fetchProductDetail(product.ProductCode)
                            }
                            style={buttonStyle}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single View
              (() => {
                const processIndex = data.processes.findIndex(
                  (p) => String(p.ProcessId) === viewMode,
                );
                const process = data.processes[processIndex];
                const product = data.products[processIndex];
                if (!process) return null;

                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        ...cardStyle,
                        minHeight: "180px",
                        justifyContent: "center",
                      }}
                    >
                      <h3 style={{ marginBottom: "10px" }}>
                        Process:{" "}
                        <span style={{ color: "#6259ee" }}>
                          {process.ProcessId}
                        </span>
                      </h3>
                      <div>
                        <b>Process Code:</b> {process.ProcessCode || "-"}
                      </div>
                      <div>
                        <b>Process Name:</b> {process.ProcessName || "-"}
                      </div>
                      <div>
                        <b>Duration:</b>{" "}
                        {process.Duration === null ? "-" : process.Duration}
                      </div>
                      <div>
                        <b>Duration UoM:</b>{" "}
                        {process.DurationUoM === ""
                          ? "N/A"
                          : process.DurationUoM}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, minHeight: "100px" }}>
                      <div>
                        <b>Product ID:</b> {product ? product.ProductId : "-"}
                      </div>
                      <div>
                        <b>Product Code:</b>{" "}
                        {product ? product.ProductCode : "-"}
                      </div>
                      <div>
                        <b>Product Name:</b> {product ? product.ItemName : "-"}
                      </div>
                      <div>
                        <b>Plan Quantity:</b>{" "}
                        {product ? product.PlanQuantity : "-"}{" "}
                        {product ? product.UnitOfMeasurement : ""}
                      </div>
                      {product?.ProductId && (
                        <div style={{ marginTop: "8px" }}>
                          <button
                            onClick={() =>
                              fetchProductDetail(product.ProductCode)
                            }
                            style={buttonStyle}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Bottom: Detailed Tabs */}
          <div
            style={{
              flex: 1,
              minHeight: "180px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              {/* Filter Dropdown (Only for All View) */}
              {viewMode === "all" && (
                <div
                  className="custom-multiselect"
                  ref={dropdownRef}
                  style={{ position: "relative", maxWidth: "320px" }}
                >
                  <div
                    onClick={toggleDropdown}
                    style={{
                      width: "200px",
                      height: "33px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #6259ee",
                      background: "#f6f6ff",
                      color: "#6259ee",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: selectedFilterIds.length === 0 ? "#999" : "#333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedFilterIds.length === 0
                        ? "Select processes..."
                        : selectedFilterIds.length > 4
                          ? `${selectedFilterIds.length} selected`
                          : selectedFilterIds.join(", ")}
                    </span>
                    <span style={{ fontSize: "12px", color: "#6259ee" }}>
                      ▼
                    </span>
                  </div>

                  {dropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "44px",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        zIndex: 10,
                        padding: "8px",
                        maxHeight: "240px",
                        overflow: "auto",
                      }}
                    >
                      <label style={dropdownItemExStyle}>
                        <input
                          type="checkbox"
                          checked={selectedFilterIds.length === 0}
                          onChange={handleFilterSelectAll}
                          style={{ cursor: "pointer" }}
                        />
                        <span>Chọn tất cả</span>
                      </label>
                      {data.processes.map((p) => (
                        <label key={p.ProcessId} style={dropdownItemExStyle}>
                          <input
                            type="checkbox"
                            checked={selectedFilterIds.includes(
                              String(p.ProcessId),
                            )}
                            onChange={() => handleFilterSelect(p.ProcessId)}
                            style={{ cursor: "pointer" }}
                          />
                          <span>{p.ProcessId}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tabs */}
              {["ingredients", "byproducts", "parameters"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "1px solid #6259ee",
                    background: activeTab === tab ? "#d1d1ff" : "#f6f6ff",
                    color: "#6259ee",
                    cursor: "pointer",
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {tab === "byproducts"
                    ? "ByProducts"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div>
              {/* INGREDIENTS */}
              {activeTab === "ingredients" && (
                <IngredientTab
                  items={getFilteredItems(data.ingredients)}
                  viewMode={viewMode}
                  onDetail={fetchProductDetail}
                />
              )}
              {/* BYPRODUCTS */}
              {activeTab === "byproducts" && (
                <ByProductTab items={getFilteredItems(data.byProducts)} />
              )}
              {/* PARAMETERS */}
              {activeTab === "parameters" && (
                <ParameterTab items={getFilteredItems(data.parameters)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div
          style={{
            display: "flex",
            position: "fixed",
            zIndex: 1000,
            inset: 0,
            background: "rgba(0,0,0,.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "10px",
              boxShadow: "0 4px 24px rgba(0,0,0,.18)",
              position: "relative",
              maxWidth: "720px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "14px",
                fontSize: "28px",
                color: "#888",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              &times;
            </span>
            <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
              Chi tiết sản phẩm
            </h2>
            {modal.loading ? (
              <div>Đang tải...</div>
            ) : modal.error ? (
              <div style={{ color: "red" }}>{modal.error}</div>
            ) : modal.productData ? (
              <ProductDetailContent
                product={modal.productData}
                formatDateTime={formatDateTime}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub Components ---

function DetailItem({ label, value }) {
  return (
    <div>
      <label style={{ fontWeight: "bold", color: "#666" }}>{label}</label>
      <p style={{ margin: "5px 0", fontSize: "16px" }}>{value || "-"}</p>
    </div>
  );
}

function IngredientTab({ items, viewMode, onDetail }) {
  if (!items || items.length === 0)
    return <div style={{ marginTop: "12px" }}>Không có dữ liệu</div>;

  if (viewMode !== "all") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
          gap: "12px",
          marginTop: "8px",
        }}
      >
        {items.map((i, idx) => (
          <IngredientCard key={idx} item={i} onDetail={onDetail} />
        ))}
      </div>
    );
  }

  const groups = {};
  items.forEach((i) => {
    if (!groups[i.ProcessId]) groups[i.ProcessId] = [];
    groups[i.ProcessId].push(i);
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginTop: "8px",
      }}
    >
      {Object.entries(groups).map(([procId, groupItems]) => (
        <div
          key={procId}
          style={{
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0, color: "#6259ee" }}>Process: {procId}</h3>
            <span style={{ fontSize: "13px", color: "#777" }}>
              {groupItems.length} ingredient(s)
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
              gap: "12px",
            }}
          >
            {groupItems.map((i, idx) => (
              <IngredientCard key={idx} item={i} onDetail={onDetail} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function IngredientCard({ item, onDetail }) {
  return (
    <div
      style={{
        border: "1px solid #e5e5ff",
        borderRadius: "6px",
        padding: "10px 12px",
        background: "#fdfdff",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          height: "120px",
        }}
      >
        <div style={{ fontWeight: 600 }}>{item.ItemName || ""}</div>
        <div style={{ fontSize: "13px" }}>
          <b>ID:</b> {item.IngredientId || ""}
        </div>
        <div style={{ fontSize: "13px" }}>
          <b>Code:</b> {item.IngredientCode || ""}
        </div>
        <div style={{ fontSize: "13px" }}>
          <b>Quantity:</b> {item.Quantity || ""} {item.UnitOfMeasurement || ""}
        </div>
      </div>
      <div style={{ marginTop: "4px" }}>
        <button
          onClick={() => onDetail(item.IngredientCode)}
          style={buttonStyle}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

function ByProductTab({ items }) {
  if (!items || items.length === 0)
    return <div style={{ marginTop: "12px" }}>Không có dữ liệu</div>;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginTop: "8px",
      }}
    >
      {items.map((bp, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #e5e5ff",
            borderRadius: "6px",
            padding: "10px 12px",
            background: "#fdfdff",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <b>Process:</b> {bp.ProcessId}
          </div>
          <div>
            <b>ByProduct:</b> {bp.ByProductName || bp.ByProductCode}
          </div>
        </div>
      ))}
    </div>
  );
}

function ParameterTab({ items }) {
  if (!items || items.length === 0)
    return <div style={{ marginTop: "12px" }}>Không có dữ liệu</div>;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
        gap: "12px",
        marginTop: "8px",
      }}
    >
      {items.map((pm, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #e5e5ff",
            borderRadius: "6px",
            padding: "10px 12px",
            background: "#fdfdff",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "6px" }}>
            Process: {pm.ProcessId}
          </div>
          <div style={{ fontSize: "13px" }}>
            <b>Parameter:</b> {pm.ParameterName || pm.Code}
          </div>
          <div style={{ fontSize: "13px" }}>
            <b>Value:</b> {pm.Value || ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductDetailContent({ product: p, formatDateTime }) {
  return (
    <>
      <div style={kvStyle}>
        <div style={kStyle}>ProductMasterId</div>
        <div style={vStyle}>{p.ProductMasterId ?? ""}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Mã SP</div>
        <div style={vStyle}>{p.ItemCode ?? ""}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Tên SP</div>
        <div style={vStyle}>{p.ItemName ?? ""}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Loại</div>
        <div style={vStyle}>{p.Item_Type ?? ""}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Nhóm</div>
        <div style={vStyle}>{p.Group ?? "-"}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Category</div>
        <div style={vStyle}>{p.Category ?? "-"}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Brand</div>
        <div style={vStyle}>{p.Brand ?? "-"}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Đơn vị cơ sở</div>
        <div style={vStyle}>{p.BaseUnit ?? ""}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Đơn vị tồn kho</div>
        <div style={vStyle}>{p.InventoryUnit ?? ""}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Trạng thái</div>
        <div style={vStyle}>{p.Item_Status ?? ""}</div>
      </div>
      <div style={kvStyle}>
        <div style={kStyle}>Ngày cập nhật</div>
        <div style={vStyle}>
          {p.timestamp ? formatDateTime(p.timestamp) : ""}
        </div>
      </div>

      <h3 style={{ marginTop: "14px" }}>MHUTypes</h3>
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}
      >
        <thead>
          <tr style={{ background: "#f6f6ff" }}>
            <th style={thTdStyle}>MHUTypeId</th>
            <th style={thTdStyle}>FromUnit</th>
            <th style={thTdStyle}>ToUnit</th>
            <th style={thTdStyle}>Conversion</th>
          </tr>
        </thead>
        <tbody>
          {(p.MhuTypes || []).map((m, idx) => (
            <tr key={idx}>
              <td style={thTdStyle}>{m.MHUTypeId ?? ""}</td>
              <td style={thTdStyle}>{m.FromUnit ?? ""}</td>
              <td style={thTdStyle}>{m.ToUnit ?? ""}</td>
              <td style={thTdStyle}>{m.Conversion ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// --- Styles ---
const buttonStyle = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #6259ee",
  background: "#6259ee",
  color: "#fff",
  cursor: "pointer",
};

const cardStyle = {
  padding: "16px 24px",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  display: "flex",
  flexDirection: "column",
};

const kvStyle = { display: "flex", gap: "8px", marginBottom: "8px" };
const kStyle = { minWidth: "160px", color: "#666", fontWeight: 500 };
const vStyle = { color: "#222" };
const thTdStyle = {
  border: "1px solid #e5e5f5",
  padding: "8px",
  textAlign: "left",
  // textAlign: "center",
};

const dropdownItemExStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 8px",
  cursor: "pointer",
  borderRadius: "4px",
};
