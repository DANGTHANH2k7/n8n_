#!/bin/bash
# Script để chạy n8n và tự động load file .env vào biến môi trường hệ thống

# Đọc file .env và export tất cả các biến vào hệ thống
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✅ Đã load file .env thành công!"
else
  echo "❌ Không tìm thấy file .env"
  exit 1
fi

# Cấp quyền cho n8n đọc biến môi trường trong Code node và Expressions
export N8N_BLOCK_ENV_ACCESS_IN_NODE=false
export NODE_FUNCTION_ALLOW_ENV=true

echo "🚀 Đang khởi động n8n..."
# Khởi động n8n (sử dụng npx nếu cài cục bộ)
npx n8n start
