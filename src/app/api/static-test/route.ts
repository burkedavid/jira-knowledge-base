export async function GET() {
  return new Response('Static test endpoint working!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST() {
  return new Response('POST method working!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
} 