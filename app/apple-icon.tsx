import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0b3c29 0%, #168553 58%, #2fbb71 100%)',
          color: '#ffffff',
          fontSize: 88,
          fontWeight: 900,
          letterSpacing: '-0.08em',
        }}
      >
        C
      </div>
    ),
    size,
  );
}
