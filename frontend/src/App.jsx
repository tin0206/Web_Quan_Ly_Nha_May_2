import { Routes, Route } from "react-router-dom";
import IndexPage from "../pages/IndexPage";
import ProductionOrdersPage from "../pages/ProductionOrdersPage";
import ProductionOrderDetailpage from "../pages/ProductionOrderDetailPage";
import MaterialsPage from "../pages/MaterialsPage";
import RecipesPage from "../pages/RecipesPage";
import ProductsPage from "../pages/ProductsPage";
import RecipeDetailPage from "../pages/RecipeDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/production-orders" element={<ProductionOrdersPage />} />
      <Route
        path="/production-order-detail/:orderId"
        element={<ProductionOrderDetailpage />}
      />
      <Route path="/materials" element={<MaterialsPage />} />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/recipe-detail/:recipeId" element={<RecipeDetailPage />} />
    </Routes>
  );
}
