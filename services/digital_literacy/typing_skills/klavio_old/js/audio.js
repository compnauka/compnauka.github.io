'use strict';

const Audio = (() => {
  let ctx = null;

  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, type, duration, gainVal, startFreq) {
    try {
      const c = init();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(startFreq || freq, c.currentTime);
      if (startFreq) osc.frequency.exponentialRampToValueAtTime(freq, c.currentTime + duration * 0.4);
      gain.gain.setValueAtTime(gainVal || 0.25, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.start(); osc.stop(c.currentTime + duration + 0.01);
    } catch (e) {}
  }

  return {
    keyClick() {
      try {
        const c = init();
        const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random()*2-1) * Math.exp(-i/(c.sampleRate*0.008));
        const src = c.createBufferSource();
        const filter = c.createBiquadFilter();
        const gain = c.createGain();
        src.buffer = buf;
        filter.type = 'bandpass'; filter.frequency.value = 1800; filter.Q.value = 0.8;
        src.connect(filter); filter.connect(gain); gain.connect(c.destination);
        gain.gain.setValueAtTime(0.32, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
        src.start();
      } catch (e) {}
    },
    error()   { tone(180,'sawtooth',0.18,0.18,280); },
    levelUp() { [523,659,784,1046].forEach((f,i) => setTimeout(()=>tone(f,'sine',0.3,0.2),i*80)); },
    streak(n) { const f=600+n*30; tone(f,'sine',0.15,0.2,f*0.8); },
    spaceKey(){ tone(400,'sine',0.06,0.12); }
  };
})();
