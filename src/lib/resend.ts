const apiKey = process.env.RESEND_API_KEY;

let _resend: object | null = null;

function makeStub() {
  return {
    emails: {
      send: async () => ({ data: null, error: { message: "Resend not configured" } }),
    },
  };
}

export function getResend() {
  if (!_resend) {
    if (!apiKey) {
      console.warn("[resend] RESEND_API_KEY not set — using stub");
      _resend = makeStub();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Resend } = require("resend");
      _resend = new Resend(apiKey);
    }
  }
  return _resend as any;
}

