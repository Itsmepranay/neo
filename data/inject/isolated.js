/* Tests:
  http://www2.stat.duke.edu/~cc248/jsphylosvg/js/yui/tests/event/tests/manual/window-focus-test.html
  https://page-visibility.vercel.app/
  https://codepen.io/calebnance/full/nXPaKN
*/
if (typeof browser === "undefined") {
  var browser = chrome;
}
var port;
try {
  port = document.getElementById("lwys-ctv-port");
  port.remove();
} catch (e) {
  port = document.createElement("span");
  port.id = "lwys-ctv-port";
  document.documentElement.append(port);
}
port.dataset.hidden = document.hidden;
port.dataset.enabled = true;

port.addEventListener("state", () => {
  port.dataset.hidden = document.hidden;
});

var update = () =>
  browser.storage.local.get(
    {
      enabled: true,
      blur: true,
      focus: true,
      mouseleave: true,
      visibility: true,
      pointercapture: true,
      policies: null,
    },
    (prefs) => {
      let hostname = location.hostname;
      try {
        hostname = parent.location.hostname;
      } catch (e) {}

      prefs.policies = prefs.policies ?? {};
      const policy = prefs.policies[hostname] || [];

      port.dataset.enabled = prefs.enabled;
      port.dataset.blur = policy.includes("blur") ? false : prefs.blur;
      port.dataset.focus = policy.includes("focus") ? false : prefs.focus;
      port.dataset.mouseleave = policy.includes("mouseleave") ? false : prefs.mouseleave;
      port.dataset.visibility = policy.includes("visibility") ? false : prefs.visibility;
      port.dataset.pointercapture = policy.includes("pointercapture")
        ? false
        : prefs.pointercapture;
    }
  );
update();
browser.storage.onChanged.addListener(update);
