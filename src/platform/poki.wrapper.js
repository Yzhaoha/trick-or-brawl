// ======================= Poki SDK (v2) =======================
// Game-facing interface (CG.*) backed by the Poki SDK. Off Poki, or with the SDK blocked, every call is a quiet no-op.
// gameplayStart/Stop follow one "should be playing" flag and are only sent when the SDK-side state really changes,
// so they can never fire twice in a row (also across ads, which force a stop and restore play afterwards).
const CG = (() => {
  let sdk = null, playing = false, sdkPlaying = false, adBusy = false, adPlaying = false, loaded = false, share = '';
  const safe = f => { try { return f(); } catch (e) { return undefined; } };
  const sync = () => { const want = playing && !adBusy; if (!sdk || want === sdkPlaying) return; sdkPlaying = want; safe(() => want ? sdk.gameplayStart() : sdk.gameplayStop()); };
  const brk = done => { // commercial break: input blocked, gameplay stopped, sound off once the ad starts
    if (!sdk || adBusy) { done(); return; }
    let fin = false; const end = () => { if (fin) return; fin = true; clearTimeout(to); adBusy = false; adPlaying = false; document.getElementById('adblock').hidden = true; CG.applyMute(); done(); sync(); };
    adBusy = true; document.getElementById('adblock').hidden = false; sync();
    const to = setTimeout(end, 90000);
    try { Promise.resolve(sdk.commercialBreak(() => { adPlaying = true; CG.applyMute(); })).then(end, end); } catch (e) { end(); }
  };
  return {
    async init() {
      try {
        if (!window.__pkInit) return false;
        sdk = await Promise.race([window.__pkInit, new Promise(r => setTimeout(() => r(null), 3000))]);
        return !!sdk;
      } catch (e) { sdk = null; return false; }
    },
    get on() { return !!sdk; },
    get adBusy() { return adBusy; },
    get muted() { return adPlaying; },
    locale() { return null; },          // Poki has no locale call: the browser language is used
    deviceType() { return null; },
    dataGet() { return null; },         // progress lives in localStorage on Poki
    dataSet() {},
    loadingStop() { if (sdk && !loaded) { loaded = true; safe(() => sdk.gameLoadingFinished()); } },
    setPlaying(on) { playing = !!on; sync(); },
    happy() {},
    applyMute() { if (!actx) return; try { if (CG.muted) actx.suspend(); else if (actx.state === 'suspended') actx.resume(); } catch (e) {} },
    room(code) { if (!sdk || !code) return; safe(() => Promise.resolve(sdk.shareableURL({ room: String(code) })).then(u => { share = u || ''; }).catch(() => {})); },
    leftRoom() { share = ''; },
    inviteLink(code) { if (share) return share; const u = new URL(location.href); u.searchParams.set('room', code); return u.href; },
    inviteRoom() { return sdk ? (safe(() => sdk.getURLParam('room')) || null) : null; },
    instant() { return false; },
    onJoinRoom() {},
    onAuth() {},
    context() {},
    async userName() { return null; },
    midgame: brk,                       // between matches
    resumeBreak: brk,                   // resuming a solo match from pause
  };
})();
