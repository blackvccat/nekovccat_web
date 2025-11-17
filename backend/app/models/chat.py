from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
""" 这里是 SQLAlchemy 的模型文件，用于定义数据库表结构 结构有 用户表，聊天会话表，聊天消息表 对应的分别是 user，chat_session，chat_message 表 """
