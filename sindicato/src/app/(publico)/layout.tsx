export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <main className="publico">
      <div className="publico-marca">
        <span className="logo">✊</span>
        <strong>SindGestão</strong>
        <p>Gestão completa para sindicatos de trabalhadores</p>
      </div>
      {children}
    </main>
  );
}
