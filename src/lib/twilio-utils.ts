export function twiml(content: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`, {
    headers: { "Content-Type": "application/xml" }
  });
}
