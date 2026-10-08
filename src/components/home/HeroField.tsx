"use client";

import { Field } from "@/components/field/Field";

/**
 * The hero field. Thin wrapper kept so the homepage keeps its own name for
 * the element; the geometry and pointer response now live in the shared Field
 * so section transitions can use the same system.
 */
export function HeroField() {
  return <Field mode="weave" interactive readout className="field-hero" />;
}
