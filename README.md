# md-matt

Bản port **Pi-native** của bộ [Skills for Real Engineers](https://github.com/mattpocock/skills) do Matt Pocock phát hành theo giấy phép MIT.

Mục tiêu của repo này không chỉ là làm cho `SKILL.md` “được Pi nhận diện”, mà còn giữ đúng hành vi của các workflow gốc trên Pi:

- nạp đúng **22 skill promoted**;
- giữ 17 skill misc/personal/in-progress/deprecated trong lịch sử nguồn nhưng không tự động nạp;
- chuyển lời gọi chéo sang `/skill:<name>`;
- cung cấp alias ngắn `/<name>` khi không xung đột;
- bundle runtime subagent cô lập/song song dựa trên child Pi process;
- thêm guardrail cho commit, merge/rebase, file tạm, workspace dạy học và browser fallback.

> [!WARNING]
> Pi skills có thể yêu cầu agent chạy lệnh hoặc sửa file; extensions chạy với toàn quyền của tiến trình người dùng. Hãy đọc [SECURITY.md](SECURITY.md) trước khi cài.

## Cài đặt

### Dùng trực tiếp từ workspace này

Chạy từ root của clone `md-matt`:

```bash
pi install .
```

Cài ở phạm vi project:

```bash
pi install -l <path-to-md-matt>
```

Chạy thử trong một phiên mà không ghi vào settings:

```bash
pi -e <path-to-md-matt>
```

Sau khi package được đẩy lên một Git remote, có thể dùng cú pháp chuẩn của Pi:

```bash
pi install git:<host>/<owner>/<repo>
```

Khởi động lại Pi hoặc chạy `/reload`, sau đó cấu hình repo đích:

```text
/skill:setup-matt-pocock-skills
```

Nếu alias không xung đột với command/prompt đã có, dạng ngắn cũng hoạt động:

```text
/setup-matt-pocock-skills
```

## 22 skill được nạp

### Engineering — user-invoked

| Skill | Mục đích |
|---|---|
| [`ask-matt`](skills/engineering/ask-matt/SKILL.md) | Chọn flow phù hợp |
| [`grill-with-docs`](skills/engineering/grill-with-docs/SKILL.md) | Phỏng vấn sâu và cập nhật domain docs |
| [`triage`](skills/engineering/triage/SKILL.md) | Triage issue/PR theo state machine |
| [`improve-codebase-architecture`](skills/engineering/improve-codebase-architecture/SKILL.md) | Tìm cơ hội làm module sâu hơn |
| [`setup-matt-pocock-skills`](skills/engineering/setup-matt-pocock-skills/SKILL.md) | Thiết lập tracker, label và domain docs |
| [`to-spec`](skills/engineering/to-spec/SKILL.md) | Tổng hợp hội thoại thành spec |
| [`to-tickets`](skills/engineering/to-tickets/SKILL.md) | Chia spec thành tracer-bullet tickets |
| [`implement`](skills/engineering/implement/SKILL.md) | Implement theo TDD rồi review |
| [`wayfinder`](skills/engineering/wayfinder/SKILL.md) | Lập bản đồ quyết định cho effort nhiều phiên |

### Engineering — model-invoked

| Skill | Mục đích |
|---|---|
| [`prototype`](skills/engineering/prototype/SKILL.md) | Prototype logic hoặc nhiều biến thể UI |
| [`diagnosing-bugs`](skills/engineering/diagnosing-bugs/SKILL.md) | Vòng lặp chẩn đoán bug có feedback chặt |
| [`research`](skills/engineering/research/SKILL.md) | Nghiên cứu nguồn sơ cấp bằng child agent |
| [`tdd`](skills/engineering/tdd/SKILL.md) | Red → green theo từng vertical slice |
| [`domain-modeling`](skills/engineering/domain-modeling/SKILL.md) | Làm sắc domain language và ADR |
| [`codebase-design`](skills/engineering/codebase-design/SKILL.md) | Thiết kế deep module và seam |
| [`code-review`](skills/engineering/code-review/SKILL.md) | Review độc lập theo Standards và Spec |
| [`resolving-merge-conflicts`](skills/engineering/resolving-merge-conflicts/SKILL.md) | Resolve merge/rebase theo intent |

### Productivity

| Skill | Invocation | Mục đích |
|---|---|---|
| [`grill-me`](skills/productivity/grill-me/SKILL.md) | User | Phỏng vấn sâu cho kế hoạch không cần codebase |
| [`handoff`](skills/productivity/handoff/SKILL.md) | User | Tạo handoff đã redaction trong thư mục tạm |
| [`teach`](skills/productivity/teach/SKILL.md) | User | Workspace học tập có trạng thái |
| [`writing-great-skills`](skills/productivity/writing-great-skills/SKILL.md) | User | Vocabulary để viết skill tốt |
| [`grilling`](skills/productivity/grilling/SKILL.md) | Model | Primitive phỏng vấn từng câu một |

User-invoked skills giữ `disable-model-invocation: true`, vì vậy model không tự kích hoạt chúng. Người dùng gọi bằng `/skill:<name>` hoặc alias ngắn. Model-invoked skills vẫn có thể được Pi tự nạp khi description khớp yêu cầu.

## Runtime đi kèm

Package đăng ký hai extension:

1. [`extensions/aliases.ts`](extensions/aliases.ts) — input alias `/<name>` cho 22 skill. Extension command được Pi ưu tiên trước; prompt template trùng tên được extension phát hiện và nhường lại. Alias biến đổi input sang `/skill:<name>` trước bước skill expansion; canonical command luôn là đường chuẩn và là dạng hiện trong command picker.
2. [`extensions/subagent/index.ts`](extensions/subagent/index.ts) — child Pi process cô lập, hỗ trợ single, parallel và chain.

Năm agent bundle sẵn:

- `explorer` — khảo sát code read-only;
- `planner` — lập plan/interface alternative read-only;
- `reviewer` — review read-only;
- `researcher` — nghiên cứu nguồn sơ cấp read-only;
- `worker` — implement trong phạm vi được giao.

Xem chi tiết về precedence, scope và giới hạn song song tại [docs/architecture.vi.md](docs/architecture.vi.md).

## Herdr và `pi-task` (tùy chọn)

`md-matt` không hard-depend vào terminal multiplexer hay một package điều phối bên ngoài. Nếu cần task dài, chạy nền, quan sát được trong Herdr và có thể resume, có thể cài riêng integration chính thức cùng phiên bản `pi-task` đã audit:

```bash
herdr integration install pi
pi install npm:@heyhuynhgiabuu/pi-task@0.3.0
```

Hai tool có ranh giới rõ ràng:

| Tool | Dùng khi |
|---|---|
| `subagent` | Công việc ngắn, blocking, cần kết quả inline hoặc orchestration single/parallel/chain có cấu trúc. Child process không tạo pane Herdr riêng. |
| `task` | Công việc dài, foreground/background, cần pane Herdr quan sát được, session bền và restore sau restart. |

Không giao cùng một công việc cho cả hai tool. Parent vẫn phải đọc artifact/diff và tự chạy verification trước khi chấp nhận kết quả. Không cài `pi-herdr-subagents` song song với package này vì extension đó cũng đăng ký tên tool `subagent`; tránh giữ thêm runtime delegation khác nếu không có routing policy riêng.

`pi-task` và Herdr là dependency vận hành tùy chọn, không được bundle hoặc tự cài bởi `md-matt`. Session/registry của integration nằm dưới `.pi/artifacts/`, `.pi/task-registry.json` và `.pi/task-session-history.json`; các path này được ignore khỏi git.

## Phụ thuộc tùy workflow

- Pi Coding Agent `>= 0.80.6` là baseline đã kiểm chứng.
- `gh` cho GitHub tracker; `glab` cho GitLab; một số truy vấn dùng `jq`.
- Network access cho research và CDN của HTML report.
- Browser do người dùng mở cho UI prototype, lesson và architecture report; package có manual fallback, không yêu cầu browser tool.
- Local-markdown tracker dưới `.scratch/` không cần CLI tracker bên ngoài.

## Kiểm chứng

```bash
npm install
npm run validate
npm run typecheck
npm test
npm run pack:check
```

Validator kiểm tra inventory 39/22, frontmatter, invocation policy, link tương đối, dependency giữa skill, alias catalog, bundled agents và legacy harness tokens.

## Tài liệu

- [Audit đủ 39 skill](docs/port-audit.vi.md)
- [Kiến trúc bản port](docs/architecture.vi.md)
- [Mô hình bảo mật](SECURITY.md)
- [Nguồn upstream và cách đồng bộ](UPSTREAM.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Nguồn và giấy phép

Skill gốc: Copyright © 2026 Matt Pocock, MIT. Runtime subagent được chuyển thể từ ví dụ chính thức của Pi: Copyright © 2025 Mario Zechner, MIT. Xem [LICENSE](LICENSE), [UPSTREAM.md](UPSTREAM.md) và [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
