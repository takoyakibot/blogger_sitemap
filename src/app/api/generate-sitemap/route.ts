import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import JSZip from 'jszip';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const fullUrl = 'https://' + url + '.blogspot.com/sitemap.xml';

  try {
    const response = await fetch(fullUrl);
    const xml = await response.text();
    const result = await parseStringPromise(xml);

    const zip = new JSZip();
    let sitemapIndexEntries: string[] = [];

    if (result.urlset) {
      // 単一のサイトマップの場合
      const urls = result.urlset.url.map((entry: { loc: string[] }) => {
        const loc = entry.loc[0] + '?m=1';
        return `<url><loc>${loc}</loc></url>`;
      });

      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
      zip.file('sitemap1.xml', sitemapContent);
      sitemapIndexEntries.push(`<sitemap><loc>sitemap1.xml</loc></sitemap>`);

    } else if (result.sitemapindex) {
      // 複数のサイトマップの場合
      const sitemapPromises = result.sitemapindex.sitemap.map(async (entry: { loc: string[] }, index: number) => {
        const loc = entry.loc[0];
        const sitemapResponse = await fetch(loc);
        const sitemapXml = await sitemapResponse.text();
        const sitemapResult = await parseStringPromise(sitemapXml);

        const urls = sitemapResult.urlset.url.map((entry: { loc: string[] }) => {
          return `<url><loc>${entry.loc[0]}?m=1</loc></url>`;
        });

        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
        const filename = `sitemap${index + 1}.xml`;
        zip.file(filename, sitemapContent);
        sitemapIndexEntries.push(`<sitemap><loc>${filename}</loc></sitemap>`);
      });

      await Promise.all(sitemapPromises);
    }

    // sitemapindex.xmlを作成
    const sitemapIndexContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapIndexEntries.join('\n')}\n</sitemapindex>`;
    zip.file('sitemap.xml', sitemapIndexContent);

    // ZIPファイルを生成してレスポンスとして返す
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="sitemaps.zip"',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'サイトマップの解析に失敗しました' }, { status: 500 });
  }
}
