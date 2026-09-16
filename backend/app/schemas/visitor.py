"""访客登录的数据模型：只接受访客名与密码，不接受任何其它字段。"""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class VisitorLoginRequest(BaseModel):
    """访客登录请求；密码只在这一次请求里出现，服务器只保存哈希。"""

    username: str = Field(..., min_length=1, max_length=64, description="访客名")
    password: str = Field(..., min_length=1, max_length=200, description="访客密码")
    model_config = ConfigDict(extra="forbid")


class VisitorLoginResponse(BaseModel):
    """登录成功后的短期凭证，浏览器拿它换取 30 天的访问 Cookie。"""

    ok: Literal[True] = True
    name: str = Field(..., description="访客显示名")
    username: str = Field(..., description="规范化后的访客名，后续应用接口用它标识访客")
    apps: list[str] = Field(default_factory=list, description="该访客被授权的应用 id")
    proof: str = Field(..., description="绑定当前浏览器会话的短期签名")
