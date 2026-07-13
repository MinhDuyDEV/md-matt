# Kiến trúc bản port Pi

## Mục tiêu

`md-matt` giữ nguyên tinh thần composable của upstream nhưng ánh xạ các primitive riêng của Claude/Codex sang primitive thực sự có trong Pi. Bản port ưu tiên ba tính chất:

1. **Progressive disclosure** — Pi chỉ đưa name/description vào system prompt, rồi đọc `SKILL.md` khi cần.
2. **Hành vi tương đương** — workflow cần context isolation hoặc parallelism dùng child Pi process, không giả vờ rằng Pi core có sẵn subagent.
3. **Dễ đồng bộ upstream** — toàn bộ 39 nguồn và lịch sử git được giữ lại; thay đổi Pi tập trung ở manifest, extensions và các patch nhỏ trên 22 skill promoted.

## Layout

```text
md-matt/
├── package.json                  # Pi package manifest
├── extensions/
│   ├── aliases.ts                # /name → /skill:name
│   └── subagent/
│       ├── index.ts              # child-process runtime
│       ├── agents.ts             # package/user/project discovery
│       └── agents/*.md           # 5 agent bundle
├── skills/
│   ├── engineering/              # 17 skill được nạp
│   ├── productivity/             # 5 skill được nạp
│   ├── misc/                     # giữ nguồn, không nạp
│   ├── personal/                 # giữ nguồn, không nạp
│   ├── in-progress/              # giữ nguồn, không nạp
│   └── deprecated/               # giữ nguồn, không nạp
└── scripts/validate-port.mjs
```

## Vì sao manifest liệt kê 22 directory tường minh

`package.json#pi.skills` mirror đúng `.claude-plugin/plugin.json` của upstream. Không trỏ thẳng vào `skills/`, `skills/engineering/` hay `skills/productivity/` vì:

- trỏ `skills/` sẽ vô tình discover 17 skill không promoted;
- một skill path tường minh bảo đảm support files như `UI.md`, `DESIGN-IT-TWICE.md`, templates và scripts vẫn ở cạnh `SKILL.md`;
- validator có thể so sánh tập 22 path với promotion gate của upstream và phát hiện drift.

39 skill vẫn có mặt trong git và npm tarball để audit hoặc port tùy chọn về sau, nhưng Pi chỉ nạp 22 path trong manifest.

## Invocation

### Canonical

Pi đăng ký skill command dưới dạng:

```text
/skill:<name> [arguments]
```

Các lời gọi chéo trong 22 skill dùng dạng này. Khi một user-invoked orchestrator cần một model-invoked primitive, prompt yêu cầu model load và follow primitive đó; nó không giả định model có thể tự gõ slash command thay người dùng.

### Alias tương thích upstream

`extensions/aliases.ts` không đăng ký 22 extension commands riêng. Nó cài một `input` handler và chỉ xử lý input khớp chính xác `/<name> [args]` trong catalog.

Thứ tự pipeline của Pi tạo collision safety:

- extension commands được resolve trước `input`, nên alias không thể shadow chúng;
- tại `input`, extension đọc `pi.getCommands()` và nhường lại nếu một prompt template đã sở hữu bare name;
- nếu canonical `skill:<name>` thuộc package này tồn tại, handler trả về `transform` thành `/skill:<name> [args]`;
- Pi tiếp tục pipeline và thực hiện skill expansion chuẩn;
- built-in như `/compact` không nằm trong catalog và không bị chạm tới.

Alias là convenience input và không xuất hiện như 22 command riêng trong picker; canonical `/skill:<name>` vẫn là giao diện discoverable chính.

## User-invoked và model-invoked

13 skill user-invoked giữ `disable-model-invocation: true`; 9 skill model-invoked không có field này. Đây là extension frontmatter được Pi hỗ trợ dù strict `skills-ref` hiện xem nó là field ngoài Agent Skills core.

`argument-hint` đã bị bỏ khỏi `handoff` và `teach` vì Pi không dùng field đó. Validator cho phép đúng các field Agent Skills cộng `disable-model-invocation` của Pi.

## Subagent runtime

### Nguồn

`extensions/subagent/` được chuyển thể từ ví dụ `examples/extensions/subagent/` của Pi Coding Agent 0.80.6. Runtime spawn một tiến trình `pi --mode json -p --no-session` cho mỗi task và stream event về parent. Ở parallel mode, phần output đưa trở lại model bị giới hạn 50 KiB cho mỗi task; full result vẫn nằm trong tool details. Single và chain mode trả full final output.

### Mode

- **single**: `{ agent, task }`
- **parallel**: `{ tasks: [{ agent, task }, ...] }`
- **chain**: `{ chain: [{ agent, task }, ...] }`, hỗ trợ placeholder `{previous}`

Giới hạn: tối đa 8 task trong một parallel call, tối đa 4 process chạy đồng thời. Escape/abort từ parent được chuyển thành SIGTERM rồi SIGKILL fallback cho child.

### Agent precedence

Package agents luôn là baseline:

1. `package` — 5 agent trong package;
2. `user` — `~/.pi/agent/agents/*.md`, có thể override cùng tên;
3. `project` — `.pi/agents/*.md`, chỉ được nạp khi caller chọn `agentScope: "project"` hoặc `"both"`.

Project agent là prompt do repo kiểm soát. Runtime bắt buộc confirmation trước khi chạy và không expose tham số tắt guard này; print/JSON mode không có UI sẽ từ chối project agent. Scope mặc định là `user`, nghĩa là package + user agents, không có project agents.

### Model và tools

Nếu agent definition không pin model, child kế thừa provider/model và thinking level của parent. Năm package agents cố ý không pin Claude/OpenAI model để package dùng được với mọi provider Pi hỗ trợ.

| Agent | Tools |
|---|---|
| `explorer` | read, grep, find, ls, bash read-only theo prompt |
| `planner` | read, grep, find, ls |
| `reviewer` | read, grep, find, ls, bash read-only theo prompt |
| `researcher` | read, grep, find, ls, bash; không sửa repo |
| `worker` | read, write, edit, bash, grep, find, ls |

Tool allowlist không phải sandbox tuyệt đối: `bash` vẫn có quyền của user. Xem [SECURITY.md](../SECURITY.md).

## Mapping các capability gap

| Upstream assumption | Pi-native mapping |
|---|---|
| `Agent`/`Task` tool + `subagent_type` | bundled `subagent` tool |
| Hai review agent song song | một parallel call với hai `reviewer` task |
| Explore agent | `explorer` |
| Background research agent | isolated `researcher`; parent xác minh và ghi artifact |
| Browser tool | dev server/HTML file + OS opener + manual URL/path fallback |
| Bare `/name` | canonical `/skill:name` + collision-safe alias |
| `CLAUDE.md` mặc định | dùng file đang tồn tại; Pi-first recommendation là `AGENTS.md` |
| Auto commit/continue merge | explicit user checkpoint trước mutation |

## External systems

Tracker behavior không được hard-code vào extension. `setup-matt-pocock-skills` tạo `docs/agents/issue-tracker.md`, rồi consumer skills đọc file đó:

- GitHub → `gh`;
- GitLab → `glab`;
- local → `.scratch/` markdown;
- hệ thống khác → prose workflow do người dùng cung cấp.

Cách này giữ tracker dependency ở data/config layer thay vì biến package thành integration framework.

## Validation architecture

`scripts/validate-port.mjs` là gate Pi-aware, không thay thế hoàn toàn strict Agent Skills validator. Nó kiểm tra:

- 39 skill theo bucket: 17 + 5 + 4 + 2 + 7 + 4;
- manifest đúng 22 path promoted;
- name/description/compatibility và invocation policy;
- link tương đối ngoài fenced code;
- `/skill:<name>` chỉ trỏ tới skill được nạp;
- không còn token `Agent tool`, `Task tool`, `subagent_type`, `general-purpose` trong active package;
- alias catalog đúng 22;
- bundled agent catalog đúng 5;
- Pi packages nằm ở peerDependencies `"*"` và không bị bundle;
- audit tiếng Việt nhắc đủ 39 tên.

TypeScript extension được kiểm tra riêng bằng `tsc --noEmit`; package contents được kiểm tra bằng `npm pack --dry-run`; behavior cuối cùng được smoke-test bằng Pi với `PI_CODING_AGENT_DIR` cô lập.

## Chủ ý không làm

- Không nạp 17 skill non-promoted mặc định.
- Không bundle prompt templates mẫu `/implement`, `/scout-and-plan`, `/implement-and-review` của ví dụ Pi vì chúng xung đột với skill/alias hiện có.
- Không thêm browser, issue-tracker hay structured-question extension khi chat + CLI fallback đã đủ.
- Không tự động sync upstream hoặc auto-merge prompt changes; mọi update phải qua audit và validator.
