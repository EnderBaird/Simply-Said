(async () => {
  let captionData = [];
  // Listen for messages from the background script
  window.addEventListener("message", (event) => {
    // Check if the message is from the background script and contains VTT text
    if (event.data?.type === "SIMPLY_SAID_VTT" && event.source === window && typeof event.data.vttText === "string") {
      console.log("Simply Said: VTT received:");
      captionData.push(...parseVtt(event.data.vttText));
      console.log("Simply Said: Captions parsed:");
    }
    // Check if the message is from the background script and contains a time update
    if (event.data?.type === "SIMPLY_SAID_TIME_UPDATE" && event.source === window) {
      const currentTime = event.data.currentTime;
      // Find the caption that corresponds to the current time
      const currentCaption = captionData.find((cue) => currentTime >= cue.startMs && currentTime < cue.endMs);
      if (currentCaption) {
        // console.log(`Simply Said: Current caption: ${currentCaption.text}`);
      }
    }
  });
  //listen for updates to the DOM, specifically the timed-text-override-region element, and log a message when it is found
  const observer = new MutationObserver(() => {
    const subtitleElement = region.shadowRoot.querySelector(".hive-subtitle-renderer-wrapper");
    if (subtitleElement) {
      let allSubtitles = subtitleElement.querySelectorAll(".hive-subtitle-renderer-line")
      for (const subtitle of allSubtitles) {
        if (subtitle.textContent !== cleanSubtitleText(subtitle.textContent)) {
          console.log("Simply Said: Subtitle text updated:", subtitle.textContent);
          subtitle.textContent = cleanSubtitleText(subtitle.textContent);
        }
      }
    }
  });
  let region = document.querySelector("timed-text-override-region");
  // a temporary observer to wait for the timed-text-override-region to be added to the DOM
  const tempObserver = new MutationObserver(() => {
    region = document.querySelector("timed-text-override-region");
    if (region?.shadowRoot) {
      console.log("Simply Said: timed-text-override-region found in tempObserver");
      observer.observe(region.shadowRoot, {
        childList: true,
        characterData: true,
        subtree: true
      });
      tempObserver.disconnect();
    }
  });
  tempObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
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
  function parseVtt(vttText) {
    // wait for the async function to complete before continuing
    let blocks = vttText.split("\n\n");
    let beginTimeString = "";
    let endTimeString = "";
    let beginTime = 0;
    let endTime = 0;
    let text = "";
    const cues = [];
    for (const block of blocks) {
      // Skip blocks that don't contain a time range
      if (!block.includes("-->")) {
        continue;
      }
      beginTimeString = block.split("-->")[0].trim();
      // endTime is the time after the arrow, before any space
      endTimeString = block.split("-->")[1].trim().split(" ")[0];
      const lines = block.split("\n")
      //skip the first line, which is the time range, and join the rest of the lines into a single string
      text = lines.slice(1).join("\n");
      beginTime = getTimeInMs(beginTimeString);
      endTime = getTimeInMs(endTimeString);
      cues.push({ startMs: beginTime, endMs: endTime, text: text });
    }
    return cues;
  }
  parseVtt(await loadTestVtt());
  function getTimeInMs(timeString) {
    const [hours, minutes, seconds] = timeString.split(":");
    const [secs, ms] = seconds.split(".");
    const totalMs = parseInt(hours.trim()) * 3600000 + parseInt(minutes.trim()) * 60000 + parseInt(secs.trim()) * 1000 + parseInt(ms.trim());
    return totalMs;
  }
  function cleanSubtitleText(text) {
    const cleaned = text.replace(/\([^)]*\)/g, "").trim();
    const cleanedWithoutNames = cleaned.replace(/^[A-Z][A-Z0-9 '-]*:/gm, "").trim();
    return cleanedWithoutNames;
  }
})();

