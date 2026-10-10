/**
 * Wraps every page. Unlike the layout, a template is re-mounted on each
 * navigation, which is what restarts the arrival animation in .page-enter so a
 * new page fades and settles into place. Nothing else lives here.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
