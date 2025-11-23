// In-memory slide state (resets on server restart, but fine for demo)
let currentSlide = 0;
const PRESENTER_TOKEN = process.env.PRESENTER_TOKEN || 'secret123';

export async function GET() {
  return Response.json({ slide: currentSlide });
}

export async function POST(request: Request) {
  const body = await request.json();

  // Verify presenter token
  if (body.token !== PRESENTER_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Update slide
  if (typeof body.slide === 'number') {
    currentSlide = body.slide;
  }

  return Response.json({ slide: currentSlide });
}
