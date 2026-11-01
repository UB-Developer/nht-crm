"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      size="sm"
      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1"
      onClick={() => window.print()}
    >
      <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
    </Button>
  );
}
