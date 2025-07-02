# Flask Blogging Website

A modern, full-featured blogging platform built with Flask. Users can register, log in, create posts with images/videos, like and comment on posts, and manage their content. Includes an admin dashboard for user and post management.

## Features

- User registration and login (with password reset)
- Create, edit, and delete blog posts
- Upload images and videos to posts
- Like and comment on posts
- Paginated posts and user dashboard
- Admin dashboard for managing users and posts
- Responsive, modern UI
- Email notifications (welcome, password reset)
- Full application logging to `app.log`

## Getting Started

### Prerequisites

- Python 3.8+
- (Recommended) Create and activate a virtual environment:
  ```bash
  python -m venv venv
  # On Windows:
  venv\Scripts\activate
  # On Mac/Linux:
  source venv/bin/activate
  ```

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Blogging_website
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Configuration

- Copy or create a `.env` file in the project root with the following:
  ```env
  SECRET_KEY=your_secret_key_here
  ```
- (Optional) Update email settings in `app.py` for Flask-Mailman if you want email features.

### Database Setup

- Initialize the database and create the admin user:
  ```bash
  python create_db.py
  ```
  This creates `instance/blog.db` and an admin user (`admin@xyz.com` / `admin@123`).

### Running the App

- Start the Flask development server:
  ```bash
  python run.py
  ```
- Visit [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

### Default Admin Login

- Username: `admin`
- Email: `admin@xyz.com`
- Password: `admin@123`

## Logging

- All application logs are written to `app.log` in the project root.
- Check this file for errors, warnings, and debug information.

## Folder Structure

```
Blogging_website/
  app.py
  create_db.py
  run.py
  requirements.txt
  extensions.py
  models/
  controllers/
  routes/
  static/
  templates/
  instance/
```

## License

MIT or your chosen license.

---

Feel free to contribute or open issues for improvements!
