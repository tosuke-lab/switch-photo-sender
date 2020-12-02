import React, { useEffect, useRef } from "react";

const Page = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(async () => {
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
  }, []);
  return (
    <main>
      <video ref={videoRef} />
    </main>
  );
};

export default Page;
