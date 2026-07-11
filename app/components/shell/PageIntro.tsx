interface PageIntroProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageIntro({ title, description, actions }: PageIntroProps) {
  return (
    <header className="page-intro">
      <div className="page-intro-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-intro-actions">{actions}</div> : null}
    </header>
  );
}