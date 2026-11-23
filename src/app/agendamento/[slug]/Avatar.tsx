import styles from "./booking.module.css";

function initials(name: string) {
  const parts = name.replace(/^(dr|dra|prof)\.?\s+/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "•";
}

/** Foto do profissional ou do logo da clínica; sem foto, mostra as iniciais. */
export function Avatar({ name, photo, size = 44 }: { name: string; photo: string | null; size?: number }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" />
      ) : initials(name)}
    </span>
  );
}
