const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 8123;
const DEBUG_PORT = 9222;
const ROOT = process.cwd();

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(fn, { timeout = 15000, interval = 200, label = 'condition' } = {}) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
        try {
            const value = await fn();
            if (value) {
                return value;
            }
        } catch (error) {
            void error;
        }
        await delay(interval);
    }

    throw new Error(`Timed out waiting for ${label}`);
}

function startProcess(command, args, options = {}) {
    const child = spawn(command, args, {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options
    });

    child.stdout.on('data', chunk => {
        process.stdout.write(String(chunk));
    });

    child.stderr.on('data', chunk => {
        process.stderr.write(String(chunk));
    });

    return child;
}

async function stopProcess(child) {
    if (!child || child.killed) {
        return;
    }

    child.kill('SIGTERM');
    await Promise.race([
        new Promise(resolve => child.once('exit', resolve)),
        delay(3000)
    ]);

    if (!child.killed) {
        child.kill('SIGKILL');
    }
}

async function connectToCdp(wsUrl) {
    const socket = new WebSocket(wsUrl);
    const pending = new Map();
    let messageId = 0;

    socket.addEventListener('message', event => {
        const payload = JSON.parse(String(event.data));
        if (payload.id && pending.has(payload.id)) {
            const { resolve, reject } = pending.get(payload.id);
            pending.delete(payload.id);
            if (payload.error) {
                reject(new Error(payload.error.message || 'CDP error'));
                return;
            }
            resolve(payload.result);
        }
    });

    await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
    });

    return {
        async send(method, params = {}) {
            const id = ++messageId;
            const response = new Promise((resolve, reject) => {
                pending.set(id, { resolve, reject });
            });
            socket.send(JSON.stringify({ id, method, params }));
            return response;
        },
        close() {
            socket.close();
        }
    };
}

async function evaluate(cdp, expression) {
    const result = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true
    });
    return result.result ? result.result.value : undefined;
}

async function removeDirSafely(targetPath) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            fs.rmSync(targetPath, { recursive: true, force: true });
            return true;
        } catch (error) {
            if (attempt === 4) {
                console.warn(`Cleanup warning: ${error.message}`);
                return false;
            }
            await delay(500);
        }
    }

    return false;
}

async function main() {
    const browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-quiz-edge-'));
    const server = startProcess('python', ['-m', 'http.server', String(PORT)]);
    let browser;

    try {
        await waitFor(async () => {
            const response = await fetch(`http://127.0.0.1:${PORT}/index.html`);
            return response.ok;
        }, { label: 'local server' });

        browser = startProcess(EDGE_PATH, [
            `--user-data-dir=${browserProfile}`,
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            `--remote-debugging-port=${DEBUG_PORT}`,
            `http://127.0.0.1:${PORT}/index.html`
        ]);

        const targets = await waitFor(async () => {
            const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
            if (!response.ok) {
                return null;
            }
            const pages = await response.json();
            return pages.find(page => page.type === 'page' && page.url.includes(`127.0.0.1:${PORT}`));
        }, { timeout: 20000, label: 'browser target' });

        const cdp = await connectToCdp(targets.webSocketDebuggerUrl);
        try {
            await cdp.send('Page.enable');
            await cdp.send('Runtime.enable');
            await cdp.send('DOM.enable');

            await waitFor(() => evaluate(cdp, 'document.readyState === "complete"'), { label: 'document complete' });
            await waitFor(() => evaluate(cdp, 'document.getElementById("class-selection-title")?.textContent?.trim().length > 0'), { label: 'home screen text' });

            const homeState = await evaluate(cdp, `(() => ({
                title: document.getElementById('class-selection-title')?.textContent?.trim() || '',
                subtitle: document.getElementById('class-selection-subtitle')?.textContent?.trim() || '',
                gradeButtons: document.querySelectorAll('#class-buttons button').length,
                skipLinkTarget: document.querySelector('.skip-link')?.getAttribute('href') || '',
                announcementsLive: document.getElementById('announcements')?.getAttribute('aria-live') || '',
                toastLive: document.getElementById('toast-container')?.getAttribute('aria-live') || '',
                hiddenResults: document.getElementById('results-container')?.classList.contains('hidden') || false
            }))()`);

            await evaluate(cdp, `(() => {
                const button = document.querySelector('#class-buttons button');
                if (button) {
                    button.click();
                }
            })()`);

            await waitFor(() => evaluate(cdp, `(() => {
                const text = document.getElementById('question-text')?.textContent?.trim() || '';
                return text.length > 0 && !document.getElementById('quiz-container')?.classList.contains('hidden');
            })()`), { label: 'first question' });

            const quizChecks = await evaluate(cdp, `(() => ({
                optionsCount: document.querySelectorAll('#options-container .answer-option').length,
                optionsRole: document.getElementById('options-container')?.getAttribute('role') || '',
                labelledBy: document.getElementById('options-container')?.getAttribute('aria-labelledby') || '',
                skipText: document.getElementById('skip-button')?.textContent?.trim() || '',
                nextDisabled: document.getElementById('next-button')?.disabled || false
            }))()`);

            await evaluate(cdp, `(() => new Promise(resolve => {
                let steps = 0;
                const tick = () => {
                    const questionVisible = !document.getElementById('quiz-container')?.classList.contains('hidden');
                    if (!questionVisible || steps >= 10) {
                        resolve(true);
                        return;
                    }
                    const option = document.querySelector('#options-container .answer-option');
                    const nextButton = document.getElementById('next-button');
                    if (option) {
                        option.click();
                    }
                    setTimeout(() => {
                        nextButton?.click();
                        steps += 1;
                        setTimeout(tick, 60);
                    }, 40);
                };
                tick();
            }))()`);

            await waitFor(() => evaluate(cdp, '!document.getElementById("results-container")?.classList.contains("hidden")'), {
                timeout: 20000,
                label: 'results screen'
            });

            const resultState = await evaluate(cdp, `(() => ({
                resultMessage: document.getElementById('result-message')?.textContent?.trim() || '',
                score: document.getElementById('score-display')?.textContent?.trim() || '',
                adultSummary: document.getElementById('adult-summary-text')?.textContent?.trim() || '',
                observedLine: document.getElementById('adult-summary-observed')?.textContent?.trim() || '',
                conceptCards: document.querySelectorAll('#concept-analytics-list article').length,
                detailedResults: document.querySelectorAll('#detailed-results article').length,
                shareButton: document.getElementById('share-button')?.textContent?.trim() || ''
            }))()`);

            const accessibilityChecks = await evaluate(cdp, `(() => {
                const unlabeledButtons = [...document.querySelectorAll('button')].filter(button => {
                    const text = (button.textContent || '').trim();
                    const aria = (button.getAttribute('aria-label') || '').trim();
                    return !text && !aria;
                }).length;

                const modalProblems = [...document.querySelectorAll('[role="dialog"]')].filter(dialog => {
                    const labelledBy = dialog.getAttribute('aria-labelledby');
                    return !labelledBy || !document.getElementById(labelledBy);
                }).length;

                return {
                    unlabeledButtons,
                    modalProblems,
                    mainExists: Boolean(document.getElementById('main-content')),
                    reviewDialogPresent: Boolean(document.getElementById('review-modal')),
                    finishDialogPresent: Boolean(document.getElementById('finish-modal'))
                };
            })()`);

            console.log('\nSMOKE SUMMARY');
            console.log(JSON.stringify({ homeState, quizChecks, resultState, accessibilityChecks }, null, 2));
        } finally {
            cdp.close();
        }
    } finally {
        await stopProcess(browser);
        await stopProcess(server);
        await removeDirSafely(browserProfile);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
