(async () => {
  const hostname = window.location.hostname;
  const settings = await chrome.storage.local.get({
    enabled: false,
    nameRemoval: false,
    soundRemoval: false
  });
  let disneyplus = false;
  let netflix = false;
  //check if the extension is enabled and log a message to the console
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.enabled) {
        settings.enabled = changes.enabled.newValue;
        console.log(`Simply Said: Extension is now ${settings.enabled ? 'enabled' : 'disabled'}.`);
        if (disneyplus) {
          console.log("Simply Said: Disney+ detected");
          processDisneySubtitles();
        }
        if (netflix) {
          console.log("Simply Said: Netflix detected");
          processNetflixSubtitles();
        }
      }
      if (changes.soundRemoval) {
        settings.soundRemoval = changes.soundRemoval.newValue;
        console.log(`Simply Said: Sound removal is now ${settings.soundRemoval ? 'enabled' : 'disabled'}.`);
      }
      if (changes.nameRemoval) {
        settings.nameRemoval = changes.nameRemoval.newValue;
        console.log(`Simply Said: Name removal is now ${settings.nameRemoval ? 'enabled' : 'disabled'}.`);
      }
    }
  });
  if (hostname === "www.disneyplus.com") {
    startDisney();
    console.log("Simply Said: Disney+ detected, starting subtitle cleaning.");
  } else if (hostname === "www.netflix.com") {
    startNetflix();
    console.log("Simply Said: Netflix detected, starting subtitle cleaning.");
  }
  function startNetflix() {
    disneyplus = false;
    netflix = true;
    //listen for updates to the DOM, specifically the .player-timedtext element, and log a message when it is found
    const observer = new MutationObserver(processNetflixSubtitles);
    let subtitleElement = document.querySelector(".player-timedtext");
    function tryAttachObserver() {
      observer.observe(subtitleElement, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    if (subtitleElement) {
      console.log("Simply Said: .player-timedtext found in startNetflix");
      tryAttachObserver();
    } else {
      const tempObserver = new MutationObserver(() => {
        subtitleElement = document.querySelector(".player-timedtext");
        if (subtitleElement) {
          console.log("Simply Said: .player-timedtext found in tempObserver");
          tryAttachObserver();
          tempObserver.disconnect();
        }
      });
      tempObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  function startDisney() {
    disneyplus = true;
    netflix = false;
    //listen for updates to the DOM, specifically the timed-text-override-region element, and log a message when it is found
    const observer = new MutationObserver(processDisneySubtitles);
    let region = document.querySelector("timed-text-override-region");
    function tryAttachObserver() {
      observer.observe(region.shadowRoot, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    if (region?.shadowRoot) {
      console.log("Simply Said: timed-text-override-region found in startDisney");
      tryAttachObserver();
    } else {
      // Wait for the caption region and its shadow root to become available.
      const tempObserver = new MutationObserver(() => {
        region = document.querySelector("timed-text-override-region");
        if (region?.shadowRoot) {
          console.log("Simply Said: timed-text-override-region found in tempObserver");
          tryAttachObserver();
          tempObserver.disconnect();
        }
      });
      tempObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  function cleanSubtitleText(text) {
    let textToClean = text;
    if (settings.enabled) {
      // console.log("Simply Said: Cleaning subtitle text:", textToClean);
      if (settings.soundRemoval) {
        // Remove sound effects in parentheses or brackets, e.g. (applause) or [music]
        textToClean = textToClean.replace(/\([^)]*\)/g, "").trim();
        textToClean = textToClean.replace(/\[[^\]]*\]/g, "").trim();
        // console.log("Simply Said: Removing sound effects from subtitle text:", textToClean);
      }
      if (settings.nameRemoval) {
        textToClean = textToClean.replace(/^[A-Za-z][A-Za-z0-9 '-]*:(?=\s|$)/gm, "").trim();
        // console.log("Simply Said: Removing names from subtitle text:", textToClean);
      }
    }
    return textToClean;
  }
  function processNetflixSubtitles() {
    console.log("Simply Said: MutationObserver triggered for Netflix");
    const subtitleElement = document.querySelector(".player-timedtext");
    if (subtitleElement) {
      console.log("Subtitle container found:", Boolean(subtitleElement));
      let allSubtitles = subtitleElement.querySelectorAll("span")
      for (const subtitle of allSubtitles) {
        if (subtitle.querySelector("span")) {
          continue;
        }
        const before = subtitle.textContent;
        const after = cleanSubtitleText(before);

        if (before !== after) {
          console.log("Simply Said: Before:", JSON.stringify(before));
          console.log("Simply Said: After:", JSON.stringify(after));
          subtitle.textContent = after;
        }
      }
    }
  }
  function processDisneySubtitles() {
    const region = document.querySelector("timed-text-override-region");
    if (!region?.shadowRoot) {
      return;
    }
    const subtitleElement = region.shadowRoot.querySelector(".hive-subtitle-renderer-wrapper");
    if (subtitleElement) {
      let allSubtitles = subtitleElement.querySelectorAll(".hive-subtitle-renderer-line")
      for (const subtitle of allSubtitles) {
        if (subtitle.textContent !== cleanSubtitleText(subtitle.textContent)) {
          subtitle.textContent = cleanSubtitleText(subtitle.textContent);
        }
      }
    }
  }
})();

