import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

type SitemapEntry = {
  loc: string[];
  lastmod?: string[];
};

type SitemapResult = {
  urlset: {
    url: SitemapEntry[];
  };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = 'https://' + searchParams.get('url') + '.blogspot.com/sitemap.html';

  if (!url) {
    return NextResponse.json({ error: 'URLが必要です' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    const xml = await response.text();
    const result = await parseStringPromise(xml) as SitemapResult;

    const urls = result.urlset.url.map((entry: SitemapEntry) => {
      const loc = entry.loc[0] + '?m=1';
      return `<url><loc>${loc}</loc></url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(sitemap, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'サイトマップの解析に失敗しました' }, { status: 500 });
  }
}
