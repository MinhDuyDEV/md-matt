# Nguồn upstream và chiến lược đồng bộ

## Nguồn đã ghim

- Repository: <https://github.com/mattpocock/skills>
- Commit được audit/port: `0ac3f3fbf1c35b913ae1b7f5fcd303a4fb2e2dba`
- Default branch upstream: `main`
- Ngày audit: 2026-07-13
- License: MIT, Copyright © 2026 Matt Pocock

Remote local được đặt tên `upstream`; repo port dùng branch `pi-port`. Chưa khai báo `origin` vì chưa có URL fork do người dùng cung cấp.

## Inventory tại commit đã ghim

| Bucket | Số skill | Được Pi nạp mặc định |
|---|---:|---:|
| engineering | 17 | 17 |
| productivity | 5 | 5 |
| misc | 4 | 0 |
| personal | 2 | 0 |
| in-progress | 7 | 0 |
| deprecated | 4 | 0 |
| **Tổng** | **39** | **22** |

Con số 39 được tính trực tiếp từ `find skills -name SKILL.md`; `.claude-plugin/plugin.json` là promotion gate 22 skill và được mirror sang `package.json#pi.skills`.

## Patch Pi-native

Những thay đổi chủ đích so với upstream:

1. Thêm Pi package manifest và peer dependencies.
2. Chuyển lời gọi chéo active skills sang `/skill:<name>`.
3. Bundle alias `/<name>` theo cơ chế không shadow command đã có.
4. Chuyển `Agent`/`Task`/background assumptions sang child-Pi `subagent` runtime.
5. Thêm manual browser fallback.
6. Thêm checkpoint an toàn trước commit, branch, stage, merge/rebase continuation.
7. Làm an toàn hơn cho handoff temp file và teaching workspace.
8. Bỏ `argument-hint` khỏi active skills vì Pi không sử dụng field này.
9. Giữ `disable-model-invocation: true`, field mở rộng được Pi hỗ trợ cho 13 user-invoked skills.

Chi tiết từng skill nằm trong [docs/port-audit.vi.md](docs/port-audit.vi.md).

## Runtime Pi được tái sử dụng

`extensions/subagent/index.ts` và `agents.ts` bắt nguồn từ ví dụ subagent chính thức đi kèm `@earendil-works/pi-coding-agent` 0.80.6:

- Upstream Pi: <https://github.com/earendil-works/pi>
- Example path: `packages/coding-agent/examples/extensions/subagent/`
- License: MIT, Copyright © 2025 Mario Zechner

Bản port thêm package-agent tier, agent definitions portable, model/thinking inheritance, mandatory confirmation cho project agents (và từ chối chúng khi không có UI), đồng thời bỏ các workflow prompt mẫu có nguy cơ xung đột. Xem [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Quy trình cập nhật upstream

Không auto-merge prompt changes. Mỗi lần cập nhật:

```bash
git fetch upstream
git log --oneline HEAD..upstream/main
git diff --stat HEAD...upstream/main
```

Sau đó:

1. Kiểm tra skill được thêm/xóa/đổi bucket và cập nhật ma trận 39/22.
2. Đọc toàn bộ `SKILL.md` và support files thay đổi.
3. So sánh các vùng đã patch Pi-native; giữ semantic upstream nhưng không khôi phục token `Agent tool`, `Task tool`, `subagent_type` hoặc bare cross-skill assumptions.
4. Nếu promotion set đổi, cập nhật đồng thời `.claude-plugin/plugin.json`, `package.json#pi.skills`, alias catalog, README và audit.
5. Nếu Pi example subagent đổi, review riêng security/process lifecycle trước khi port patch runtime.
6. Chạy toàn bộ gate:

```bash
npm install
npm test
npm run pack:check
```

7. Chạy isolated Pi smoke test trước khi phát hành tag mới.

Không dùng `git reset --hard`, `git clean` hoặc overwrite tự động để đồng bộ; các lệnh đó có thể xóa patch/local work.

## Agent Skills strict validator

Ở commit upstream này:

- 17/39 skill pass strict `skills-ref`;
- 22/39 bị strict validator từ chối chỉ vì harness-specific frontmatter (`disable-model-invocation`, đôi khi thêm `argument-hint`);
- trong 22 active skill: 9 strict-pass, 13 dùng `disable-model-invocation`.

Bản port bỏ `argument-hint` khỏi active set nhưng giữ `disable-model-invocation` vì đây là cách Pi thực thi user-only invocation. `scripts/validate-port.mjs` vì vậy là validator Pi-aware; strict validation vẫn hữu ích để phát hiện lỗi core format nhưng warning về field này là intentional.
