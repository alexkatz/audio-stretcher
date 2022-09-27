import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import { pipeline } from 'stream/promises';
import { HEADER_KEYS } from 'src/common/HeaderKey';

export default async function handler({ query: { url } }: NextApiRequest, res: NextApiResponse) {
  try {
    if (typeof url !== 'string' || !ytdl.validateURL(url)) {
      throw new Error('url must be a valid youtube url');
    }

    await pipeline(
      ytdl(url, { filter: 'audioonly' })
        .on('response', (response) => {
          res.setHeader(HEADER_KEYS.CONTENT_LENGTH, response.headers['content-length']);
        })
        .on('info', (info) => {
          res.setHeader(HEADER_KEYS.CONTENT_TITLE, info?.videoDetails?.title);
        }),
      res,
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}
