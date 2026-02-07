import { useEffect } from "react";
import { useParams } from "react-router-dom";
export default function ProductionOrderDetailPage() {
  const { orderId } = useParams(); // /production-orders/:orderId

  useEffect(() => {
    // TODO: migrate logic từ production_order_detail.js vào đây
    // initProductionOrderDetail(orderId);
  }, [orderId]);

  return (
    <div className="main-container">
      {/* Header */}
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

      {/* Order Detail */}
      <div id="orderDetails" style={{ display: "none" }}>
        <div className="card">
          <div className="detail-grid">
            {[
              ["Mã Lệnh SX", "detailOrderNumber"],
              ["Mã Sản Phẩm", "detailProductCode"],
              ["Dây Chuyền", "detailProductionLine"],
              ["Công Thức", "detailRecipeCode"],
              ["Phiên Bản Công Thức", "detailRecipeVersion"],
              ["Lô SX", "detailLotNumber"],
              ["Số Lượng", "detailQuantity"],
              ["Batch hiện tại", "detailCurrentBatch"],
              ["Ngày Bắt Đầu", "detailPlannedStart"],
              ["Ngày Kết Thúc", "detailPlannedEnd"],
              ["Ca Làm", "detailShift"],
              ["Tiến Độ", "detailProgress"],
              ["Trạng Thái", "detailStatus"],
              ["Plant", "detailPlant"],
              ["Shop Floor", "detailShopfloor"],
              ["Process Area", "detailProcessArea"],
            ].map(([label, id]) => (
              <div key={id}>
                <label>{label}</label>
                <p id={id}>-</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div id="tabsBar" className="tabs-bar">
        <button className="tab-button active" id="tab-batches">
          Production Batches
        </button>
        <button className="tab-button" id="tab-materials">
          Material Consumption
        </button>
      </div>

      {/* Batches */}
      <div id="batchesContent">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Batch Number</th>
              <th>Plan Quantity</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody id="batchesTableBody">
            <tr>
              <td colSpan="5" className="loading-row">
                Đang tải dữ liệu...
              </td>
            </tr>
          </tbody>
        </table>

        <div id="paginationControls" className="pagination">
          <button id="prevBtn">‹</button>
          <span id="pageInfo">Trang 0 / 1</span>
          <button id="nextBtn">›</button>
        </div>
      </div>

      {/* Materials */}
      <div id="materialsContent" style={{ display: "none" }}>
        <div className="filter-card">
          <label>Batch Number</label>
          <div id="filterBatchCodeOptions"></div>
        </div>

        <div id="materialsTableWrapper">
          <table className="data-table wide">
            <thead>
              <tr>
                <th>ID</th>
                <th>Batch Number</th>
                <th>Ingredient Code</th>
                <th>Lot</th>
                <th>Plan Quantity</th>
                <th>Actual Quantity</th>
                <th>Consumption Date</th>
                <th>Status</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody id="materialsTableBody">
              <tr>
                <td colSpan="9" className="loading-row">
                  Đang tải dữ liệu...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Detail Modal */}
      <div id="materialModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Chi Tiết Vật Liệu Tiêu Thụ</h2>
            <button id="closeModalBtn">&times;</button>
          </div>

          <div className="modal-grid">
            {[
              ["ID", "modalId"],
              ["Production Order Number", "modalProductionOrderNumber"],
              ["Batch Code", "modalBatchCode"],
              ["Ingredient Code", "modalIngredientCode"],
              ["Lot", "modalLot"],
              ["Plan Quantity", "modalPlanQuantity"],
              ["Actual Quantity", "modalQuantity"],
              ["Consumption Date", "modalDateTime"],
              ["Status", "modalStatusDisplay"],
              ["Count", "modalCount"],
              ["Operator ID", "modalOperatorId"],
              ["Supply Machine", "modalSupplyMachine"],
              ["Timestamp", "modalTimestamp"],
            ].map(([label, id]) => (
              <div key={id}>
                <label>{label}</label>
                <p id={id}>-</p>
              </div>
            ))}

            <div className="full">
              <label>Request</label>
              <pre id="modalRequest">-</pre>
            </div>
            <div className="full">
              <label>Response</label>
              <pre id="modalResponse">-</pre>
            </div>
            <div className="full">
              <label>Status</label>
              <pre id="modalStatus">-</pre>
            </div>
          </div>
        </div>
      </div>

      <div id="loadingMessage">
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
