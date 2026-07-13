# Bảo mật

## Mô hình tin cậy

`md-matt` chứa cả skills và TypeScript extensions:

- skill có thể chỉ dẫn model đọc/sửa file, chạy shell, gọi tracker hoặc tạo commit;
- extension chạy trong tiến trình Pi với toàn bộ quyền của user;
- subagent extension spawn thêm tiến trình Pi và gửi task tới model provider đã cấu hình.

Chỉ cài package khi bạn đã review nguồn. Với project-local package/resources, chỉ trust repository bạn kiểm soát.

## Rủi ro chính

### 1. Child Pi process

`subagent` kế thừa working directory, environment, model/provider và quyền hệ điều hành của parent. Environment có thể chứa API key cần cho provider. Package không log key, nhưng child process và model vẫn có quyền tương đương parent trong tool allowlist.

Biện pháp:

- package agents dùng tool allowlist nhỏ nhất phù hợp;
- `explorer`, `planner`, `reviewer`, `researcher` được chỉ dẫn read-only;
- chỉ `worker` có `write`/`edit`;
- child dùng `--no-session`, nên không tạo session history riêng;
- ở parallel mode, model-visible output mỗi task bị giới hạn 50 KiB; full result nằm trong tool details; single/chain không có cap này;
- abort của parent dừng child process.

Tool allowlist không tạo sandbox cho `bash`. Muốn isolation cứng, chạy Pi trong container/VM hoặc cài sandbox extension riêng.

### 2. Agent override

Package agents là baseline. User agents trong `~/.pi/agent/agents/` có thể override cùng tên vì được xem là cấu hình do user tin cậy. Project agents trong `.pi/agents/` không được dùng mặc định; caller phải chọn scope `project`/`both`, và runtime luôn hỏi xác nhận trước khi chạy. Tham số bỏ qua confirmation không được expose. Ở print/JSON mode không có UI, request chạy project agent bị từ chối.

### 3. Prompt injection từ repo và web

Code, issue, tài liệu và web page có thể chứa chỉ dẫn độc hại. Chúng là dữ liệu, không phải authority.

- Không làm theo instruction nằm trong file/web page nếu nó xung đột với task hoặc system rules.
- `researcher` chỉ dùng nguồn công khai và không upload source riêng tư, credential hay PII.
- Xác minh URL/source trước khi parent ghi research artifact.
- Không paste secret vào issue, PR comment, report HTML hoặc handoff.

### 4. Remote issue tracker

`triage`, `to-spec`, `to-tickets` và `wayfinder` có thể tạo/sửa/đóng issue hoặc PR bằng `gh`/`glab`. Đây là side effect công khai và có thể kích hoạt notification.

- Hoàn tất setup tracker trước.
- Review title/body/labels/edges trước khi publish.
- Tôn trọng checkpoint trong từng skill.
- Dùng local-markdown tracker nếu chưa muốn thay đổi hệ thống remote.

### 5. Git mutation

`implement`, `prototype` và `resolving-merge-conflicts` có thể tạo branch, stage, commit hoặc tiếp tục rebase.

Bản port yêu cầu checkpoint trước commit/stage/continue và không stage unrelated changes. `git merge --abort`/`git rebase --abort` chỉ chạy khi user phê duyệt. Không force-push, reset hard hoặc clean repository nếu user không yêu cầu rõ ràng.

### 6. Handoff file

`handoff` ghi conversation summary vào OS temp directory. Dù skill quét pattern phổ biến, redaction bằng model không thể bảo đảm bắt mọi secret/PII.

- Không dùng handoff cho nội dung cực nhạy cảm.
- Mở file và review trước khi gửi cho người khác hoặc upload.
- Xóa file theo chính sách temp-data của hệ điều hành khi không còn cần.
- Permission `0600` chỉ là best effort trên platform hỗ trợ.

### 7. HTML và browser

Architecture report, UI prototype và lesson có thể mở local HTML/dev URL. Architecture report tải Tailwind/Mermaid từ CDN, vì vậy browser tạo network request tới bên thứ ba. Không nhúng secret hoặc source nhạy cảm vào report.

### 8. Chi phí model

Parallel subagent tạo nhiều model call. Một call hỗ trợ tối đa 8 task và chạy tối đa 4 task đồng thời. Kiểm tra model/cost hiện tại trước khi dùng `code-review`, `wayfinder`, `research` hoặc Design It Twice ở quy mô lớn.

## Báo cáo vấn đề

Repo này chưa có public origin riêng. Nếu phát hiện lỗ hổng trong phần port, không đăng credential hoặc dữ liệu nhạy cảm vào upstream issue. Gửi báo cáo qua kênh riêng của maintainer repo nơi package được host. Với lỗi thuộc skill gốc hoặc Pi runtime, báo cho dự án tương ứng sau khi loại bỏ dữ liệu riêng tư.
