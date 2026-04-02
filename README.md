# AI PDF Toolkit

A comprehensive full-stack application for processing PDF documents with AI-powered features. Built with FastAPI backend and React frontend, this toolkit provides tools for splitting, converting, analyzing, and manipulating PDF files using advanced AI models.

## Features

- **PDF Processing Tools**: Split, merge, convert PDFs to various formats (DOCX, PPTX, XLSX, images)
- **AI-Powered Analysis**: Extract text, summarize content, and analyze documents using OpenAI GPT and Google Gemini
- **File Upload/Download**: Secure file handling with Cloudinary integration
- **Authentication**: JWT-based user authentication system
- **Security**: Built-in security features for file processing
- **Real-time Chat Assistant**: AI-powered chat interface for document queries
- **Contact System**: Integrated contact form with email notifications
- **Responsive UI**: Modern React interface with Tailwind CSS

## Tech Stack

### Backend
- **FastAPI**: High-performance async web framework
- **Python**: Core language
- **MongoDB**: NoSQL database with Motor async driver
- **AI Integration**: OpenAI GPT-4, Google Gemini
- **File Processing**: PyMuPDF, PyPDF2, pdf2image, pdf2docx, etc.
- **Authentication**: JWT tokens
- **Cloud Storage**: Cloudinary

### Frontend
- **React 18**: UI framework with TypeScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

## Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud instance)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd filegenie-root
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

## Environment Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/pdftoolkit

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Cloudinary Configuration (for file storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Configuration (for contact form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
CONTACT_NOTIFY_EMAIL=admin@yourdomain.com
CONTACT_FROM_EMAIL=noreply@yourdomain.com

# File Upload Configuration
MAX_UPLOAD_MB=20
UPLOAD_DIR=uploads
TEMP_DIR=temp
DOWNLOAD_TTL_SECONDS=3600

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Running the Application

1. **Start the Backend**
   ```bash
   # From the root directory
   npm run backend
   ```
   The backend will start on `http://localhost:8000`

2. **Start the Frontend**
   ```bash
   # From the root directory
   npm run frontend
   ```
   The frontend will start on `http://localhost:5173`

3. **Access the Application**
   Open your browser and navigate to `http://localhost:5173`

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
filegenie-root/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Application configuration
│   ├── requirements.txt        # Python dependencies
│   ├── routes/                 # API route handlers
│   │   ├── ai_routes.py        # AI-powered features
│   │   ├── auth_routes.py      # Authentication
│   │   ├── upload_routes.py    # File uploads
│   │   ├── download_routes.py  # File downloads
│   │   ├── tools_routes.py     # PDF processing tools
│   │   └── ...
│   ├── services/               # Business logic services
│   ├── utils/                  # Utility functions
│   └── temp/                   # Temporary file storage
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React context providers
│   │   ├── services/           # API service functions
│   │   └── ...
│   ├── public/                 # Static assets
│   └── package.json            # Frontend dependencies
└── package.json                # Root scripts
```

## Development

### Backend Development
- The backend uses `uvicorn` with auto-reload for development
- All routes are organized in the `routes/` directory
- Services contain the core business logic
- Utilities provide common functionality

### Frontend Development
- Uses Vite for fast development and building
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@yourdomain.com or create an issue in the repository.
