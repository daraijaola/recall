import type { ReactNode } from "react";

interface PageHeaderProps {
  index: string;
  title: string;
  description: string;
  meta?: ReactNode;
}

export function PageHeader({ index, title, description, meta }: PageHeaderProps) {
  return (
    <header className="command-bar">
      <div className="command-bar-main">
        <p className="command-index">{index}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta ? <div className="command-bar-meta">{meta}</div> : null}
    </header>
  );
}