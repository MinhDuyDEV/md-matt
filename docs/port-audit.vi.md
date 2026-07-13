# Audit port `mattpocock/skills` sang Pi Coding Agent

## Phạm vi và nguồn

Audit này đọc repository upstream tại commit cố định:

```text
mattpocock/skills
0ac3f3fbf1c35b913ae1b7f5fcd303a4fb2e2dba
```

Nguồn chuẩn được đối chiếu:

- toàn bộ 39 `SKILL.md` và support files trực tiếp;
- `.agents/invocation.md`, `CLAUDE.md`, `.claude-plugin/plugin.json`;
- `package.json`, scripts, docs pages, license và release workflow;
- tài liệu Pi `docs/skills.md`, `docs/packages.md`, `docs/extensions.md` và ví dụ subagent 0.80.6;
- Agent Skills specification và `skills-ref` tại commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`.

Mục tiêu đã chốt: **audit đủ 39, port/nạp mặc định đúng 22 skill promoted**, giữ prompt skill bằng tiếng Anh và tài liệu package bằng tiếng Việt.

## Kết luận điều hành

1. **Định dạng không phải blocker.** Pi hỗ trợ Agent Skills và đọc `SKILL.md` trực tiếp.
2. **Capability mới là blocker.** Upstream giả định có Agent/Task/background subagent; Pi core cố ý không có. Bốn active workflow cần runtime: `research`, `code-review`, `improve-codebase-architecture`, `wayfinder`; `codebase-design` dùng runtime ở nhánh Design It Twice.
3. **Invocation cần chuyển đổi.** Upstream dùng bare `/name`; Pi canonical là `/skill:name`. Bản port đổi lời gọi chéo và cung cấp alias không shadow.
4. **13 user-invoked skill đã có đúng `disable-model-invocation: true`.** Pi hỗ trợ field này; strict Agent Skills core validator thì không.
5. **Safety cần tăng cường** ở `implement`, `prototype`, `resolving-merge-conflicts`, `handoff` và `teach`.
6. **Không cần port 17 skill còn lại mặc định.** Chúng là misc, personal, draft hoặc deprecated; một số có thể thành profile tùy chọn sau này.

## Inventory chính xác

| Bucket | Số lượng | Nạp mặc định |
|---|---:|---:|
| engineering | 17 | 17 |
| productivity | 5 | 5 |
| misc | 4 | 0 |
| personal | 2 | 0 |
| in-progress | 7 | 0 |
| deprecated | 4 | 0 |
| **Tổng** | **39** | **22** |

Con số 39 là kết quả đếm trực tiếp. Một bản inventory trung gian từng ghi 38 do lỗi cộng; audit cuối và validator đều khóa 39.

## Ma trận 22 skill được port

Ký hiệu:

- **Giữ** — không đổi semantic, tối đa chỉ canonical hóa command pointer.
- **Adapt** — sửa prompt/path/safety/fallback cho Pi.
- **Runtime** — cần extension đi kèm để giữ hành vi.

| Bucket | Skill | Invocation | Mức port | Phân tích và thay đổi Pi-native |
|---|---|---|---|---|
| engineering | `ask-matt` | User | Adapt | Router đúng và đầy đủ; đổi toàn bộ flow sang `/skill:name`, giải thích alias, cập nhật `research` thành isolated researcher thay vì background claim. |
| engineering | `code-review` | Model | Runtime + Adapt | Hai axis cần context isolation. Đổi hai Agent calls thành một parallel `subagent` call với hai `reviewer` task; thêm fallback khi thiếu tracker/spec; git chỉ read-only. |
| engineering | `codebase-design` | Model | Runtime + Adapt | Vocabulary giữ nguyên. `DESIGN-IT-TWICE.md` đổi 3+ Agent calls thành parallel `planner` tasks; dependency categories và output contract giữ nguyên. |
| engineering | `diagnosing-bugs` | Model | Giữ | Feedback-loop discipline hoàn toàn portable. Playwright chỉ là một tùy chọn; pointer hậu kiểm dùng `/skill:improve-codebase-architecture`. |
| engineering | `domain-modeling` | Model | Giữ | Chỉ dùng read/write/edit, `CONTEXT.md` và ADR formats; không có harness gap. Các link minh họa trong fenced code không phải link hỏng. |
| engineering | `grill-with-docs` | User | Adapt | Orchestrator một dòng được làm rõ: load/follow `grilling`, đồng thời apply `domain-modeling`; không giả định model tự gõ bare slash command. |
| engineering | `implement` | User | Adapt | Giữ TDD + review flow; canonical hóa dependencies; thêm explicit approval sau diff/tests/review và trước commit. |
| engineering | `improve-codebase-architecture` | User | Runtime + Adapt | `subagent_type=Explore` thành single `explorer`; không lặp scan ở parent; HTML dùng OS temp, manual-open fallback, CDN dependency được khai báo. |
| engineering | `prototype` | Model | Adapt | Logic prototype giữ nguyên. UI branch dùng dev URL + OS/manual browser fallback. Tạo branch/commit primary-source chỉ sau user approval. |
| engineering | `research` | Model | Runtime + Adapt | `background agent` thành read-only `researcher` child. Parent xác minh citation rồi ghi artifact; cấm gửi private code/credential tới external source. |
| engineering | `resolving-merge-conflicts` | Model | Adapt | Bỏ tuyệt đối “never abort”; abort chỉ khi intent không thể phục hồi và user phê duyệt. Chỉ stage conflict files, checkpoint trước stage/continue, không kéo unrelated changes vào commit. |
| engineering | `setup-matt-pocock-skills` | User | Adapt | Detect `triage` từ Pi available-skills list; bỏ reference `qa` đã deprecated; khi cả AGENTS/CLAUDE cùng có thì hỏi file canonical, recommend AGENTS cho Pi. |
| engineering | `tdd` | Model | Giữ | Red-green vertical slices, test seams và support docs portable nguyên trạng; không cần subagent/browser. |
| engineering | `to-spec` | User | Adapt nhỏ | Workflow giữ nguyên; setup pointer chuyển sang canonical Pi command. Tracker vẫn thông qua generated config. |
| engineering | `to-tickets` | User | Adapt nhỏ | Tracer-bullet/blocking model giữ nguyên; canonical hóa setup/implement pointers; không thêm tracker abstraction mới. |
| engineering | `triage` | User | Adapt nhỏ | State machine và AI disclaimer giữ nguyên; canonical hóa setup/grilling/domain pointers. Remote mutations vẫn qua confirmation trong flow. |
| engineering | `wayfinder` | User | Runtime + Adapt | Parallel research dùng `researcher` tasks (8/call, batch khi lớn). Child read-only; parent ghi ticket/artifact tuần tự, không cho parallel child switch shared branch. |
| productivity | `grill-me` | User | Adapt | Load/follow `/skill:grilling` rõ ràng; Q&A vẫn dùng chat turn, không cần structured-question extension. |
| productivity | `grilling` | Model | Giữ | Primitive phỏng vấn từng câu, lookup facts trước khi hỏi, không hành động trước shared understanding; Pi-compatible nguyên trạng. |
| productivity | `handoff` | User | Adapt | Bỏ `argument-hint`; portable temp resolution; unique private file; concrete secret-pattern scan; final response luôn in absolute path. |
| productivity | `teach` | User | Adapt | Bỏ `argument-hint`; guard repo/non-empty cwd; thêm `GLOSSARY.md` + format link; web-source fallback; manual HTML opener; không tin parametric memory khi thiếu nguồn. |
| productivity | `writing-great-skills` | User | Giữ | Pure reference + glossary; không tool/runtime dependency. `disable-model-invocation` giữ nguyên. |

### Dependency graph đáng chú ý

- `grill-with-docs` → `grilling` + `domain-modeling`
- `grill-me` → `grilling`
- `implement` → `tdd` + `code-review`
- `improve-codebase-architecture` → `codebase-design` + `grilling` + `domain-modeling` + `explorer`
- `wayfinder` → `grilling` + `domain-modeling` + `prototype` + `researcher`
- `code-review` → generated tracker config + `reviewer` × 1–2

Hard setup dependency vẫn nằm ở `to-spec`, `to-tickets`, `triage` và tracker-aware phần của `code-review`; những workflow khác degrade hợp lý khi thiếu domain docs.

## Ma trận 17 skill không nạp mặc định

| Bucket | Skill | Khả năng port | Quyết định và lý do |
|---|---|---|---|
| misc | `git-guardrails-claude-code` | Cần extension | Hook `PreToolUse`, `$CLAUDE_PROJECT_DIR`, `jq` và pattern shell riêng Claude. Pi có thể làm bằng `tool_call` gate nhưng đã ngoài scope skills port; tiếp tục loại. |
| misc | `migrate-to-shoehorn` | Copy được | Harness-agnostic nhưng chỉ phục vụ migration sang `@total-typescript/shoehorn`; niche và gắn package của tác giả; loại mặc định. |
| misc | `scaffold-exercises` | Không nên port | Phụ thuộc `pnpm ai-hero-cli internal lint` và cấu trúc course platform riêng; không có ý nghĩa chung. |
| misc | `setup-pre-commit` | Copy được | Husky/lint-staged/Prettier workflow khá portable nhưng JS-opinionated; ứng viên profile tùy chọn tương lai, chưa promote. |
| personal | `edit-article` | Copy được | Prompt mỏng, rule 240 ký tự mang tính cá nhân; loại. |
| personal | `obsidian-vault` | Adapt | Hard-code `/mnt/d/Obsidian Vault/AI Research/` nhiều nơi; chỉ cân nhắc sau khi parameterize vault path. |
| in-progress | `claude-handoff` | Runtime nhưng không nên | Phụ thuộc `claude --bg`/`claude agents`; bundled Pi subagent có thể thay nhưng chức năng trùng `handoff` + `research`; giữ loại. |
| in-progress | `loop-me` | Copy được | Portable và compose với `grilling`, nhưng vẫn là draft/personal workflow-spec flow; ứng viên optional profile. |
| in-progress | `setup-ts-deep-modules` | Copy được | Chất lượng tốt nhưng chỉ TypeScript + dependency-cruiser; ứng viên optional engineering profile. |
| in-progress | `wizard` | Copy được | Generated shell xử lý browser/secret khá tốt; vẫn in-progress và có `gh`/shellcheck/platform dependencies; ứng viên optional profile mạnh. |
| in-progress | `writing-beats` | Copy được | Personal writing draft; loại mặc định. |
| in-progress | `writing-fragments` | Copy được | Personal writing draft; loại mặc định. |
| in-progress | `writing-shape` | Copy được | Personal writing draft và overlap `edit-article`; loại mặc định. |
| deprecated | `design-an-interface` | Runtime nhưng superseded | Dùng parallel Task agents, đã được thay bởi `codebase-design` + `prototype`; không port. |
| deprecated | `qa` | Không nên port | Background Explore + GitHub-only, tự file issue không review; đã được `triage`, `to-tickets`, `domain-modeling` thay thế. |
| deprecated | `request-refactor-plan` | Adapt được | Có thể decouple GitHub nhưng đã được `to-spec` + `to-tickets` + `implement` thay thế; không port. |
| deprecated | `ubiquitous-language` | Copy được nhưng xung đột | Artifact `UBIQUITOUS_LANGUAGE.md` là mô hình đã nghỉ; `domain-modeling` dùng `CONTEXT.md` + ADR làm source of truth. |

### Ứng viên profile tùy chọn sau này

Nếu mở rộng, thứ tự hợp lý là:

1. `wizard`
2. `setup-ts-deep-modules`
3. `setup-pre-commit`
4. `loop-me`

Chúng không được đưa vào default manifest cho đến khi upstream promote hoặc repo này định nghĩa profile riêng có test độc lập.

## Frontmatter và Agent Skills conformance

Kết quả chạy strict `skills-ref validate` trên 39 nguồn upstream:

| Kết quả | Số lượng | Giải thích |
|---|---:|---|
| Strict-valid | 17 | Chỉ dùng Agent Skills core fields |
| Harness fields | 22 | `disable-model-invocation`; một số có thêm `argument-hint` |

Trong active 22:

- 9 model-invoked skill strict-valid;
- 13 user-invoked skill bị strict validator từ chối vì `disable-model-invocation`;
- upstream `handoff` và `teach` còn có `argument-hint`.

Quyết định:

- giữ `disable-model-invocation` vì Pi docs hỗ trợ và đây là semantic quan trọng;
- bỏ `argument-hint` khỏi hai active skill vì Pi không dùng;
- validator local là Pi-aware, nhưng vẫn khóa name, description, compatibility và allowed field set.

## Link và resource audit

- Tất cả link tương đối thực trong 22 active skill directories đều resolve.
- Link minh họa trong fenced code như `./src/ordering/CONTEXT.md`, `(link)` hoặc target-repo path không được coi là support-file dependency.
- Support scripts/templates quan trọng tồn tại: HITL debug loop, tracker seeds, HTML report scaffold, prototype docs, TDD references, domain formats, teaching formats và glossary.
- `agents/openai.yaml` là Codex UI metadata; Pi bỏ qua nhưng repo giữ để dễ đồng bộ upstream.

## Capability mapping

| Nhu cầu upstream | Pi core | Bản port |
|---|---|---|
| Skill discovery | Có | `pi.skills` explicit 22 paths |
| User-only invocation | Có | `disable-model-invocation: true` |
| Bare slash command | Không theo chuẩn | alias extension, collision-safe |
| Parallel/isolated agent | Không | bundled child-Pi subagent extension |
| Structured interview | Không | chat turn từng câu; đủ cho semantics |
| Browser | Không | OS opener + manual URL/path |
| Issue tracker | Không | `gh`/`glab`/local config do setup tạo |
| Plan/todo mode | Không | issue/spec/ticket artifacts thay thế |

## Risk register

| Mức | Rủi ro | Kiểm soát |
|---|---|---|
| Cao | Extension/child process có quyền hệ thống | Tool allowlist, project-agent opt-in, security docs, container nếu cần sandbox cứng |
| Cao | Remote tracker mutation | Setup config, preview/confirmation, local tracker fallback |
| Cao | Git state bị trộn/hỏng | Approval trước commit/stage/continue; không stage unrelated changes; user-approved abort |
| Trung bình | Handoff làm lộ secret/PII | Pattern scan + `[REDACTED]` + file private + user review |
| Trung bình | `teach` làm bẩn repo | Non-empty/git-repo guard và dedicated subdirectory recommendation |
| Trung bình | Parallel subagent tăng chi phí | Max 8 tasks, concurrency 4, model/thinking inheritance, cost warning |
| Thấp | HTML/browser không mở được | Luôn in URL/path và manual fallback |
| Thấp | Skill collision | Explicit 22 paths; alias input nhường extension command/prompt template; validator kiểm tra uniqueness |

## Acceptance criteria của bản port

- [x] Inventory đúng 39 skill.
- [x] Manifest expose đúng 22 promoted skill.
- [x] 17 non-promoted không tự động nạp.
- [x] Active frontmatter hợp lệ với Pi; không còn `argument-hint`.
- [x] Không còn `Agent tool`, `Task tool`, `subagent_type`, `general-purpose` trong active skill directories.
- [x] Cross-skill pointers dùng canonical `/skill:name`.
- [x] Runtime bundle 5 portable agents.
- [x] Safety patch cho commit/merge/handoff/teach/browser.
- [x] Typecheck, package dry-run và isolated Pi smoke test đã pass.

## Verification thực tế — 2026-07-13

- `npm run validate` — pass 7 nhóm invariant của port.
- `npm run typecheck` — pass với TypeScript strict/noEmit.
- `npm run smoke:pi` — isolated `PI_CODING_AGENT_DIR` discover đúng 22 skill và tool `subagent`.
- Live alias smoke — `/<name>` được input handler biến đổi và Pi expand thành `<skill ...>` canonical content.
- Live child-process smoke — `explorer` được resolve từ source `package`, kế thừa model parent và trả `CHILD_OK` qua một `subagent` tool call thành công.
- Live project-agent guard smoke — JSON mode với `agentScope: "project"` bị từ chối trước khi project agent chạy vì không có interactive confirmation.
- `npm run pack:check` — 39 `SKILL.md`, đầy đủ runtime/docs bắt buộc, không có `node_modules`, không đóng gói upstream snapshot docs.
- `npm audit --audit-level=moderate` — 0 vulnerability.
- `git diff --check` — pass.
