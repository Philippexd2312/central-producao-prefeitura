import { downloadMetaMedia } from '@/lib/meta';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;

  try {
    const { bytes, mimeType } = await downloadMetaMedia(mediaId);
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=300',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('MEDIA_PROXY_ERROR', error);
    return new Response('Mídia indisponível', { status: 404 });
  }
}
