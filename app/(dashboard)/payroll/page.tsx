import PayrollClient from "@/components/payroll/PayrollClient";
import { auth } from "@/lib/auth";

export default async function PayrollPage() {
  const session = await auth();
  return <PayrollClient session={session} />;
}
