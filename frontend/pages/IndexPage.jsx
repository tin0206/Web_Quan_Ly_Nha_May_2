import { useEffect } from "react";
import styles from "../styles/IndexPage.module.css";

export default function IndexPage() {
  useEffect(() => {
    document.title = `Quản Lý Nhà Máy`;
    const existing = document.querySelector(
      'link[href*="cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"]',
    );
    let faLink = null;
    if (!existing) {
      faLink = document.createElement("link");
      faLink.rel = "stylesheet";
      faLink.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
      document.head.appendChild(faLink);
    }

    return () => {
      if (faLink) {
        document.head.removeChild(faLink);
      }
    };
  }, []);

  return (
    <div className={styles["page-root"]}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Hệ Thống Quản Lý Nhà Máy</h1>
        </div>

        <div className={styles["cards-container"]}>
          {/* Card 1: Production Orders */}
          <a href="/production-orders" className={styles.card}>
            <div className={styles["card-icon"]}>
              <i className="fa-solid fa-industry"></i>
            </div>
            <div className={styles["card-title"]}>Lệnh Sản Xuất</div>
            <div className={styles["card-description"]}>
              Quản lý và giám sát các lệnh sản xuất (Production Orders)
            </div>
          </a>

          {/* Card 2: Recipes */}
          <a href="/recipes" className={styles.card}>
            <div className={styles["card-icon"]}>
              <i className="fa-solid fa-flask"></i>
            </div>
            <div className={styles["card-title"]}>Công Thức</div>
            <div className={styles["card-description"]}>
              Quản lý và theo dõi các công thức sản xuất
            </div>
          </a>

          {/* Card 3: Products */}
          <a href="/products" className={styles.card}>
            <div className={styles["card-icon"]}>
              <i className="fa-solid fa-box"></i>
            </div>
            <div className={styles["card-title"]}>Sản Phẩm</div>
            <div className={styles["card-description"]}>
              Quản lý danh mục sản phẩm và thông tin chi tiết
            </div>
          </a>

          {/* Card 4: Materials */}
          <a href="/materials" className={styles.card}>
            <div className={styles["card-icon"]}>
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div className={styles["card-title"]}>ConsumptionLog</div>
            <div className={styles["card-description"]}>
              Quản lý danh mục nguyên liệu và thông tin chi tiết
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
