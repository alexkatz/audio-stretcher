import { pipeline } from 'stream/promises';
import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import { HEADER_KEYS } from 'src/common/headerKeys';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url } = req.query;
    if (typeof url !== 'string' || !ytdl.validateURL(url)) {
      throw new Error('url must be a valid youtube url');
    }

    await pipeline(
      ytdl(url, { filter: 'audioonly' })
        .on('response', response => {
          res.setHeader(HEADER_KEYS.CONTENT_LENGTH, response.headers['content-length']);
        })
        .on('info', info => {
          res.setHeader(HEADER_KEYS.CONTENT_TITLE, info?.videoDetails?.title);
        }),
      res,
    );
  } catch (error) {
    console.log(error);
  }
}
