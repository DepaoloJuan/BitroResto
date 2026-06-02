import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const SUPABASE_URL = "https://xdhkeiezwojqoppogiuv.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaGtlaWV6d29qcW9wcG9naXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjU3NDIsImV4cCI6MjA5NTEwMTc0Mn0.A23SQ3RgmGLNPCexwa6pBvTRgYWbpFPdCY6BFKaqOic"; // service role, no anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: mesas, error } = await supabase
  .from("mesas")
  .select("id, numero")
  .not("tipo", "in", '("entrada","propinas")');

if (error) {
  console.error("Error al obtener mesas:", error);
  process.exit(1);
}

console.log(`Regenerando QR para ${mesas.length} mesas...`);

for (const mesa of mesas) {
  const qrData = `com.bitroresto.app://cliente/mesa?id=${mesa.id}`;
  const qrUrl = await QRCode.toDataURL(qrData);

  const { error: updateError } = await supabase
    .from("mesas")
    .update({ qr_codigo: qrUrl })
    .eq("id", mesa.id);

  if (updateError) {
    console.error(`Error en mesa ${mesa.numero}:`, updateError);
  } else {
    console.log(`Mesa ${mesa.numero} ✓`);
  }
}

console.log("Listo.");
