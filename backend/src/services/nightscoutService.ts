import https from 'https';
import http from 'http';

export interface NightscoutReading {
  sgv: number;
  direction: string;
  dateString: string;
  minutesAgo: number;
}

export async function fetchCurrentReading(
  nightscoutUrl: string,
  token: string
): Promise<NightscoutReading> {
  const url = new URL('/api/v1/entries/current.json', nightscoutUrl);
  if (token) url.searchParams.set('token', token);

  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    lib.get(url.toString(), (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const entries = JSON.parse(data);
          const entry = Array.isArray(entries) ? entries[0] : entries;
          const minutesAgo = Math.round((Date.now() - entry.date) / 60000);
          resolve({
            sgv: entry.sgv,
            direction: entry.direction ?? 'Flat',
            dateString: entry.dateString,
            minutesAgo,
          });
        } catch {
          reject(new Error('Error al parsear respuesta de Nightscout'));
        }
      });
    }).on('error', reject);
  });
}
