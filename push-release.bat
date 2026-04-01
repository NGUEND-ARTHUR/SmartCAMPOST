@echo off
cd /d "c:\Users\Nguend Arthur Johann\Desktop\SmartCAMPOST"
echo Running GitHub Release Creation...
gh release create v1.0.0 --title "SmartCAMPOST v1.0.0 - Production Release" --notes-file RELEASE_NOTES_v1.0.0.md smartcampost_mobile\build\app\outputs\flutter-apk\app-release.apk
echo.
echo Verifying release...
gh release view v1.0.0 --json tagName,title,url
pause
