"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080c10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
        fontFamily: "monospace",
        color: "#e2e8f0",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#ef4444", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        System Error
      </p>
      <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "420px" }}>
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem 1.5rem",
          background: "#00f5c4",
          color: "#000",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          fontWeight: "bold",
          letterSpacing: "0.1em",
        }}
      >
        Retry
      </button>
    </main>
  );
}
