import type { ReactNode } from "react";

function PageContainer({ children }: { children: ReactNode }) {
  return <div className="px-4 mt-20 flex flex-col gap-12">{children}</div>;
}

export default PageContainer;
