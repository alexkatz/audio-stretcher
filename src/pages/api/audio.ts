import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import { getIsValidYoutubeUrl } from '~/utils/validateYoutubeUrl';

export default function handler({ query: { url } }: NextApiRequest, res: NextApiResponse) {
  try {
    if (typeof url !== 'string' || !getIsValidYoutubeUrl(url)) {
      throw new Error('url must be a valid youtube url');
    }

    const result = ytdl(url, { filter: 'audioonly' });
    result.on('response', (response) => {
      res.writeHead(200, {
        ['Content-Length']: response.headers['content-length'],
        'Content-Type': 'audio/mp4',
      });
      result.pipe(res);
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
