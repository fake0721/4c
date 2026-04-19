export default function AuroraBackground() {
  return (
    <div className="aurora-layer" style={{ pointerEvents: 'none' }} aria-hidden="true">
      <div className="aurora-band aurora-band--blue"></div>
      <div className="aurora-band aurora-band--purple"></div>
      <div className="aurora-band aurora-band--green"></div>
      <div className="aurora-fade"></div>
    </div>
  );
}
