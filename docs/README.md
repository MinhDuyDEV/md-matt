# Tài liệu trong fork `md-matt`

## Tài liệu canonical cho bản Pi

- [Kiến trúc](architecture.vi.md)
- [Audit đủ 39 skill](port-audit.vi.md)
- [Bảo mật](../SECURITY.md)
- [Nguồn upstream](../UPSTREAM.md)

Các file trên cùng root `README.md` là tài liệu được đóng gói khi phát hành npm.

## Snapshot tài liệu upstream

`docs/engineering/` và `docs/productivity/` là các trang human-facing của upstream `mattpocock/skills`, được giữ trong git để dễ so sánh và đồng bộ. Chúng mô tả sản phẩm upstream đa harness và có thể dùng bare slash commands hoặc wording chưa phản ánh runtime Pi của fork.

Khi tài liệu snapshot và `SKILL.md` đã port khác nhau, thứ tự ưu tiên là:

1. `skills/**/SKILL.md` và support files cạnh nó — behavior contract;
2. `README.md`, `docs/architecture.vi.md`, `docs/port-audit.vi.md` — contract của fork Pi;
3. `docs/engineering/`, `docs/productivity/` — tham khảo upstream.

Snapshot upstream không được đưa vào npm tarball của `md-matt`; git/local installs vẫn giữ chúng như provenance.
