// Sirve desde `public/`, así que se referencia por URL y no por import.
// `BASE_URL` ya trae la barra final: en local es `/` y en GitHub Pages `/hackaton/`.
const ICON_URL = `${import.meta.env.BASE_URL}icon.png`

// Proporción del archivo original (608x449).
const RATIO = 449 / 608

/**
 * Isotipo Movistar (`public/icon.png`). El archivo es la "M" en blanco sobre
 * transparencia, así que sólo se lee sobre fondo azul: en superficies claras
 * usa `MovistarBadge`, que lo monta sobre un círculo de marca.
 */
export function MovistarLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={ICON_URL}
      alt="Movistar"
      width={size}
      height={Math.round(size * RATIO)}
      className={className}
      style={{ width: size, height: size * RATIO }}
    />
  )
}

/** El isotipo dentro de un círculo azul, para fondos claros. */
export function MovistarBadge({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`grid flex-none place-items-center rounded-full bg-brand ${className}`}
      style={{ width: size, height: size }}
    >
      <MovistarLogo size={size * 0.56} />
    </span>
  )
}
