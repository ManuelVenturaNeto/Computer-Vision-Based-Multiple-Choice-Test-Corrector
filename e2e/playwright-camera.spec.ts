import { test, expect } from "@playwright/test";

test.use({
  permissions: ["camera"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  },
});

test("camera preview renders frames in localhost flow", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("button", { name: /Ler Gabarito Referência/i }).click();

  await page.waitForSelector("video", { state: "visible", timeout: 10000 });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const video = document.querySelector("video");
    if (!(video instanceof HTMLVideoElement)) {
      return null;
    }

    return {
      readyState: video.readyState,
      paused: video.paused,
      currentTime: video.currentTime,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      hasStream: Boolean(video.srcObject),
    };
  });

  expect(info).not.toBeNull();
  expect(info?.hasStream).toBeTruthy();
  expect(info?.paused).toBeFalsy();
  expect(info?.videoWidth).toBeGreaterThan(0);
  expect(info?.videoHeight).toBeGreaterThan(0);
  expect(info?.currentTime).toBeGreaterThan(0);
});
