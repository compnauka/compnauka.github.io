window.ServerRescueModules = window.ServerRescueModules || {};

window.ServerRescueModules.createSoundFX = function createSoundFX() {
    return {
        ctx: null,
        init() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            if (!this.ctx) {
                this.ctx = new AudioContext();
            } else if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        },
        playTone(freq, type, startTime, duration, vol = 0.1) {
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        },
        playClick() {
            if (this.ctx) {
                this.playTone(800, 'sine', this.ctx.currentTime, 0.1, 0.05);
            }
        },
        playSuccess() {
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
                this.playTone(freq, 'sine', now + (index * 0.1), 0.3, 0.1);
            });
        },
        playZap() {
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    };
};

window.ServerRescueModules.createSparks = function createSparks(x, y, particleColors) {
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 20; index++) {
        const spark = document.createElement('div');
        spark.classList.add('spark');

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 60 + 20;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity + 50;

        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.backgroundColor = particleColors[Math.floor(Math.random() * particleColors.length)];

        fragment.appendChild(spark);

        const animation = spark.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], { duration: 500 + Math.random() * 300, easing: 'cubic-bezier(0, .9, .57, 1)' });

        animation.onfinish = () => spark.remove();
    }

    document.body.appendChild(fragment);
};

window.ServerRescueModules.shuffleArray = function shuffleArray(array) {
    for (let index = array.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }

    return array;
};
