/* eslint-disable no-console */
import { ChromaClient, IncludeEnum, type Metadata } from 'chromadb';

const COLLECTION_NAME = 'eu-2024-election-chatbot';

/**
 * Small helper to list stored segments and metadata from a Chroma collection.
 *
 * Usage (requires ts-node or tsx):
 *   CHROMA_COLLECTION=my-collection CHROMA_PATH=http://localhost:8000 npx ts-node --esm ./scripts/listAll.ts
 *   CHROMA_COLLECTION=my-collection CHROMA_PATH=http://localhost:8000 npx tsx ./scripts/listAll.ts
 *
 * Env vars:
 *   CHROMA_COLLECTION (required) - collection name to inspect
 *   CHROMA_PATH (optional)       - Chroma server path (default http://localhost:8000)
 *   LIMIT (optional)             - max segments to fetch
 */
async function main(): Promise<void> {
  if (!COLLECTION_NAME) {
    throw new Error('Set CHROMA_COLLECTION to the collection you want to inspect.');
  }

  const chromaPath = process.env.CHROMA_PATH || 'http://localhost:8000';
  const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;

  const client = new ChromaClient({ path: chromaPath });
  const collection = await client.getCollection({
    name: COLLECTION_NAME,
    // Embedding function not needed for read-only access; satisfy typings.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    embeddingFunction: undefined as any
  });

  const count = await collection.count();
  const result = await collection.get({
    limit,
    include: [IncludeEnum.Documents, IncludeEnum.Metadatas]
  });

  type Seg = {
    id: string;
    segmentIndex: number;
    source?: string;
    title?: string;
    preview: string;
  };

  const docs = new Map<string, Array<Seg>>();

  result.ids.forEach((id, idx) => {
    const meta = result.metadatas?.[idx] as Metadata | null;
    const docId = meta?.documentId ? String(meta.documentId) : 'unknown';
    const rawSegmentIndex = meta?.segmentIndex;
    const segmentIndex =
      typeof rawSegmentIndex === 'number'
        ? rawSegmentIndex
        : typeof rawSegmentIndex === 'string'
          ? Number(rawSegmentIndex)
          : 0;
    const preview = String(result.documents?.[idx] || '')
      .slice(0, 120)
      .replace(/\s+/g, ' ');

    const seg: Seg = {
      id,
      segmentIndex,
      source: meta?.source ? String(meta.source) : undefined,
      title: meta?.title ? String(meta.title) : undefined,
      preview: `${preview}${preview.length === 120 ? '…' : ''}`
    };

    if (!docs.has(docId)) docs.set(docId, []);
    docs.get(docId)!.push(seg);
  });

  // Sort segments within each doc by segmentIndex
  docs.forEach((segs) => segs.sort((a, b) => a.segmentIndex - b.segmentIndex));

  console.log(`Collection: ${collection.name}`);
  console.log(`Total segments: ${count}`);
  console.log(`Fetched: ${result.ids.length}${limit ? ` (limit ${limit})` : ''}`);
  console.log(`Unique documentIds (${docs.size}): ${[...docs.keys()].join(', ')}`);
  console.log('\nDocuments and segments:');
  docs.forEach((segs, docId) => {
    const title = segs.find((s) => s.title)?.title;
    const source = segs.find((s) => s.source)?.source;

    console.log(`\n===== Document ${docId} (${segs.length} segments) =====`);
    if (title) console.log(`Title : ${title}`);
    if (source) console.log(`Source: ${source}`);
    if (title || source) console.log(''); // spacing before segments

    segs.forEach((seg) => {
      console.log(`  [${seg.segmentIndex}] ${seg.preview}`);
    });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
