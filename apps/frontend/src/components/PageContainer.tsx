import type { ReactNode } from "react";

function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mt-20 flex flex-col gap-12 px-4">{children}</div>;
}

export default PageContainer;
