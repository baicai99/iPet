#!/usr/bin/env bash
#
# iPet Nginx 部署脚本
# 用途：一键部署 Nginx 配置到生产环境
#
# 使用方式：
#   bash deploy.sh              # 正常部署
#   bash deploy.sh --dry-run    # 模拟运行，不实际修改
#   bash deploy.sh --rollback   # 回滚到备份配置
#

set -euo pipefail

# ============================================================
# 配置变量
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_SOURCE="${SCRIPT_DIR}/production.conf"
CONFIG_TARGET="/etc/nginx/sites-available/ipet"
CONFIG_ENABLED="/etc/nginx/sites-enabled/ipet"
BACKUP_DIR="/etc/nginx/backups"
FRONTEND_ROOT="/var/www/ipet"
CERTBOT_WEBROOT="/var/www/certbot"

DRY_RUN=false
ROLLBACK=false

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================
# 辅助函数
# ============================================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要 root 权限运行"
        log_info "请使用: sudo bash deploy.sh"
        exit 1
    fi
}

check_nginx() {
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx 未安装"
        log_info "请先安装 Nginx: apt install nginx"
        exit 1
    fi
    log_info "Nginx 版本: $(nginx -v 2>&1)"
}

check_config_exists() {
    if [[ ! -f "$CONFIG_SOURCE" ]]; then
        log_error "配置文件不存在: $CONFIG_SOURCE"
        exit 1
    fi
}

validate_config() {
    log_info "验证 Nginx 配置语法..."
    if nginx -t 2>&1; then
        log_info "配置语法验证通过 ✓"
        return 0
    else
        log_error "配置语法错误 ✗"
        return 1
    fi
}

backup_config() {
    if [[ -f "$CONFIG_TARGET" ]]; then
        mkdir -p "$BACKUP_DIR"
        local backup_file="${BACKUP_DIR}/ipet.$(date +%Y%m%d_%H%M%S).conf"
        cp "$CONFIG_TARGET" "$backup_file"
        log_info "已备份现有配置到: $backup_file"
    fi
}

deploy_config() {
    log_info "部署配置文件..."
    
    # 确保目录存在
    mkdir -p "$(dirname "$CONFIG_TARGET")"
    mkdir -p "$FRONTEND_ROOT"
    mkdir -p "$CERTBOT_WEBROOT"
    
    # 复制配置
    cp "$CONFIG_SOURCE" "$CONFIG_TARGET"
    log_info "已复制配置到: $CONFIG_TARGET"
    
    # 创建软链接
    if [[ ! -L "$CONFIG_ENABLED" ]]; then
        ln -s "$CONFIG_TARGET" "$CONFIG_ENABLED"
        log_info "已创建软链接: $CONFIG_ENABLED"
    else
        log_info "软链接已存在: $CONFIG_ENABLED"
    fi
}

reload_nginx() {
    log_info "重载 Nginx..."
    systemctl reload nginx
    log_info "Nginx 已重载 ✓"
}

do_rollback() {
    local latest_backup=$(ls -t "${BACKUP_DIR}"/ipet.*.conf 2>/dev/null | head -n 1)
    if [[ -z "$latest_backup" ]]; then
        log_error "没有找到备份文件"
        exit 1
    fi
    
    log_info "回滚到: $latest_backup"
    cp "$latest_backup" "$CONFIG_TARGET"
    
    if validate_config; then
        reload_nginx
        log_info "回滚完成 ✓"
    else
        log_error "回滚后配置验证失败"
        exit 1
    fi
}

show_status() {
    echo ""
    log_info "=============== 部署状态 ==============="
    echo "配置源文件:   $CONFIG_SOURCE"
    echo "配置目标:     $CONFIG_TARGET"
    echo "软链接:       $CONFIG_ENABLED"
    echo "前端目录:     $FRONTEND_ROOT"
    echo ""
    
    if systemctl is-active --quiet nginx; then
        log_info "Nginx 状态:   运行中 ✓"
    else
        log_warn "Nginx 状态:   未运行 ✗"
    fi
    
    echo ""
    log_info "========================================="
}

show_next_steps() {
    echo ""
    log_info "=============== 后续步骤 ==============="
    echo "1. 确保 TLS 证书已配置:"
    echo "   certbot --nginx -d api.zhengjiyuan.top -d ipet.zhengjiyuan.top"
    echo ""
    echo "2. 部署前端静态文件到:"
    echo "   $FRONTEND_ROOT"
    echo ""
    echo "3. 确保后端服务运行在 127.0.0.1:3000:"
    echo "   pm2 status ipet-backend"
    echo ""
    echo "4. 测试健康检查:"
    echo "   curl https://api.zhengjiyuan.top/api/system/health"
    log_info "========================================="
}

# ============================================================
# 参数解析
# ============================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        -h|--help)
            echo "用法: bash deploy.sh [OPTIONS]"
            echo ""
            echo "选项:"
            echo "  --dry-run    模拟运行，不实际修改"
            echo "  --rollback   回滚到上一个备份"
            echo "  -h, --help   显示帮助信息"
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            exit 1
            ;;
    esac
done

# ============================================================
# 主流程
# ============================================================
main() {
    echo ""
    log_info "========== iPet Nginx 部署脚本 =========="
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warn "模拟运行模式 - 不会实际修改任何文件"
        echo ""
    fi
    
    # 回滚模式
    if [[ "$ROLLBACK" == true ]]; then
        check_root
        do_rollback
        exit 0
    fi
    
    # 前置检查
    if [[ "$DRY_RUN" != true ]]; then
        check_root
    fi
    check_nginx
    check_config_exists
    
    # 预验证（使用源配置测试语法）
    log_info "预验证配置语法..."
    if ! nginx -t -c "$CONFIG_SOURCE" 2>/dev/null; then
        # 直接测试可能失败（因为 include 路径），跳过
        log_warn "预验证跳过（需要完整环境）"
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "DRY-RUN: 将备份现有配置"
        log_info "DRY-RUN: 将复制 $CONFIG_SOURCE 到 $CONFIG_TARGET"
        log_info "DRY-RUN: 将创建软链接 $CONFIG_ENABLED"
        log_info "DRY-RUN: 将重载 Nginx"
        show_status
        exit 0
    fi
    
    # 正式部署
    backup_config
    deploy_config
    
    if validate_config; then
        reload_nginx
        show_status
        show_next_steps
        echo ""
        log_info "部署完成 ✓"
    else
        log_error "配置验证失败，请检查错误"
        log_info "尝试回滚: bash deploy.sh --rollback"
        exit 1
    fi
}

main
