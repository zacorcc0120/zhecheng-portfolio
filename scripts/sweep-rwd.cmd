@echo off
REM Six-viewport sweep of the four rebuilt chapters. Reduced motion on so every
REM frame is a settled one and the shots are comparable.
setlocal
set REDUCE=1
for %%V in (1920x1080 1440x900 1280x800 1024x768 768x1024 390x844) do (
  echo === %%V ===
  node scripts/act.mjs http://127.0.0.1:3100/ shots/rwd/%%V %%V ^
    "wait:2600" ^
    "assert:geo=JSON.stringify([...document.querySelectorAll('.practice,.sculpture-practice,.quiet,.sculpture-study,.home-about,.contact-section')].map(e=>{const r=e.getBoundingClientRect();return [e.className.split(' ').slice(-1)[0], Math.round(r.width), Math.round(r.height)]}))" ^
    "assert:a=(window.scrollTo(0,document.querySelector('.practice-statement').getBoundingClientRect().top+scrollY-90),'r')" "wait:1500" "shot:1-practice" ^
    "assert:b=(window.scrollTo(0,document.querySelector('.sculpture-study').getBoundingClientRect().top+scrollY-120),'r')" "wait:1500" "shot:2-rules" ^
    "assert:c=(window.scrollTo(0,document.querySelector('.home-about').getBoundingClientRect().top+scrollY),'r')" "wait:1300" "shot:3-about" ^
    "assert:d=(window.scrollTo(0,document.body.scrollHeight),'r')" "wait:1500" "shot:4-contact"
)
endlocal