from sqlalchemy import Column, BigInteger, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)          # Telegram user ID (or negative for guests)
    first_name = Column(String(128), nullable=False)
    last_name = Column(String(128), nullable=True)
    username = Column(String(128), nullable=True)
    photo_url = Column(String(512), nullable=True)
    language_code = Column(String(10), nullable=True)
    is_guest = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), onupdate=func.now())
