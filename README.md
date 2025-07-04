# ECOTRACE 🌱

**A comprehensive digital waste management system for sustainable waste tracking and collection coordination.**

ECOTRACE is a modern web application that digitalizes and streamlines waste management processes, connecting individuals, companies, logistics coordinators, transporters, and technicians in an efficient eco-friendly ecosystem.

## ✨ Features

### Multi-Role System
- **Individuals**: Submit waste collection requests, track pickups, manage personal profiles
- **Companies**: Plan and manage large-scale waste collections, track corporate sustainability metrics
- **Administrators**: Oversee system operations, manage users, generate comprehensive reports
- **Logistics Coordinators**: Plan collection routes, track traceability, verify collection requests
- **Transporters**: Manage collection schedules, confirm pickups, update collection status
- **Technicians**: Handle waste processing, validate waste treatment, update waste valorization status

### Core Functionality
- **Digital Waste Tracking**: Complete traceability from collection request to final processing
- **Smart Collection Planning**: Automated route optimization and scheduling
- **Real-time Notifications**: Keep all stakeholders informed throughout the process
- **Comprehensive Reporting**: Generate detailed analytics and sustainability metrics
- **User Management**: Role-based access control with secure authentication
- **Mobile-Responsive Design**: Access from any device, anywhere

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI library for building interactive user interfaces
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Axios** - HTTP client for API communication
- **ESLint** - Code linting for consistent code quality

### Backend
- **Django 4.2** - Robust Python web framework
- **Django REST Framework** - Powerful toolkit for building APIs
- **JWT Authentication** - Secure token-based authentication
- **CORS Headers** - Cross-origin resource sharing support
- **Token Blacklisting** - Enhanced security for user sessions

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **pip** (Python package manager)
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ecotrace.git
cd ecotrace
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### CORS Configuration
The backend is configured to accept requests from `localhost:3000` and `127.0.0.1:3000` by default.

## 🎯 Usage

1. **Access the Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - Admin Panel: `http://localhost:8000/admin`

2. **User Registration**
   - Create accounts for different user types
   - Verify email addresses
   - Set up user profiles

3. **Waste Management Workflow**
   - Submit waste collection requests
   - Plan and schedule collections
   - Track waste throughout the process
   - Generate reports and analytics

## 📁 Project Structure

```
ecotrace/
├── backend/
│   ├── ecotrace_backend/          # Django project settings
│   ├── users/                     # User management app
│   ├── waste_management/          # Core waste management functionality
│   ├── notifications/             # Notification system
│   └── manage.py                  # Django management script
├── frontend/
│   ├── src/                       # React source code
│   ├── public/                    # Static assets
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
└── README.md                     # This file
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Token refresh

### Waste Management
- `GET /api/waste/collections/` - List collections
- `POST /api/waste/collections/` - Create collection request
- `GET /api/waste/collections/{id}/` - Get collection details
- `PUT /api/waste/collections/{id}/` - Update collection

### Users
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/profile/` - Update user profile

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📱 Responsive Design

ECOTRACE is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices
- Various screen sizes and orientations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🌟 Acknowledgments

- Built with sustainability and environmental consciousness in mind
- Designed to promote circular economy principles
- Inspired by the need for efficient waste management solutions


## 🔮 Future Enhancements

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] IoT sensor integration
- [ ] Machine learning for route optimization
- [ ] Multi-language support
- [ ] Third-party service integrations

---

**Made with ❤️ for a sustainable future**
