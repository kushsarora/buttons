from sqlalchemy import Column, String, Text, ForeignKey, JSON
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

    notes = Column(Text)
    grading_policy = Column(Text)

    meetings = Column(JSON, default=list)     
    assignments = Column(JSON, default=list) 
    exams = Column(JSON, default=list)      
    schedule = Column(JSON, default=list)  


    custom_events = Column(JSON, default=list) 

    owner = relationship("User", back_populates="classes")
