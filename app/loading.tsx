export default function Loading() {
  return (
    <div
      style={{
        minHeight: '45vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 34,
            height: 34,
            margin: '0 auto 12px',
            borderRadius: 999,
            border: '3px solid #dfe9e4',
            borderTopColor: '#168553',
            animation: 'centralSpin .7s linear infinite',
          }}
        />
        <strong style={{ display: 'block', fontSize: 13, color: '#26483a' }}>Carregando...</strong>
        <span style={{ display: 'block', marginTop: 4, fontSize: 10, color: '#74847c' }}>Atualizando a produção</span>
        <style>{`@keyframes centralSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
