# FE 분석과 모니터링

마지막 업데이트: 2026-09-28

## Microsoft Clarity

Microsoft Clarity는 배포된 서비스의 사용자 행동을 세션 녹화와 히트맵으로 분석하는 데 사용합니다.

- Microsoft가 제공하는 추적 코드를 Next.js `Script`로 로드합니다.
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`가 설정된 프로덕션 빌드에서만 초기화합니다.
- 로컬 개발과 프로젝트 ID가 없는 빌드에서는 데이터를 수집하지 않습니다.
- 프로젝트 ID는 공개 가능한 식별자이며 GitHub `production` Environment Variable로 관리합니다.
- 사용자 식별 정보와 Custom Event는 수집 목적과 정책이 정해지기 전에는 추가하지 않습니다.

배포 전 GitHub 저장소의 `production` Environment에 다음 변수를 등록합니다.

```text
NEXT_PUBLIC_CLARITY_PROJECT_ID=<Clarity project ID>
```

배포 후 브라우저 Network 탭의 `clarity.ms` 요청과 Clarity 대시보드의 실시간 세션으로 연동을 확인합니다.

Clarity의 쿠키, 동의 모드와 마스킹 설정은 실제 수집 전에 서비스의 개인정보 처리 정책에 맞게 검토합니다.
