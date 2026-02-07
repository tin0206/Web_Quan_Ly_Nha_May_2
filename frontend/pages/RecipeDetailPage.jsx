import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function RecipeDetailPage() {
  const { recipeId } = useParams();

  useEffect(() => {
    document.title = `Chi tiết Công thức #${recipeId}`;
    // Logic cũ trong production_recipe_detail.js
    // sẽ migrate sang React sau
  }, [recipeId]);

  return (
    <div className="main-container">
      {/* Header */}
      <div className="header-container">
        <a className="back-btn" href="/recipes">
          <i className="fa-solid fa-arrow-left"></i>
        </a>

        <div className="header-text">
          <h1>Recipe Detail</h1>
          <p>
            ID: <strong>{recipeId}</strong>
          </p>
        </div>
      </div>

      {/* Recipe Details */}
      <div id="recipeDetails" style={{ display: "block" }}>
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
            <DetailItem label="Mã Công Thức" id="detailRecipeCode" />
            <DetailItem label="Tên Công Thức" id="detailRecipeName" />
            <DetailItem label="Phiên Bản" id="detailRecipeVersion" />
            <DetailItem label="Trạng Thái" id="detailRecipeStatus" />
            <DetailItem label="Cập Nhật" id="detailRecipeLastUpdated" />
            <DetailItem label="Mã Sản Phẩm" id="detailRecipeProductCode" />
            <DetailItem label="Tên Sản Phẩm" id="detailRecipeProductName" />
          </div>
        </div>
      </div>

      {/* Processes */}
      <div id="RecipeProcesses" className="main-container"></div>
    </div>
  );
}

/* Reusable detail item (không thay đổi UI) */
function DetailItem({ label, id }) {
  return (
    <div>
      <label style={{ fontWeight: "bold", color: "#666" }}>{label}</label>
      <p id={id} style={{ margin: "5px 0", fontSize: "16px" }}>
        -
      </p>
    </div>
  );
}
