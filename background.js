chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  startSimplySaid(details);
});
chrome.webNavigation.onCompleted.addListener((details) => {
  startSimplySaid(details);
});
function startSimplySaid(details) {
  console.log(
    "Simply Said start requested:",
  );
  // Check if the URL is a Disney+ play page and if it's the main frame
  if (details.url.includes("disneyplus.com/play") && details.frameId === 0) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      world: "MAIN",
      func: () => {
        if (window.simplySaidInitializing) {
          console.log("Simply Said: already started");
          return;
        }
        window.simplySaidInitializing = true;
        let started = tryToStart();
        function tryToStart() {
          const controls =
            document.querySelector('main-app-controls-overlay');

          if (!controls) {
            console.log("Simply Said: controls not ready");
            return false;
          }

          const disneyState = controls.stateStream$;

          if (!disneyState) {
            console.log("Simply Said: state stream not ready");
            return false;
          }

          window.simplySaidSubscription = disneyState.subscribe(state => {
            const playheadPositionMs =
              state.timeline?.timeline?.playheadPositionMs;

            window.postMessage({ type: "SIMPLY_SAID_TIME_UPDATE", currentTime: playheadPositionMs }, "*");
          });

          console.log("Simply Said: READY!");
          return true;
        }
        const observer = new MutationObserver(() => {
          if (started) {
            observer.disconnect();
          } else {
            started = tryToStart();
          }
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        function XMLHttpRequestOpenReplacement(method, url) {
          const parsedUrl = new URL(url, document.baseURI);
          if (parsedUrl.pathname.endsWith(".vtt")) {
            this.addEventListener("load", () => {
              console.log("Simply Said: VTT loaded:", url);
              const vttText = this.responseText;
              window.postMessage({ type: "SIMPLY_SAID_VTT", url, vttText }, "*");
            });
          }
          return originalOpen.apply(this, arguments);
        }
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = XMLHttpRequestOpenReplacement;
      }
    });
  }
}
