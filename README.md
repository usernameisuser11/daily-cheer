# 오늘의 하루 마무리 응원 🌙

후배들에게 보내는 하루 마무리 응원을 편지 형태로 읽을 수 있는 웹페이지입니다.

- `index.html`: 편지 웹페이지 (HTML + CSS만 사용하며 클라이언트 JavaScript 없음)
- `server.js` / `package.json`: Railway 같은 Node.js 호스팅용 선택적 서버

## GitHub Pages에 무료로 공개하기

1. [저장소 Pages 설정](https://github.com/usernameisuser11/daily-cheer/settings/pages)으로 이동합니다.
2. **Build and deployment → Source → Deploy from a branch**를 선택합니다.
3. **Branch: main**, **Folder: /(root)** 를 선택한 뒤 **Save**를 누릅니다.
4. 배포 완료 후 [오늘의 응원 편지](https://usernameisuser11.github.io/daily-cheer/) 주소로 접속할 수 있습니다.

> 이 페이지를 에브리타임 쪽지나 게시글에 공유할 수 있습니다. 에브리타임 앱에서 자동 링크 처리되는지는 게시 후 확인해 주세요.
>
> HTML에서 JavaScript를 사용하지 않고 외부 폰트나 네트워크 리소스를 불러오지 않습니다.

## 내용 수정

`index.html`의 `<article class="paper">` 안의 편지 내용을 수정하고 커밋하면 GitHub Pages가 활성화된 경우 업데이트가 자동으로 반영됩니다.
