/* Count link and button clicks with the existing GoatCounter script.
   Event names stay generic: nicknames and paths only, never a real name. */
(function () {
  "use strict";

  var pending = [];
  var timer = 0;

  function collapsedText(el) {
    var raw = el.getAttribute("aria-label") || el.textContent || "";
    return raw.replace(/\s+/g, " ").trim();
  }

  function buttonLabel(el) {
    var text = collapsedText(el).replace(/ellie/ig, "").replace(/\s+/g, " ").trim();
    var sentence = text.indexOf(". ");
    if (sentence > 0) text = text.slice(0, sentence);
    if (text.length > 48) text = text.slice(0, 48).trim();
    return text || "button";
  }

  function safePath(pathname) {
    if (!pathname) return "/";
    if (/ellie/i.test(pathname)) return "/file";
    return pathname;
  }

  function eventName(el) {
    var tag = el.tagName;
    if (tag === "BUTTON" || el.hasAttribute("download") || el.classList.contains("button")) {
      return "family/btn: " + buttonLabel(el);
    }
    if (tag !== "A" || !el.href) return "";
    var url;
    try {
      url = new URL(el.href, location.href);
    } catch (err) {
      return "";
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.origin === location.origin) {
      return "family/nav: " + safePath(url.pathname);
    }
    return "family/out: " + url.hostname + url.pathname;
  }

  function send(name) {
    window.goatcounter.count({
      path: name,
      event: true,
      title: "",
      referrer: ""
    });
  }

  function flush() {
    if (!window.goatcounter || typeof window.goatcounter.count !== "function") return false;
    while (pending.length) send(pending.shift());
    return true;
  }

  function arm() {
    if (timer || flush()) return;
    var tries = 0;
    timer = setInterval(function () {
      tries += 1;
      if (flush() || tries > 40) {
        clearInterval(timer);
        timer = 0;
      }
    }, 100);
  }

  document.addEventListener("click", function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest("a, button") : null;
    if (!el) return;
    var name = eventName(el);
    if (!name) return;
    pending.push(name);
    arm();
  });
})();
