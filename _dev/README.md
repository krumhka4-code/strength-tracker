# Dev harness

`selftest.js` is a probe appended to a COPY of `index.html` and run in real Chrome.
It is not shipped to the app.

    python -m http.server 8731
    python -c "h=open('../index.html',encoding='utf-8').read(); open('../_test.html','w',encoding='utf-8').write(h.replace('</body>','<script src=\"_dev/selftest.js\"></script>\n</body>'))"
    chrome --headless --disable-gpu --virtual-time-budget=10000 --dump-dom http://localhost:8731/_test.html

35 checks. Last run 2026-09-04: 35 passed, 0 failed, and 5 injected faults all detected
(rounding, a dropped routine step, an over-wide tab bar, a draft that never clears, and a
suppressed squat caveat).

Note: Chrome headless ignores `--window-size` for the CSS viewport, so the phone-width
checks load `index.html` in an iframe pinned to exactly 360px and measure inside it.
