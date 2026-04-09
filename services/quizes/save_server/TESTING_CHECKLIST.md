# Testing Checklist

## Fast Smoke

Run before and after any code change:

```powershell
powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
```

Checks covered automatically:

- UTF-8 integrity for app shell, content files, PWA files, and resource files
- quiz content structure
- accessibility shell markers
- PWA/offline file presence
- semantic component classes and token files

## Manual Accessibility

- Tab from the top of the page and confirm the skip link appears
- Start the game using keyboard only
- Reach answer buttons with Tab and activate them with Enter/Space
- Turn the timer on and verify the 20-second extension prompt appears
- Confirm focus moves to the primary action after feedback and on the final screen
- Zoom the page to 200% and confirm no content becomes unusable
- Enable reduced motion in the OS/browser and confirm the UI still works

## Manual Content Safety

- Open the start screen and confirm all Ukrainian text renders correctly
- Complete at least one correct and one incorrect answer path
- Reach a checkpoint message and verify the text is intact
- Finish the game and check the final summary and weak-topic list

## Manual Offline / PWA

- Load the app once online
- Reload and confirm the page still opens
- Disconnect the network and open `offline.html`
- Reconnect and verify the app announces that the connection returned

## Before Merge

- Review `git diff` for accidental text corruption
- Search for replacement characters or mojibake if anything looks suspicious
- Keep new UI strings in `ui-strings.js`
- Keep quiz content in `quiz-content.uk.js`
