(async () => {
  async function loadTestVtt() {
    const fileUrl = chrome.runtime.getURL("test.vtt");
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Could not load test.vtt: ${response.status}`);
    }

    const vttText = await response.text();

    console.log("Loaded VTT:");
    console.log(typeof vttText);
    return vttText;
  }
  // wait for the async function to complete before continuing
  const vttText = await loadTestVtt();
  let blocks = vttText.split("\n\n");
  let beginTime = "";
  let endTime = "";
  let text = "";
  for (const block of blocks) {
    // Skip blocks that don't contain a time range
    if (!block.includes("-->")) {
      continue;
    }
    beginTime = block.split("-->")[0].trim();
    // endTime is the time after the arrow, before any space
    endTime = block.split("-->")[1].trim().split(" ")[0];
    text = block.split("\n").slice(1).join("\n");

  }
})();

