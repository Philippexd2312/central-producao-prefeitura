import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
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
          fontSize: 250,
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
