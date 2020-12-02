import React, { useEffect, useMemo, useRef, useState } from "react";
import jsqr, { QRCode } from "jsqr";

type NetInfo = {
  ssid: string;
  psk: string;
};

const wifiRegex = /^WIFI:S:(.*);T:.*;P:(.*);;$/;

const Page = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState<QRCode | null>(null);
  const wifiInfo = useMemo(() => {
    const data = code?.data;
    if (data == null) return;
    if (!wifiRegex.test(data)) return;
    const [_, ssid, psk] = wifiRegex.exec(data) ?? [];
    return {
      ssid,
      psk,
    };
  }, [code?.data]);

  useEffect(() => {
    async function handleMedia() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current == null) return;
      const video = videoRef.current;

      video.srcObject = stream;

      video.width = 720;
      video.height = 480;

      await video.play();
    }
    handleMedia();
  }, []);

  useEffect(() => {
    if (videoRef.current == null || canvasRef.current == null) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx == null) return;

    const handle = window.setInterval(() => {
      const width = video.offsetWidth;
      const height = video.offsetHeight;

      canvas.setAttribute("width", `${width}`);
      canvas.setAttribute("height", `${height}`);

      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsqr(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      setCode(code);
    }, 500);
    return () => {
      window.clearInterval(handle);
    };
  }, []);

  useEffect(() => {
    async function handle() {
      try {
        if (wifiInfo == null) return;
        await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(wifiInfo),
        }).then((r) => r.json());
      } catch (e) {
        console.error(e);
      }
    }
    handle();
  }, [wifiInfo]);

  return (
    <main>
      <video ref={videoRef} />
      <div style={{ display: "none" }}>
        <canvas ref={canvasRef} />
      </div>
      <span>{code?.data}</span>
    </main>
  );
};

export default Page;
