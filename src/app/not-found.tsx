import { LinkButton, PageHeader } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="404" title="Not a day in the cycle" lede="That page does not exist." />
      <LinkButton href="/">Back home</LinkButton>
    </>
  );
}
