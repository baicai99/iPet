# iPet 发布清单

每次发布前、中、后的检查项。

---

## 发布前检查

- [ ] 代码已合并到 `main` 分支
- [ ] 数据库迁移文件已提交（如有变更）
- [ ] 重大变更已通知相关人员

## 发布步骤

| 步骤 | 命令 | 验证 |
|------|------|------|
| 1. 拉取代码 | `git pull origin main` | 无冲突 |
| 2. 安装依赖 | `npm ci` | 无错误 |
| 3. 生成 Prisma | `npx prisma generate` | 无错误 |
| 4. **执行迁移** | `npx prisma migrate deploy` | 无错误 |
| 5. 构建 | `npm run build` | 无错误 |
| 6. 启动服务 | `pm2 restart ipet-backend` | 进程运行中 |
| 7. **冒烟测试** | `bash scripts/smoke_test.sh` | 输出 `PASS` |

## 发布后验证

- [ ] `/api/infra/health` 返回 `{"status":"ok"}`
- [ ] 冒烟测试全部通过
- [ ] 无异常错误日志
- [ ] 前端功能正常

## 回滚触发条件

以下任一情况发生时，**立即回滚**：

1. 冒烟测试失败（非网络原因）
2. 错误率超过 5%
3. 核心功能（登录/注册）不可用
4. 数据库连接失败

## 回滚步骤

```bash
# 1. 切换到上一个稳定版本
git checkout <last-stable-commit>

# 2. 重新部署
npm ci
npm run build
pm2 restart ipet-backend

# 3. 验证
bash scripts/smoke_test.sh
```

---

**最后更新**：2024-12-24
