# 2026 우리의 마지막 페이지 · API

이 디렉터리는 `last-page-2026-api` Cloudflare Worker의 배포 소스입니다.

- `worker.js`: 편지 저장·열람·삭제·운영진 승인
- `wrangler.jsonc`: D1 연결 및 CORS 설정
- GitHub `main`의 `last-page-2026/api/**` 변경은 Cloudflare Workers Builds 자동배포 대상으로 설정됩니다.
- `ADMIN_TOKEN`과 `IP_SALT`는 Cloudflare Worker Secrets에만 저장하고 GitHub에 올리지 않습니다.
- 공개 페이지: https://usernameisuser11.github.io/daily-cheer/last-page-2026/
- API: https://last-page-2026-api.kds10111.workers.dev/api/health

공개 편지는 승인되기 전까지 외부에 표시되지 않으며, 비공개·예약 편지는 서버에서 접근을 제한합니다.
