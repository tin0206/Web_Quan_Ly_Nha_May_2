import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import "../styles/main_style.css";
import "../styles/po_detail_style.css";
import { Link } from "react-router-dom";

const PLANTCODE = import.meta.env.VITE_PLANTCODE;
const LINE = import.meta.env.VITE_LINE;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ProductionOrderDetailPage() {
  const { orderId } = useParams();

  // Helper to get from session storage or default
  const getSessionState = (key, defaultValue) => {
    try {
      const stored = sessionStorage.getItem(`po_${orderId}_${key}`);
      return stored !== null ? stored : defaultValue;
    } catch (error) {
      console.error("Error accessing sessionStorage:", error);
      return defaultValue;
    }
  };

  const [currentTab, setCurrentTab] = useState(() =>
    getSessionState("currentTab", "batches"),
  );
  const [order, setOrder] = useState(null);
  const [batches, setBatches] = useState([]);
  const [ingredientsTotalsByUOM, setIngredientsTotalsByUOM] = useState({});
  const [materialFilterType, setMaterialFilterType] = useState(() =>
    getSessionState("materialFilterType", "all"),
  );
  const batchesPerPage = 10;
  const materialsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(() =>
    parseInt(getSessionState("currentPage", "1"), 10),
  );
  const [materialsCurrentPage, setMaterialsCurrentPage] = useState(() =>
    parseInt(getSessionState("materialsCurrentPage", "1"), 10),
  );
  const [allMaterials, setAllMaterials] = useState([]);
  const [batchCodesWithMaterials, setBatchCodesWithMaterials] = useState([]);
  const [selectedBatchCode, setSelectedBatchCode] = useState(() =>
    getSessionState("selectedBatchCode", ""),
  );

  // New filters state
  const [ingredientCodeFilter, setIngredientCodeFilter] = useState(() =>
    getSessionState("ingredientCodeFilter", ""),
  );
  const [lotFilter, setLotFilter] = useState(() =>
    getSessionState("lotFilter", ""),
  );
  const [quantityFilter, setQuantityFilter] = useState(() =>
    getSessionState("quantityFilter", ""),
  );

  // New modals state
  const [selectedMaterialGroup, setSelectedMaterialGroup] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isMaterialListModalOpen, setIsMaterialListModalOpen] = useState(false);
  const [isMaterialDetailModalOpen, setIsMaterialDetailModalOpen] =
    useState(false);

  // Recipe details modal state
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeModalRows, setRecipeModalRows] = useState([]);
  const [recipeSelectedVersion, setRecipeSelectedVersion] = useState("");

  const openRecipeDetailsModal = useCallback(
    async ({ recipeCode, version = "" }) => {
      if (!recipeCode) return;
      try {
        // Build query params
        const params = new URLSearchParams({ recipeCode });
        if (version) params.set("version", version);

        const res = await fetch(
          `${API_BASE_URL}/api/production-order-detail/recipe-versions?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        if (!res.ok) throw new Error("Không lấy được RecipeDetails");
        const data = await res.json();
        const rows = Array.isArray(data.data) ? data.data : [];
        setRecipeModalRows(rows);
        setRecipeSelectedVersion(version || "");
        setIsRecipeModalOpen(true);
      } catch (error) {
        console.error("Error opening recipe details modal:", error);
        alert("Lỗi khi tải chi tiết RecipeDetails");
      }
    },
    [],
  );

  const filterOptions = [
    { value: "all", label: "Tất cả" },
    { value: "consumed", label: "Đã tiêu thụ" },
    { value: "unconsumed", label: "Chưa tiêu thụ" },
  ];

  // Save state to session storage
  useEffect(() => {
    sessionStorage.setItem(`po_${orderId}_currentTab`, currentTab);
  }, [orderId, currentTab]);

  useEffect(() => {
    sessionStorage.setItem(
      `po_${orderId}_materialFilterType`,
      materialFilterType,
    );
  }, [orderId, materialFilterType]);

  useEffect(() => {
    if (selectedBatchCode !== null && selectedBatchCode !== undefined) {
      sessionStorage.setItem(
        `po_${orderId}_selectedBatchCode`,
        selectedBatchCode,
      );
    }
  }, [orderId, selectedBatchCode]);

  useEffect(() => {
    if (ingredientCodeFilter !== null && ingredientCodeFilter !== undefined) {
      sessionStorage.setItem(
        `po_${orderId}_ingredientCodeFilter`,
        ingredientCodeFilter,
      );
    }
  }, [orderId, ingredientCodeFilter]);

  useEffect(() => {
    if (lotFilter !== null && lotFilter !== undefined) {
      sessionStorage.setItem(`po_${orderId}_lotFilter`, lotFilter);
    }
  }, [orderId, lotFilter]);

  useEffect(() => {
    if (quantityFilter !== null && quantityFilter !== undefined) {
      sessionStorage.setItem(`po_${orderId}_quantityFilter`, quantityFilter);
    }
  }, [orderId, quantityFilter]);

  useEffect(() => {
    sessionStorage.setItem(`po_${orderId}_currentPage`, currentPage);
  }, [orderId, currentPage]);

  useEffect(() => {
    sessionStorage.setItem(
      `po_${orderId}_materialsCurrentPage`,
      materialsCurrentPage,
    );
  }, [orderId, materialsCurrentPage]);

  useEffect(() => {
    document.title = `Chi tiết Production Order #${orderId}`;
  }, [orderId]);

  function formatDate(dateString) {
    if (!dateString) return "";

    // Chỉ lấy phần ngày
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-");

    if (!year || !month || !day) return dateString;

    return `${day}/${month}/${year}`;
  }

  function getStatusText(status) {
    if (typeof status === "number") {
      switch (status) {
        case 0:
          return "Đang chờ";
        case 1:
          return "Đang chạy";
        case 2:
          return "Hoàn thành";
        default:
          return "Không xác định";
      }
    }
    return String(status);
  }

  function formatDateTime(dateString) {
    if (!dateString) return "";
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return dateString;

    const [year, month, day] = datePart.split("-");
    const [hours, minutes, seconds] = timePart.replace("Z", "").split(":");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  function groupMaterials(materialsArray) {
    function getGroupRespone(items) {
      if (!items || items.length === 0) {
        return null;
      }

      const allSuccess = items.every((item) => item?.respone === "Success");
      if (allSuccess) {
        return "Success";
      }

      const allNull = items.every(
        (item) =>
          item?.respone === null ||
          item?.respone === undefined ||
          item?.respone === "",
      );
      if (allNull) {
        return null;
      }

      const allNotNullAndNotSuccess = items.every(
        (item) =>
          item?.respone !== null &&
          item?.respone !== undefined &&
          item?.respone !== "" &&
          item?.respone !== "Success",
      );
      if (allNotNullAndNotSuccess) {
        return "Failed";
      }

      // For any other mixed cases, return null
      return null;
    }

    const groupMap = new Map();

    materialsArray.forEach((material) => {
      const key = `${material.ingredientCode || ""}`;
      if (groupMap.has(key)) {
        const group = groupMap.get(key);
        // Check if the material is already in the group
        const isDuplicate = group.items.some(
          (item) =>
            item.id === material.id && item.batchCode === material.batchCode,
        );
        if (!isDuplicate) {
          group.totalQuantity += parseFloat(material.quantity) || 0;
          group.items.push(material);
          group.ids.push(material.id);
          group.respone = getGroupRespone(group.items);
        }
      } else {
        // Create new group
        const items = [material];
        groupMap.set(key, {
          ingredientCode: material.ingredientCode,
          lot: material.lot,
          unitOfMeasurement: material.unitOfMeasurement,
          totalQuantity: parseFloat(material.quantity) || 0,
          items,
          ids: [material.id],
          latestDatetime: material.datetime,
          respone: getGroupRespone(items),
        });
      }
    });

    return Array.from(groupMap.values());
  }

  function mergeBatchesRemoveDuplicate(arr1, arr2) {
    const map = new Map();

    arr1.forEach((batch) => {
      if (batch.BatchNumber) {
        map.set(batch.BatchNumber, batch);
      }
    });

    let foundNull = false;

    arr2.forEach((batch) => {
      if (batch.BatchNumber && !map.has(batch.BatchNumber)) {
        map.set(batch.BatchNumber, batch);
      } else if (batch.BatchNumber === null) {
        if (!foundNull) {
          foundNull = true;
          map.set(batch.BatchNumber, batch);
        }
      }
    });

    return Array.from(map.values());
  }

  const uniqueBatchNumbers = useMemo(() => {
    return [
      ...new Set(
        batches.map((b) => (b.BatchNumber === null ? "null" : b.BatchNumber)),
      ),
    ];
  }, [batches]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/production-order-detail/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setOrder(data.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  }, [orderId]);

  const fetchBatches = useCallback(async () => {
    if (!orderId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/production-order-detail/batches?productionOrderId=${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      let currentBatches = [];

      if (res.ok) {
        const data = await res.json();
        currentBatches = data.data || [];
        // Only set batches here if we can't proceed to merge yet
        if (!order?.ProductionOrderNumber) {
          setBatches(currentBatches);
          return;
        }
      }

      if (!order?.ProductionOrderNumber) return;

      const res2 = await fetch(
        `${API_BASE_URL}/api/production-order-detail/batch-codes-with-materials?productionOrderNumber=${order.ProductionOrderNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res2.ok) {
        const data2 = await res2.json();
        const batchCodesWithMaterials = data2.data.map((batch) => {
          return {
            BatchId: "",
            ProductionOrderId: orderId,
            BatchNumber: batch.batchCode || "null",
            Quantity: "",
            UnitOfMeasurement: "",
          };
        });
        setBatchCodesWithMaterials(batchCodesWithMaterials);

        // Use currentBatches instead of state batches to avoid infinite loop
        const mergedBatches = mergeBatchesRemoveDuplicate(
          currentBatches,
          batchCodesWithMaterials,
        );
        setBatches(mergedBatches);
      } else {
        // Fallback if second API fails
        setBatches(currentBatches);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  }, [order, orderId]);

  const buildIngredientTotals = (ingredientsData) => {
    const totals = {};

    ingredientsData.forEach((item) => {
      const code = item.IngredientCode;
      if (!totals[code]) {
        totals[code] = {
          total: 0,
          unitOfMeasurement: item.UnitOfMeasurement,
        };
      }
      totals[code].total += parseFloat(item.Quantity) || 0;
    });

    return totals;
  };

  const fetchMaterials = useCallback(async () => {
    if (!order) return;

    // Ingredients
    if (Object.keys(ingredientsTotalsByUOM).length === 0) {
      const res = await fetch(
        `${API_BASE_URL}/api/production-order-detail/ingredients-by-product?productionOrderNumber=${order.ProductionOrderNumber}`,
      );

      if (res.ok) {
        const data = await res.json();
        setIngredientsTotalsByUOM(buildIngredientTotals(data.data || []));
      }
    }

    // Materials
    if (allMaterials.length === 0) {
      const query = new URLSearchParams({
        productionOrderNumber: order.ProductionOrderNumber,
        limit: 999999,
      });

      const [res1, res2] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/production-order-detail/material-consumptions?${query}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
        fetch(
          `${API_BASE_URL}/api/production-order-detail/material-consumptions-exclude-batches?${query}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              batchCodesWithMaterials,
            }),
          },
        ),
      ]);

      const planned = res1.ok ? (await res1.json()).data : [];
      const unplanned = res2.ok ? (await res2.json()).data : [];

      let plannedMaterials = [];
      planned.forEach((item) => {
        if (
          plannedMaterials.some(
            (m) =>
              m.id === item.id &&
              m.batchCode === item.batchCode &&
              m.ingredientCode === item.ingredientCode,
          )
        )
          return;
        plannedMaterials.push(item);
      });

      let finalMaterials = [];
      plannedMaterials.forEach((material) => {
        if (
          finalMaterials.some(
            (m) =>
              m.id === material.id &&
              m.batchCode === material.batchCode &&
              m.ingredientCode === material.ingredientCode,
          )
        )
          return;
        finalMaterials.push(material);
      });

      unplanned.forEach((material) => {
        if (
          finalMaterials.some(
            (m) =>
              m.id === material.id &&
              m.batchCode === material.batchCode &&
              m.ingredientCode === material.ingredientCode,
          )
        )
          return;
        finalMaterials.push(material);
      });

      setAllMaterials(finalMaterials);
    }
  }, [
    order,
    allMaterials.length,
    ingredientsTotalsByUOM,
    batchCodesWithMaterials,
  ]);

  const filteredAndGroupedMaterials = useMemo(() => {
    let filtered = [...allMaterials];

    if (materialFilterType === "unconsumed") {
      filtered = filtered.filter((item) => item.id === null);
    }
    if (ingredientCodeFilter) {
      const lower = ingredientCodeFilter.toLowerCase();
      filtered = filtered.filter((item) =>
        item.ingredientCode?.toLowerCase().includes(lower),
      );
    }
    if (lotFilter) {
      const lower = lotFilter.toLowerCase();
      filtered = filtered.filter((item) =>
        item.lot?.toLowerCase().includes(lower),
      );
    }
    if (quantityFilter) {
      const str = quantityFilter.toString();
      filtered = filtered.filter((item) =>
        item.quantity?.toString().includes(str),
      );
    }
    if (selectedBatchCode) {
      if (selectedBatchCode === "null") {
        filtered = filtered.filter((item) => !item.batchCode);
      } else {
        filtered = filtered.filter(
          (item) => item.batchCode === selectedBatchCode,
        );
      }
    }

    let grouped = groupMaterials(filtered);

    if (materialFilterType === "consumed") {
      grouped = grouped
        .filter((group) => {
          if (group.ids.length === 0) return false;
          return group.ids.some((id) => id !== null);
        })
        .map((group) => ({
          ...group,
          ids: group.ids.filter((id) => id !== null),
          items: group.items.filter((item) => item.id !== null),
        }));
    } else if (materialFilterType === "unconsumed") {
      grouped = grouped
        .filter((group) => {
          if (group.ids.length === 0) return true;
          return group.ids[0] === null;
        })
        .map((group) => ({
          ...group,
          ids: group.ids.filter((id) => id === null),
          totalQuantity: 0,
          items: group.items.filter((item) => item.id === null),
        }));
    }
    return grouped;
  }, [
    allMaterials,
    ingredientCodeFilter,
    lotFilter,
    quantityFilter,
    selectedBatchCode,
    materialFilterType,
  ]);

  const paginatedGroupedMaterials = useMemo(() => {
    const startIndex = (materialsCurrentPage - 1) * materialsPerPage;
    const endIndex = startIndex + materialsPerPage;
    return filteredAndGroupedMaterials.slice(startIndex, endIndex);
  }, [filteredAndGroupedMaterials, materialsCurrentPage]);

  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * batchesPerPage;
    return batches.slice(startIndex, startIndex + batchesPerPage);
  }, [batches, currentPage]);

  const batchesTotalPages = useMemo(
    () => Math.ceil(batches.length / batchesPerPage) || 1,
    [batches.length],
  );

  const materialsTotalCount = useMemo(
    () => filteredAndGroupedMaterials.length,
    [filteredAndGroupedMaterials.length],
  );

  const materialsTotalPages = useMemo(() => {
    return (
      Math.ceil(filteredAndGroupedMaterials.length / materialsPerPage) || 1
    );
  }, [filteredAndGroupedMaterials.length, materialsPerPage]);

  // Update total counts/pages
  const resetMaterialsPage = () => {
    setMaterialsCurrentPage(1);
  };

  const handleIngredientCodeChange = (value) => {
    setIngredientCodeFilter(value);
    resetMaterialsPage();
  };

  const handleLotFilterChange = (value) => {
    setLotFilter(value);
    resetMaterialsPage();
  };

  const handleQuantityFilterChange = (value) => {
    setQuantityFilter(value);
    resetMaterialsPage();
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await fetchOrderDetails();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchOrderDetails]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await fetchBatches();
    };

    run();
  }, [fetchBatches]);

  useEffect(() => {
    if (currentTab !== "materials") return;
    if (!order?.ProductionOrderNumber) return;

    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await fetchMaterials();
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [currentTab, order, fetchMaterials]);

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
      <div className="main-container">
        <div className="header-container">
          <a className="back-btn" href="/production-orders">
            <i className="fa-solid fa-arrow-left"></i>
          </a>
          <div className="header-text">
            <h1>Production Order Detail</h1>
            <p>
              ID: <strong>{orderId}</strong>
            </p>
          </div>
        </div>

        <div>
          <div id="orderDetails">
            <div
              style={{
                background: "#fff",
                borderRadius: "8px",
                padding: "30px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "20px",
                  textAlign: "left",
                }}
              >
                {[
                  {
                    label: "Mã Lệnh SX",
                    id: "detailOrderNumber",
                    value: order?.ProductionOrderNumber || "-",
                  },
                  {
                    label: "Mã Sản Phẩm",
                    id: "detailProductCode",
                    value: order?.ProductCode || "-",
                  },
                  {
                    label: "Dây Chuyền",
                    id: "detailProductionLine",
                    value: order?.ProductionLine || "-",
                  },
                  {
                    label: "Công Thức",
                    id: "detailRecipeCode",
                    value: order?.RecipeCode || "-",
                  },
                  {
                    label: "Phiên Bản Công Thức",
                    id: "detailRecipeVersion",
                    value: order?.RecipeVersion || "-",
                  },
                  {
                    label: "Lô SX",
                    id: "detailLotNumber",
                    value: order?.LotNumber || "-",
                  },
                  {
                    label: "Số Lượng",
                    id: "detailQuantity",
                    value: order?.Quantity || "-",
                  },
                  {
                    label: "Batch hiện tại",
                    id: "detailCurrentBatch",
                    value:
                      order?.CurrentBatch ||
                      0 + "/" + order?.TotalBatches ||
                      "0",
                  },
                  {
                    label: "Ngày Bắt Đầu",
                    id: "detailPlannedStart",
                    value: formatDate(order?.PlannedStart),
                  },
                  {
                    label: "Ngày Kết Thúc",
                    id: "detailPlannedEnd",
                    value: formatDate(order?.PlannedEnd),
                  },
                  {
                    label: "Ca Làm",
                    id: "detailShift",
                    value: order?.Shift || "-",
                  },
                  {
                    label: "Tiến Độ",
                    id: "detailProgress",
                    value:
                      Math.round(
                        ((parseInt(order?.CurrentBatch) || 0) /
                          (parseInt(order?.TotalBatches) || 1)) *
                          100,
                      ) + "%",
                  },
                  {
                    label: "Trạng Thái",
                    id: "detailStatus",
                    value: getStatusText(order?.Status) || "-",
                  },
                  {
                    label: "Plant",
                    id: "detailPlant",
                    value: order?.Plant || "-",
                  },
                  {
                    label: "Shop Floor",
                    id: "detailShopfloor",
                    value: order?.ShopFloor || "-",
                  },
                  {
                    label: "Process Area",
                    id: "detailProcessArea",
                    value: order?.ProcessArea || "-",
                  },
                ].map((item) => (
                  <div key={item.id}>
                    <label style={{ fontWeight: "bold", color: "#666" }}>
                      {item.label}
                    </label>
                    <p
                      style={{
                        margin: "5px 0",
                        fontSize: "16px",
                        cursor:
                          item.id === "detailRecipeCode" ||
                          item.id === "detailRecipeVersion"
                            ? "pointer"
                            : "default",
                        color:
                          item.id === "detailRecipeCode" ||
                          item.id === "detailRecipeVersion"
                            ? "#5b4ce8"
                            : "inherit",
                        textDecoration:
                          item.id === "detailRecipeCode" ||
                          item.id === "detailRecipeVersion"
                            ? "underline"
                            : "none",
                      }}
                      id={item.id}
                      onClick={() => {
                        if (item.id === "detailRecipeCode") {
                          const code = (order?.RecipeCode || "")
                            .split(" - ")[0]
                            .trim();
                          if (!code) return;
                          openRecipeDetailsModal({ recipeCode: code });
                        }
                        if (item.id === "detailRecipeVersion") {
                          window.open(
                            "/recipe-detail/" + order?.RecipeDetailsId,
                            "_blank",
                          );
                        }
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            id="tabsBar"
            style={{
              marginTop: "20px",
              borderBottom: "2px solid #ddd",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              className={`tab-button${currentTab === "batches" ? " active" : ""}`}
              id="tab-batches"
              onClick={() => setCurrentTab("batches")}
            >
              Production Batches
            </button>
            <button
              className={`tab-button${currentTab === "materials" ? " active" : ""}`}
              id="tab-materials"
              onClick={() => setCurrentTab("materials")}
            >
              Material Consumption
            </button>
          </div>

          <div
            id="batchesContent"
            style={{
              marginTop: "20px",
              display: currentTab === "batches" ? "block" : "none",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "white",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f5f5f5",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  {[
                    "Batch ID",
                    "Batch Number",
                    "Plan Quantity",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody id="batchesTableBody">
                {batches.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}

                {paginatedBatches.length > 0 &&
                  paginatedBatches.map((batch, index) => {
                    let status = "";
                    let bgColor = "";
                    const isRunning = batchCodesWithMaterials.some(
                      (b) => b.BatchNumber === batch.BatchNumber,
                    );
                    if (isRunning) {
                      status = "Đang chạy";
                      bgColor = "#d4edda";
                    } else {
                      status = "Đang chờ";
                      bgColor = "#fff3cd";
                    }

                    return (
                      <tr
                        key={index}
                        style={{
                          borderBottom: "1px solid #ddd",
                          backgroundColor: bgColor,
                        }}
                      >
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          {batch.BatchId}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          {batch.BatchNumber}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          {batch.Quantity} {batch.UnitOfMeasurement}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          {status}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            className="viewMaterialsBtn"
                            data-batch-code={batch.BatchNumber}
                            style={{
                              background: "#5b4ce8",
                              color: "white",
                              border: "none",
                              cursor: "pointer",
                              padding: "8px 12px",
                              borderRadius: "4px",
                              fontSize: "14px",
                              fontWeight: "500",
                              transition: "background 0.2s",
                            }}
                            onClick={() => {
                              setSelectedBatchCode(batch.BatchNumber);
                              setCurrentTab("materials");
                            }}
                            title="View Materials"
                          >
                            View Materials
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <div
              id="paginationControls"
              style={{
                marginTop: "20px",
                display: batches.length > 0 ? "flex" : "none",
                justifyContent: "center",
                alignItems: "center",
                gap: "15px",
                padding: "15px 0 20px 0",
              }}
            >
              <button
                id="prevBtn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  background: currentPage <= 1 ? "#ccc" : "#5b4ce8",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.3s ease, opacity 0.3s ease",
                  fontSize: "16px",
                  opacity: currentPage <= 1 ? 0.6 : 1,
                }}
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
              <span
                id="pageInfo"
                style={{
                  fontSize: "14px",
                  color: "#666",
                  fontWeight: "500",
                  minWidth: "120px",
                  textAlign: "center",
                }}
              >
                Trang {currentPage} / {batchesTotalPages} (Tổng:{" "}
                {batches.length})
              </span>
              <button
                id="nextBtn"
                onClick={() =>
                  setCurrentPage((p) => Math.min(batchesTotalPages, p + 1))
                }
                disabled={currentPage >= batchesTotalPages}
                style={{
                  background:
                    currentPage >= batchesTotalPages ? "#ccc" : "#5b4ce8",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  cursor:
                    currentPage >= batchesTotalPages
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.3s ease, opacity 0.3s ease",
                  fontSize: "16px",
                  opacity: currentPage >= batchesTotalPages ? 0.6 : 1,
                }}
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

          <div
            id="materialsContent"
            style={{
              display: currentTab === "materials" ? "block" : "none",
              marginTop: "20px",
            }}
          >
            {/* Batch Number Selection Section */}
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <label
                style={{
                  fontWeight: "bold",
                  color: "#333",
                  display: "block",
                  marginBottom: "12px",
                  fontSize: "14px",
                }}
              >
                Batch Number
              </label>
              <div
                id="filterBatchIdContainer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: "#fafafa",
                  maxHeight: "200px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      width: "100px",
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        background: "#d4edda",
                        border: "1px solid #c3e6cb",
                        borderRadius: "3px",
                        display: "inline-block",
                      }}
                    ></span>
                    <span>Có material</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      width: "150px",
                    }}
                  >
                    <span
                      style={{
                        width: "20px",
                        height: "20px",
                        background: "#fff3cd",
                        border: "1px solid #ffeaa7",
                        borderRadius: "3px",
                        display: "inline-block",
                      }}
                    ></span>
                    <span>Chưa có material</span>
                  </div>
                </div>
                <div
                  id="filterBatchCodeOptions"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    width: "100%",
                  }}
                >
                  <label
                    className={`batch-filter-label ${
                      selectedBatchCode === "" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="filterBatchCode"
                      value=""
                      checked={selectedBatchCode === ""}
                      onChange={() => setSelectedBatchCode("")}
                    />
                    <span>Tất cả</span>
                  </label>
                  {uniqueBatchNumbers.map((code, index) => {
                    const isRunning = batchCodesWithMaterials.some(
                      (b) => b.BatchNumber === code,
                    );

                    return (
                      <label
                        key={index}
                        style={{
                          background: isRunning ? "#d4edda" : "#fff3cd",
                          borderColor: isRunning ? "#c3e6cb" : "#ffeaa7",
                        }}
                        className={`batch-filter-label ${
                          selectedBatchCode === code ? "selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="filterBatchCode"
                          value={code}
                          checked={selectedBatchCode === code}
                          onChange={() => setSelectedBatchCode(code)}
                        />
                        <span
                          style={{
                            borderRadius: "3px",
                            display: "inline-block",
                          }}
                        >
                          {code}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Material Type Filter */}
          <div
            style={{
              display: currentTab === "materials" ? "block" : "none",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                color: "#333",
                fontSize: "14px",
              }}
            >
              Loại vật liệu:
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "#fafafa",
              }}
            >
              <div
                id="filterMaterialTypeOptions"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  width: "100%",
                }}
              >
                {filterOptions.map((option, index) => (
                  <label
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 12px",
                      cursor: "pointer",
                      background:
                        materialFilterType === option.value
                          ? "#5b4ce8"
                          : "white",
                      color:
                        materialFilterType === option.value
                          ? "white"
                          : "inherit",
                      border: `1px solid ${materialFilterType === option.value ? "#5b4ce8" : "#ddd"}`,
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight:
                        materialFilterType === option.value ? "500" : "normal",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      const radio =
                        e.currentTarget.querySelector("input[type=radio]");
                      if (radio.checked) {
                        e.currentTarget.style.background = "#5b4ce8";
                      } else {
                        e.currentTarget.style.borderColor = "#5b4ce8";
                        e.currentTarget.style.boxShadow =
                          "0 2px 4px rgba(91,76,232,0.2)";
                      }
                    }}
                    onMouseOut={(e) => {
                      const radio =
                        e.currentTarget.querySelector("input[type=radio]");
                      if (!radio.checked) {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.color = "inherit";
                        e.currentTarget.style.borderColor = "#ddd";
                        e.currentTarget.style.fontWeight = "normal";
                      } else {
                        e.currentTarget.style.background = "#5b4ce8";
                        e.currentTarget.style.borderColor = "#5b4ce8";
                      }
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <input
                      type="radio"
                      name="filterMaterialType"
                      value={option.value}
                      checked={materialFilterType === option.value}
                      style={{
                        marginRight: "8px",
                        cursor: "pointer",
                        width: "16px",
                      }}
                      onChange={() => setMaterialFilterType(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div
            style={{
              display: currentTab === "materials" ? "block" : "none",
              background: "white",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                gap: "15px",
                alignItems: "flex-end",
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    color: "#666",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Ingredient Code
                </label>
                <input
                  type="text"
                  id="filterIngredientCode"
                  value={ingredientCodeFilter}
                  onChange={(e) => {
                    handleIngredientCodeChange(e.target.value);
                  }}
                  placeholder="Nhập mã nguyên liệu..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    color: "#666",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Lot
                </label>
                <input
                  type="text"
                  id="filterLot"
                  value={lotFilter}
                  onChange={(e) => {
                    handleLotFilterChange(e.target.value);
                  }}
                  placeholder="Nhập lot..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: "bold",
                    color: "#666",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Quantity
                </label>
                <input
                  id="filterQuantity"
                  value={quantityFilter}
                  onChange={(e) => {
                    handleQuantityFilterChange(e.target.value);
                  }}
                  placeholder="Nhập số lượng..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <button
                id="resetFilterBtn"
                onClick={() => {
                  setIngredientCodeFilter("");
                  setLotFilter("");
                  setQuantityFilter("");
                  setSelectedBatchCode("");
                  setMaterialFilterType("all");
                  setMaterialsCurrentPage(1);
                }}
                style={{
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  transition: "background 0.2s",
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div
            id="materialsTableWrapper"
            style={{
              display: currentTab === "materials" ? "block" : "none",
              width: "100%",
              background: "white",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "white",
                boxShadow: "none",
                minWidth: "1360px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f5f5f5",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  {[
                    "ID",
                    "Batch Number",
                    "Ingredient Code",
                    "Lot",
                    "Plan Quantity",
                    "Actual Quantity",
                    "Consumption Date",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody id="materialsTableBody">
                {paginatedGroupedMaterials.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
                {paginatedGroupedMaterials.map((group, index) => {
                  const idsDisplay =
                    group.items.length >= 2
                      ? `${group.items.length} items`
                      : group.items.map((item) => item.id).join(", ");

                  const uniqueBatchCodes = [
                    ...new Set(
                      group.items
                        .map((item) => item.batchCode)
                        .filter((code) => code),
                    ),
                  ];
                  let batchCodeDisplay;
                  if (uniqueBatchCodes.length === 0) {
                    batchCodeDisplay = "-";
                  } else if (uniqueBatchCodes.length <= 3) {
                    batchCodeDisplay = uniqueBatchCodes.join(", ");
                  } else {
                    batchCodeDisplay =
                      uniqueBatchCodes.slice(0, 3).join(", ") + ", ...";
                  }

                  const ingredientCode = group.ingredientCode;
                  const ingredientCodeOnly = ingredientCode
                    ? ingredientCode.split(" - ")[0].trim()
                    : "";
                  let planQuantityDisplay = "N/A";
                  for (const item of group.items) {
                    const batch = batches.find(
                      (b) => b.BatchNumber === item.batchCode,
                    );
                    const batchQuantity = batch
                      ? parseFloat(batch.Quantity) || 0
                      : 0;
                    const recipeQuantity =
                      ingredientsTotalsByUOM[ingredientCodeOnly]?.total || 0;
                    const poQuantity = parseFloat(order.ProductQuantity) || 1;
                    let planQ = recipeQuantity;
                    if (batchQuantity !== 0) {
                      planQ = (recipeQuantity / poQuantity) * batchQuantity;
                      planQ = parseFloat(planQ.toFixed(2));
                    }
                    if (recipeQuantity === 0 || batchQuantity === 0) {
                      continue;
                    }
                    planQuantityDisplay = planQ.toFixed(2);
                    break;
                  }

                  return (
                    <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {idsDisplay}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {batchCodeDisplay}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {group.ingredientCode || "-"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {group.lot || "-"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {planQuantityDisplay} {group.unitOfMeasurement || ""}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {group.totalQuantity === 0
                          ? `N/A ${group.unitOfMeasurement || ""}`
                          : `${group.totalQuantity.toFixed(2)} ${group.unitOfMeasurement || ""}`}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {formatDateTime(group.latestDatetime) || "-"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {group.respone || "-"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          className="viewMaterialGroupBtn"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#5b4ce8",
                            padding: "6px",
                            transition: "color 0.2s",
                          }}
                          title="Actions"
                          onClick={() => {
                            if (group.items.length === 1) {
                              setSelectedMaterial(group.items[0]);
                              setIsMaterialDetailModalOpen(true);
                            } else {
                              setSelectedMaterialGroup(group);
                              setIsMaterialListModalOpen(true);
                            }
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Materials Pagination Controls */}
        <div
          id="materialsPaginationControls"
          style={{
            marginTop: "20px",
            display:
              currentTab === "materials" && materialsTotalPages > 1
                ? "flex"
                : "none",
            justifyContent: "center",
            alignItems: "center",
            gap: "15px",
            padding: "15px 0 20px 0",
          }}
        >
          <button
            id="materialsPrevBtn"
            onClick={() => {
              if (materialsCurrentPage > 1)
                setMaterialsCurrentPage((p) => p - 1);
            }}
            disabled={materialsCurrentPage <= 1}
            style={{
              background: materialsCurrentPage <= 1 ? "#ccc" : "#5b4ce8",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 12px",
              cursor: materialsCurrentPage <= 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.3s ease, opacity 0.3s ease",
              fontSize: "16px",
              opacity: materialsCurrentPage <= 1 ? 0.6 : 1,
            }}
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
          <span
            id="materialsPageInfo"
            style={{
              fontSize: "14px",
              color: "#666",
              fontWeight: "500",
              minWidth: "200px",
              textAlign: "center",
            }}
          >
            Trang {materialsCurrentPage} / {materialsTotalPages} (Tổng:{" "}
            {materialsTotalCount})
          </span>
          <button
            id="materialsNextBtn"
            onClick={() => {
              if (materialsCurrentPage < materialsTotalPages)
                setMaterialsCurrentPage((p) => p + 1);
            }}
            disabled={materialsCurrentPage >= materialsTotalPages}
            style={{
              background:
                materialsCurrentPage >= materialsTotalPages
                  ? "#ccc"
                  : "#5b4ce8",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 12px",
              cursor:
                materialsCurrentPage >= materialsTotalPages
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.3s ease, opacity 0.3s ease",
              fontSize: "16px",
              opacity: materialsCurrentPage >= materialsTotalPages ? 0.6 : 1,
            }}
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

        {/* Ingredients Content - Hidden for now as requested */}
        <div
          id="ingredientsContent"
          style={{ marginTop: "20px", display: "none" }}
        ></div>

        {/* Material Detail Modal */}
        {isMaterialDetailModalOpen && selectedMaterial && (
          <div
            id="materialModal"
            style={{
              display: "flex",
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
            onClick={(e) => {
              if (e.target.id === "materialModal")
                setIsMaterialDetailModalOpen(false);
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
                  onClick={() => setIsMaterialDetailModalOpen(false)}
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
                {[
                  { label: "ID", value: selectedMaterial.id || "-" },
                  {
                    label: "Production Order Number",
                    value: order?.ProductionOrderNumber || "-",
                  },
                  {
                    label: "Batch Code",
                    value: selectedMaterial.batchCode || "-",
                  },
                  {
                    label: "Ingredient Code",
                    value: selectedMaterial.ingredientCode || "-",
                  },
                  { label: "Lot", value: selectedMaterial.lot || "-" },
                  {
                    label: "Plan Quantity",
                    value: (() => {
                      const batch = batches.find(
                        (b) => b.BatchNumber === selectedMaterial.batchCode,
                      );
                      const batchQuantity = batch
                        ? parseFloat(batch.Quantity) || 0
                        : 0;
                      const code = selectedMaterial.ingredientCode
                        ?.split(" - ")[0]
                        .trim();
                      const recipeQuantity =
                        ingredientsTotalsByUOM[code]?.total || 0;
                      const poQuantity = parseFloat(order?.Quantity) || 1;

                      if (recipeQuantity === 0 || batchQuantity === 0)
                        return "N/A";

                      const planQ =
                        (recipeQuantity / poQuantity) * batchQuantity;
                      return `${planQ.toFixed(2)} ${selectedMaterial.unitOfMeasurement || ""}`;
                    })(),
                  },
                  {
                    label: "Actual Quantity",
                    value:
                      !selectedMaterial.quantity ||
                      selectedMaterial.quantity === 0
                        ? `N/A ${selectedMaterial.unitOfMeasurement || ""}`
                        : `${selectedMaterial.quantity} ${selectedMaterial.unitOfMeasurement || ""}`,
                  },
                  {
                    label: "Consumption Date",
                    value: formatDate(selectedMaterial.datetime) || "-",
                  },
                  {
                    label: "Status",
                    value:
                      selectedMaterial.respone === "Success"
                        ? "Success"
                        : "Failed",
                  },
                  { label: "Count", value: selectedMaterial.count || "-" },
                  {
                    label: "Operator ID",
                    value: selectedMaterial.operator_ID || "-",
                  },
                  {
                    label: "Supply Machine",
                    value: selectedMaterial.supplyMachine || "-",
                  },
                  {
                    label: "Timestamp",
                    value: formatDate(selectedMaterial.timestamp) || "-",
                  },
                ].map((item, idx) => (
                  <div key={idx}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#666",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      {item.label}
                    </label>
                    <p
                      style={{
                        margin: 0,
                        padding: "8px",
                        background: "#f5f5f5",
                        borderRadius: "4px",
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
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
                    {selectedMaterial.request || "-"}
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
                    {selectedMaterial.respone || "-"}
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
                    {selectedMaterial.status1 || "-"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Material List Modal (for grouped materials) */}
        {isMaterialListModalOpen && selectedMaterialGroup && (
          <div
            id="materialListModal"
            style={{
              display: "flex",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 9998,
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={(e) => {
              if (e.target.id === "materialListModal")
                setIsMaterialListModalOpen(false);
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "1200px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  padding: "20px 30px",
                  borderBottom: "2px solid #f0f0f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "sticky",
                  top: 0,
                  background: "white",
                  zIndex: 1,
                }}
              >
                <div id="listModalTitle" style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    Danh sách Materials
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    <span style={{ marginRight: "20px" }}>
                      <strong>Ingredient:</strong>{" "}
                      {selectedMaterialGroup.ingredientCode || "-"}
                    </span>
                    <span style={{ marginRight: "20px" }}>
                      <strong>Lot:</strong> {selectedMaterialGroup.lot || "-"}
                    </span>
                    <span>
                      <strong>Total Quantity:</strong>{" "}
                      {selectedMaterialGroup.totalQuantity.toFixed(2)}{" "}
                      {selectedMaterialGroup.unitOfMeasurement || ""}
                    </span>
                  </div>
                </div>
                <button
                  id="closeMaterialListModalBtn"
                  onClick={() => setIsMaterialListModalOpen(false)}
                  style={{
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "background 0.3s ease",
                  }}
                >
                  Đóng
                </button>
              </div>
              <div style={{ padding: "30px" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f5f5f5",
                        borderBottom: "2px solid #ddd",
                      }}
                    >
                      {[
                        "ID",
                        "Batch Number",
                        "Ingredient Code",
                        "Lot",
                        "Plan Quantity",
                        "Actual Quantity",
                        "Consumption Date",
                        "Status",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#333",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody id="materialListTableBody">
                    {selectedMaterialGroup.items.map((material, idx) => {
                      const batch = batches.find(
                        (b) => b.BatchNumber === material.batchCode,
                      );
                      const batchQuantity = batch
                        ? parseFloat(batch.Quantity) || 0
                        : 0;
                      const code = material.ingredientCode
                        ?.split(" - ")[0]
                        .trim();
                      const recipeQuantity =
                        ingredientsTotalsByUOM[code]?.total || 0;
                      const poQuantity =
                        parseFloat(order?.ProductQuantity) || 1;

                      let planQVal = "N/A";
                      if (recipeQuantity > 0 && batchQuantity > 0) {
                        planQVal = (
                          (recipeQuantity / poQuantity) *
                          batchQuantity
                        ).toFixed(2);
                      }

                      return (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #eee" }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontWeight: "bold",
                            }}
                          >
                            {material.id || "-"}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {material.batchCode || "-"}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {material.ingredientCode || "-"}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {material.lot || "-"}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {planQVal} {material.unitOfMeasurement || ""}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {!material.quantity || material.quantity === 0
                              ? `N/A ${material.unitOfMeasurement || ""}`
                              : `${material.quantity} ${material.unitOfMeasurement || ""}`}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {formatDateTime(material.datetime) || "-"}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {material.respone === "Success"
                              ? "Success"
                              : "Failed"}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <button
                              className="viewMaterialDetailBtn"
                              onClick={() => {
                                setIsMaterialListModalOpen(false);
                                setSelectedMaterial(material);
                                setIsMaterialDetailModalOpen(true);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#5b4ce8",
                                padding: "6px",
                              }}
                              title="Xem chi tiết"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="30"
                                height="30"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Details Modal */}
        {isRecipeModalOpen && (
          <div
            id="recipeDetailsModal"
            style={{
              display: "flex",
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 10000,
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => {
              if (e.target.id === "recipeDetailsModal")
                setIsRecipeModalOpen(false);
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "24px",
                maxWidth: "1000px",
                width: "92%",
                maxHeight: "85vh",
                overflow: "auto",
                boxShadow: "0 8px 24px rgba(0,0,0,.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                <h2 style={{ margin: 0, color: "#333" }}>Recipe Details</h2>
                <button
                  id="recipeModalClose"
                  onClick={() => setIsRecipeModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "26px",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Summary */}
              <div
                id="recipeModalSummary"
                style={{
                  marginBottom: "10px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                {(() => {
                  const code = (order?.RecipeCode || "").split(" - ")[0].trim();
                  const v = recipeSelectedVersion;
                  const count = recipeModalRows?.length || 0;
                  return `Recipe Code: ${code} ${v ? `(Version: ${v})` : ""} • Records: ${count}`;
                })()}
              </div>

              {/* Content */}
              <div id="recipeModalContent">
                {recipeModalRows.length === 0 ? (
                  <div style={{ padding: "12px", color: "#999" }}>
                    Không có dữ liệu
                  </div>
                ) : (
                  <div style={{ overflow: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr style={{ background: "#f6f6ff" }}>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "center",
                              width: "80px",
                            }}
                          >
                            ID
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "center",
                              width: "130px",
                            }}
                          >
                            Product Code
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "center",
                              width: "90px",
                            }}
                          >
                            Production Line
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "center",
                              width: "130px",
                            }}
                          >
                            Recipe Code
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "left",
                            }}
                          >
                            Recipe Name
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "center",
                              width: "100px",
                            }}
                          >
                            Recipe Status
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "center",
                              width: "80px",
                            }}
                          >
                            Version
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "center",
                              width: "160px",
                            }}
                          >
                            Timestamp
                          </th>
                          <th
                            style={{
                              border: "1px solid #eee",
                              padding: "8px",
                              textAlign: "left",
                            }}
                          >
                            Product Name
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipeModalRows.map((r, idx) => (
                          <tr key={idx}>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                                textAlign: "center",
                              }}
                            >
                              {r.RecipeDetailsId ?? ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                                textAlign: "center",
                              }}
                            >
                              <a
                                style={{
                                  textDecoration: "none",
                                  color: "#5b4ce8",
                                }}
                                href={`/recipe-detail/${r.RecipeDetailsId}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {r.ProductCode ?? ""}
                              </a>
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                                textAlign: "center",
                              }}
                            >
                              {r.ProductionLine ?? ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                                textAlign: "center",
                              }}
                            >
                              {r.RecipeCode ?? ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                              }}
                            >
                              {r.RecipeName ?? ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                                textAlign: "center",
                              }}
                            >
                              {r.RecipeStatus ?? ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                                textAlign: "center",
                              }}
                            >
                              {r.Version ?? ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                                textAlign: "center",
                              }}
                            >
                              {r.timestamp ? formatDateTime(r.timestamp) : ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid #eee",
                                padding: "6px",
                              }}
                            >
                              {r.ProductName ?? ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
