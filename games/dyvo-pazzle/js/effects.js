export class Feedback {
  constructor() {
    this.audioContext = null;
  }

  correct() {
    this.tone('correct');
    navigator.vibrate?.(18);
  }

  wrong() {
    navigator.vibrate?.(12);
  }

  win() {
    this.tone('win');
    navigator.vibrate?.([35, 45, 70]);
  }

  tone(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext ??= new AudioCtx();
      const ctx = this.audioContext;
      if (ctx.state === 'suspended') ctx.resume?.();
      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(type === 'win' ? 523 : 660, now);
      if (type === 'win') oscillator.frequency.exponentialRampToValueAtTime(880, now + .22);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(type === 'win' ? .10 : .05, now + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, now + (type === 'win' ? .34 : .12));
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + (type === 'win' ? .36 : .14));
    } catch (_) {
      // Feedback is optional.
    }
  }
}

export class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.raf = 0;
  }

  start() {
    this.clear();
    const canvas = this.canvas;
    const ctx = canvas.getContext('2d');
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const colors = ['#ff4f91', '#7047eb', '#ffc83d', '#49d17d', '#3dd9eb', '#ff6969'];
    const particles = Array.from({ length: 84 }, (_, index) => ({
      x: window.innerWidth * (.2 + Math.random() * .6),
      y: window.innerHeight + 20 + Math.random() * 120,
      vx: (Math.random() - .5) * 8,
      vy: -8 - Math.random() * 9 - (index % 5),
      size: 6 + Math.random() * 8,
      gravity: .16 + Math.random() * .07,
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - .5) * .22,
      color: colors[index % colors.length]
    }));

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      for (const p of particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.spin += p.spinSpeed;
        if (p.y < window.innerHeight + 50) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * .66);
        ctx.restore();
      }
      if (alive) this.raf = requestAnimationFrame(animate);
    };
    animate();
  }

  clear() {
    cancelAnimationFrame(this.raf);
    const ctx = this.canvas?.getContext('2d');
    if (ctx && this.canvas.width && this.canvas.height) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
