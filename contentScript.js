(async () => {
  //listen for updates to the DOM, specifically the timed-text-override-region element, and log a message when it is found
  const observer = new MutationObserver(async () => {
    const subtitleElement = region.shadowRoot.querySelector(".hive-subtitle-renderer-wrapper");
    if (subtitleElement) {
      let allSubtitles = subtitleElement.querySelectorAll(".hive-subtitle-renderer-line")
      for (const subtitle of allSubtitles) {
        if (subtitle.textContent !== await cleanSubtitleText(subtitle.textContent)) {
          console.log("Simply Said: Subtitle text updated:", subtitle.textContent);
          subtitle.textContent = await cleanSubtitleText(subtitle.textContent);
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
  async function cleanSubtitleText(text) {
    const settings = await chrome.storage.local.get({
      enabled: false,
      nameRemoval: false,
      soundRemoval: false
    });
    let textToClean = text;
    if (settings.enabled) {
      console.log("Simply Said: Cleaning subtitle text:", textToClean);
      if (settings.soundRemoval) {
        textToClean = textToClean.replace(/\([^)]*\)/g, "").trim();
        console.log("Simply Said: Removing sound effects from subtitle text:", textToClean);
      }
      if (settings.nameRemoval) {
        textToClean = textToClean.replace(/^[A-Z][A-Z0-9 '-]*:/gm, "").trim();
        console.log("Simply Said: Removing names from subtitle text:", textToClean);
      }
    }
    return textToClean;
  }
})();

