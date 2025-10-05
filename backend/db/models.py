from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)  
    email = Column(String, index=True)
    name = Column(String)
    classes = relationship("Class", back_populates="owner", cascade="all, delete-orphan")

class Class(Base):
    __tablename__ = "classes"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    code = Column(String)
    instructor = Column(String)
    term = Column(String)
    location = Column(String)
    meeting_times = Column(Text)
    grading_policy = Column(Text)
    notes = Column(Text)

    owner = relationship("User", back_populates="classes")
    requirements = relationship("Requirement", back_populates="clazz", cascade="all, delete-orphan")

class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(String, primary_key=True)
    class_id = Column(String, ForeignKey("classes.id"))
    kind = Column(String)      
    title = Column(String)
    weight = Column(Float)
    due = Column(String)
    details = Column(Text)

    clazz = relationship("Class", back_populates="requirements")
