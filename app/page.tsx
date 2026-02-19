import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <main style={{ padding: "1rem" }}>
        <h1>Inicio</h1>
        <p>Contenido principal</p>

        <Link href="/Videojuego">Videojuego</Link>
      </main>
    </div>
  );
}
