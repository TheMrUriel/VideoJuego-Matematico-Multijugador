// app/loading.tsx
import Spinner from "react-bootstrap/Spinner";

export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem",
        fontWeight: "bold",
        gap: "1rem",
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner animation="border" role="status" style={{ width: 64, height: 64 }} />
      <span>Cargando...</span>
    </div>
  );
}