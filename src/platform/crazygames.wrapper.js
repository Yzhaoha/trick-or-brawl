// ======================= CrazyGames SDK (v3) =======================
// gameplayStart/Stop follow one "should be playing" flag and are only sent when the SDK-side state really changes.
const CG = (() => {
  let sdk = null, playing = false, sdkPlaying = false, adBusy = false, adPlaying = false, platMute = false;
  const call = f => { if (!sdk) return; try { f(sdk); } catch (e) {} };
  const sync = () => { const want = playing && !adBusy; if (!sdk || want === sdkPlaying) return; sdkPlaying = want; call(S => want ? S.game.gameplayStart() : S.game.gameplayStop()); };
  return {
    async init() {
      try {
        if (!window.__cgInit) return false;
        sdk = await Promise.race([window.__cgInit, new Promise(r => setTimeout(() => r(null), 8000))]);
        if (!sdk) return false;
        call(S => { platMute = !!(S.game.settings && S.game.settings.muteAudio); S.game.addSettingsChangeListener(st => { platMute = !!(st && st.muteAudio); CG.applyMute(); }); });
        CG.applyMute();
        return true;
      } catch (e) { sdk = null; return false; }
    },
    get on() { return !!sdk; },
    get adBusy() { return adBusy; },
    escPause: false,                     // Esc toggles pause only on Poki: CrazyGames reserves Esc
    get muted() { return adPlaying || platMute; },
    locale() { let l = null; call(S => { l = S.user.systemInfo.locale; }); return l; },
    deviceType() { let d = null; call(S => { d = S.user.systemInfo.device.type; }); return d; },
    dataGet(k) { let v = null; call(S => { if (S.data && S.data.getItem) v = S.data.getItem(k); }); return v; },
    dataSet(k, v) { call(S => { if (S.data && S.data.setItem) S.data.setItem(k, v); }); },
    loadingStop() { call(S => S.game.loadingStop()); },
    setPlaying(on) { playing = !!on; sync(); },
    happy() { call(S => S.game.happytime()); },
    applyMute() { if (!actx) return; try { if (CG.muted) actx.suspend(); else if (actx.state === 'suspended') actx.resume(); } catch (e) {} },
    room(code, joinable) { call(S => { if (S.game.updateRoom) S.game.updateRoom({ roomId: String(code), isJoinable: !!joinable, inviteParams: { room: String(code) } }); }); },
    leftRoom() { call(S => { if (S.game.leftRoom) S.game.leftRoom(); }); },
    inviteLink(code) { let l = null; call(S => { l = S.game.inviteLink({ room: String(code) }); }); if (l) return l; const u = new URL(location.href); u.searchParams.set('room', code); return u.href; },
    inviteRoom() { let r = null; call(S => { const p = S.game.inviteParams; r = (p && p.room) || (S.game.getInviteParam && S.game.getInviteParam('room')) || null; }); return r; },
    instant() { let v = false; call(S => { v = !!S.game.isInstantMultiplayer; }); return v; },
    onJoinRoom(fn) { call(S => { if (S.game.addJoinRoomListener) S.game.addJoinRoomListener(p => { if (p && p.room) fn(String(p.room)); }); }); },
    onAuth(fn) { call(S => { if (S.user.addAuthListener) S.user.addAuthListener(u => fn(u && u.username ? String(u.username) : null)); }); },
    context(o) { call(S => { if (S.game.setGameContext) S.game.setGameContext(o); }); },
    async userName() { if (!sdk) return null; try { if (!sdk.user.isUserAccountAvailable) return null; const u = await sdk.user.getUser(); return u && u.username ? String(u.username) : null; } catch (e) { return null; } },
    midgame(done) { // midgame ad between matches only; input is blocked while the request is pending, sound goes off when the ad really starts
      if (!sdk || adBusy) { done(); return; }
      let fin = false; const end = () => { if (fin) return; fin = true; clearTimeout(to); adBusy = false; adPlaying = false; document.getElementById('adblock').hidden = true; CG.applyMute(); done(); sync(); };
      adBusy = true; document.getElementById('adblock').hidden = false; sync();
      const to = setTimeout(end, 90000);
      try { sdk.ad.requestAd('midgame', { adStarted() { adPlaying = true; CG.applyMute(); }, adFinished: end, adError: end }); } catch (e) { end(); }
    },
    resumeBreak: null,                  // CrazyGames: no ad on resume, midgame ads only between matches
  };
})();
