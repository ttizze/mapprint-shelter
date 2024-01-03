import prisma from '../lib/prisma'
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { openai } from '../lib/openai'
import { type Document } from '@prisma/client'
import fs from 'fs'
import path from 'path'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('process.env.OPENAI_API_KEY is not defined. Please set it.')
}

if (!process.env.POSTGRES_URL) {
  throw new Error('process.env.POSTGRES_URL is not defined. Please set it.')
}
async function main() {
    // public/pdfディレクトリのパスを取得
  const pdfDir = path.join(process.cwd(), 'public', 'pdf');

  // public/pdfディレクトリ内のすべてのファイル名を取得
  const fileNames = fs.readdirSync(pdfDir);

  // PDFファイルのみをフィルタリング
  const pdfFileNames = fileNames.filter(fileName => path.extname(fileName).toLowerCase() === '.pdf');

  // 各PDFファイルを読み込む
  const loaders = pdfFileNames.map(fileName => {
    const filePath = path.join(pdfDir, fileName);
    const link = `/pdf/${fileName}`; 
    return { loader: new PDFLoader(filePath), link };
  });
  

  
  for (const { loader, link } of loaders) {
    const splitter = new CharacterTextSplitter({
      separator: " ",
      chunkSize: 512,
      chunkOverlap: 24,
    });


    const res_pdf = await loader.load()
    for (let i = 0; i < res_pdf.length; i++) {
      const str = res_pdf[i].pageContent.replace(/\n/g, " ").replace(/,/g, "");
      const page = res_pdf[i];
      const title = page.metadata.pdf.info.Title;
      const author = page.metadata.pdf.info.Author;
      const pageNo = page.metadata.loc.pageNumber;
      console.log(title, author, pageNo);

      const metadatas = [
        { title: title, author: author, language: "en", pageNo: pageNo, link: link },
      ];
      const documents = await splitter.createDocuments([str], metadatas);

      for (const record of documents) {
        const { pageContent, metadata } = record;


        // Generate the embedding
        const embedding = await generateEmbedding(pageContent);
        //   // Create the wisdom in the database
        const document = await prisma.document.create({
            data: {
        content: pageContent,
        title: metadata.title,
        author: metadata.author,
        pageNo: metadata.pageNo,
        link: metadata.link,
        language: metadata.language,
        type: 'pdf',
            },
          })

          await prisma.$executeRaw`
            UPDATE document
            SET embedding = ${embedding}::vector
            WHERE id = ${document.id}
        `

        console.log(`Added ${document.title} by ${document.author}`)
      }
    }
  }
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

async function generateEmbedding(_input: string) {
  const input = _input.replace(/\n/g, ' ')
  const embeddingData = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input,
  })
  const [{ embedding }] = (embeddingData as any).data
  return embedding
}

