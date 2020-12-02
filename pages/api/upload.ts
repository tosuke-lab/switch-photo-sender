import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import childProcess from "child_process";
import { connect } from "lib/connect-wlan";
import { uploadToSlack } from "lib/upload-slack";

type Middleware<R> = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: (result: R | Error) => void
) => void;

function runMiddleware<R>(
  req: NextApiRequest,
  res: NextApiResponse,
  middleware: Middleware<R>
): Promise<R> {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      } else {
        return resolve(result);
      }
    });
  });
}

const cors: Middleware<void> = Cors({
  methods: ["GET", "HEAD", "POST"],
}) as any;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, cors);
  if (req.method !== "POST") {
    res.status(400).json({ error: "POST" });
    return;
  }
  const { ssid, psk } = req.body;
  if (typeof ssid !== "string") {
    res.status(400).json({ error: "ssid is string" });
    return;
  }
  if (typeof psk !== "string") {
    res.status(400).json({ error: "psk is string" });
  }
  try {
    // childProcess.execSync(`yarn ts-node lib/connect-wlan.ts ${ssid} ${psk}`);
    await connect(ssid, psk);
    console.log("connected");
    await new Promise((r) => setTimeout(r, 5000));
    console.log("ip fetched");
    const data = await fetch("http://192.168.0.1/data.json").then((r) =>
      r.json()
    );
    console.log("data fetched");
    await uploadToSlack(data.FileNames);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal error" });
  }

  res.end();
};
