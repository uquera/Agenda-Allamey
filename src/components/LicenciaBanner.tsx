import { AlertTriangle, XCircle } from "lucide-react"
import { LicenciaStatus } from "@/lib/licencia"

export default function LicenciaBanner({ licencia }: { licencia: LicenciaStatus }) {
  if (!licencia.existe || !licencia.mostrarBanner) return null

  const esCritico = licencia.suspendida || licencia.diasRestantes <= 0
  const contacto = process.env.NEXT_PUBLIC_GOBERNANZA_CONTACTO ?? "hypnosapps@gmail.com"

  return (
    <div className={`flex items-center gap-3 px-4 py-3 text-sm font-medium text-white ${esCritico ? "bg-red-700" : "bg-red-500"}`}>
      {esCritico ? <XCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span>
        {esCritico
          ? "Tu suscripción ha vencido. El sistema está en modo de solo lectura."
          : `Tu suscripción vence en ${licencia.diasRestantes} día${licencia.diasRestantes === 1 ? "" : "s"}.`}
        {" "}
        Envía tu comprobante de pago a{" "}
        <a href={`mailto:${contacto}`} className="underline underline-offset-2">
          {contacto}
        </a>
        .
      </span>
    </div>
  )
}
