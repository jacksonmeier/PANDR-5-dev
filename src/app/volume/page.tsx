import type { Metadata } from "next";
import { VolumeScreen } from "@/components/VolumeScreen";

export const metadata: Metadata = { title: "Volume" };

export default function VolumePage() {
  return <VolumeScreen />;
}
