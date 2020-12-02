import { WebClient } from "@slack/web-api";

const client = new WebClient(process.env.SLACK_TOKEN);

export async function uploadToSlack(fileNames: string[]) {
  let downTasks: Array<Promise<{ name: string; buf: ArrayBuffer }>> = [];
  fileNames.reduce((preTask, name) => {
    const task = preTask
      .catch(() => {})
      .then(async () => {
        const buf = await fetch(`http://192.168.0.1/img/${name}`).then((r) =>
          r.arrayBuffer()
        );
        return { name, buf } as const;
      });
    downTasks.push(task);
    return task;
  }, Promise.resolve() as Promise<unknown>);

  const upTasks = downTasks.map(async (task) => {
    const { buf, name } = await task;
    await client.files.upload({
      channels: "C01FRQV39JA",
      filename: name,
      filetype: name.endsWith("mp4") ? "mp4" : "jpg",
      file: Buffer.from(buf),
    });
  });

  await Promise.all(upTasks);
}
