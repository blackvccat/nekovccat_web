"""访客账号表：DATABASE_ENABLED 打开时，这里的账号与本地 JSON 里的账号一起生效。"""
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class VisitorAccountRecord(Base):
    __tablename__ = "visitor_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # 规范化后的访客名（小写、去空白），唯一。
    username = Column(String(64), unique=True, nullable=False, index=True)
    display_name = Column(String(64), nullable=False)
    # scripts/add-visitor.py 生成的 pbkdf2 哈希（--db 直接写库时由脚本自己算）；绝不存明文密码。
    password_hash = Column(String(255), nullable=False)
    # 允许该访客打开的应用 id，逗号分隔（例如 "our-space,guest-book"）；空串表示他的访客页没有任何应用。
    apps = Column(String(255), nullable=False, default="")
    disabled = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
