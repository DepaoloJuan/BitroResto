import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const SUPABASE_URL = "https://xdhkeiezwojqoppogiuv.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkaGtlaWV6d29qcW9wcG9naXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjU3NDIsImV4cCI6MjA5NTEwMTc0Mn0.A23SQ3RgmGLNPCexwa6pBvTRgYWbpFPdCY6BFKaqOic";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const qrData = "com.bitroresto.app://cliente/anonimo";
const qrUrl = await QRCode.toDataURL(qrData);

const { error } = await supabase
  .from("mesas")
  .update({ qr_codigo: qrUrl })
  .eq("tipo", "entrada");

if (error) {
  console.error("Error:", error);
} else {
  console.log("QR de entrada actualizado ✓");
}
