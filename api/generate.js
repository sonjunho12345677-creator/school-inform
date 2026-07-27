// Vercel Serverless Function: api/generate.js
// NEIS Open API Proxy Handler with API Key Security

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { type, ...params } = req.query;

  // 요청 타입별 엔드포인트 매핑
  const endpoints = {
    school: 'https://open.neis.go.kr/hub/schoolInfo',
    meal: 'https://open.neis.go.kr/hub/MealServiceDietInfo',
    schedule: 'https://open.neis.go.kr/hub/SchoolSchedule'
  };

  if (!type || !endpoints[type]) {
    return res.status(400).json({ error: '유효하지 않은 API 요청 타입입니다. (type: school, meal, schedule 중 선택)' });
  }

  // 환경변수 또는 요청 파라미터에서 API 키 참조
  const apiKey = req.query.customApiKey || process.env.NEIS_API_KEY || 'sample';

  // NEIS API 파라미터 빌드
  const urlParams = new URLSearchParams({
    KEY: apiKey,
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ...params
  });

  // customApiKey는 NEIS API 전달 파라미터에서 제거
  urlParams.delete('customApiKey');

  const targetUrl = `${endpoints[type]}?${urlParams.toString()}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`NEIS API HTTP 오류: ${response.status}`);
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('NEIS API Proxy Error:', error);
    return res.status(500).json({ 
      error: '나이스 API 데이터를 불러오는 도중 오류가 발생했습니다.', 
      details: error.message 
    });
  }
}