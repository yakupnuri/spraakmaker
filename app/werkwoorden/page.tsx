"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function WerkwoordenRedirectPage() {
  useEffect(() => {
    redirect("/grammatica");
  }, []);

  return null;
}
