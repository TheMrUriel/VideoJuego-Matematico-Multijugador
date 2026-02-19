// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",

        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>404</h1>
      <h2 style={{ marginBottom: "1rem" }}>Página no encontrada</h2>
      <p style={{ marginBottom: "2rem" }}>
        Lo sentimos, la página que buscas no existe.
      </p>
      <Link
        href="/"
        style={{
          padding: "0.5rem 1.5rem",
          background: "#0070f3",
          color: "#fff",
          borderRadius: "4px",
          textDecoration: "none",
        }}
        className="notfound-home-btn"
      >
        Volver al inicio
      </Link>
    </div>
  );
}