from fastapi import FastAPI, Depends, HTTPException, status, Security, APIRouter, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
#from passlib.context import CryptContext
import os
#from jose import jwt, JWTError, ExpiredSignatureError
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from datetime import datetime, timedelta
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi.middleware.cors import CORSMiddleware
import uuid
import random
from sqlalchemy.orm import joinedload
from typing import List, Optional
import secrets
import string
from dotenv import load_dotenv