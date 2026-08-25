import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Central de Produção da Comunicação',
    short_name: 'Central Comunicação',
    description: 'Gestão de demandas, produção, aprovações e equipe da Comunicação.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#eef5f1',
    theme_color: '#0b3c29',
    orientation: 'portrait',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
