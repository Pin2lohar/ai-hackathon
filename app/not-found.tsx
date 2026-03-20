import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        That call does not exist or was removed.
      </p>
      <Link href="/" className={buttonVariants({ className: "rounded-xl" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
