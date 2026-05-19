import crypto from 'crypto';

function decrypt(enc) {
  try {
    const key = Buffer.from('38346591');
    const decipher = crypto.createDecipheriv('des-ecb', key, '');
    decipher.setAutoPadding(false);
    let dec = Buffer.concat([decipher.update(Buffer.from(enc, 'base64')), decipher.final()]);
    let url = dec.toString('ascii').replace(/\0/g, '').trim();
    return url.replace('http://', 'https://').replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');
  } catch(e) {
    return `https://aac.saavncdn.com/${enc.replace('ID2ie', '')}_320.mp4`;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const r = await fetch(
      `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(query)}&_format=json&_marker=0&ctx=wap6dot0&n=1&p=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.jiosaavn.com/' } }
    );
    const data = await r.json();
    const song = data?.results?.[0];
    if (!song) return res.status(404).json({ error: 'Not found' });

    const url = decrypt(song.encrypted_media_url);
    return res.status(200).json({
      url,
      title: song.song || query,
      artist: song.singers || 'Unknown',
      duration: parseInt(song.duration || 0),
      image: (song.image || '').replace('150x150', '500x500')
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
